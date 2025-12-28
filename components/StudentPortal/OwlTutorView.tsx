
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Brain, Sparkles, Bot, ShieldAlert } from 'lucide-react';
import { AppState, User, OwlSession, ExamStatus, Student, Exam, ExamRegistration, UserProfileExtended, ExamResult } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { askOwlTutor } from '../../services/geminiService';
import { uuidv4 } from '../../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents, fetchExams, fetchRegistrations, fetchUserProfiles, fetchResults } from '../../services/supabaseClient';

interface OwlTutorViewProps {
    state: AppState; // Still needed for overall AppState context if ever needed
    user: User;
}

export const OwlTutorView = ({ state, user }: OwlTutorViewProps) => {
    // Fetch all necessary data via React Query
    // @fix: Updated useQuery calls to new object syntax
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });

    const student = allStudents?.find(s => s.id === user.id) || allStudents?.[0];
    
    // Initialize AnalyticsService with fetched data
    const analytics = useMemo(() => new AnalyticsService(), []);
    // @fix: Pass empty arrays as fallbacks to getStudentStats
    const stats = student ? analytics.getStudentStats(student.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || []) : null;

    // Identify Active Exams (Today + Published)
    // @fix: Use optional chaining to safely access filter
    const activeExams = allExams?.filter(e => 
        e.status === ExamStatus.PUBLISHED && 
        e.scheduledDate === new Date().toISOString().split('T')[0]
    ) || [];
    const forbiddenTopics = activeExams.map(e => e.subject);

    // Session State
    const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
        { role: 'model', text: `Olá ${student?.name.split(' ')[0]}! Sou o Corujão 🦉. Vi que seu ponto forte é ${stats?.strongestSubject} e podemos melhorar em ${stats?.weakestSubject}. Como posso ajudar hoje?` }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;
        
        const newMessages = [...messages, { role: 'user' as const, text: inputText }];
        setMessages(newMessages);
        setInputText('');
        setLoading(true);

        const context = `Ponto fraco: ${stats?.weakestSubject}. IDG (Nota Global): ${stats?.idgScore}.`;
        
        const responseText = await askOwlTutor(
            messages,
            inputText,
            student?.name || 'Aluno', // Provide fallback
            context,
            forbiddenTopics // Pass Active Exam Subjects to Block Cheating
        );

        setMessages([...newMessages, { role: 'model', text: responseText }]);
        setLoading(false);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border border-brand-primary/20 shadow-lg overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[#0f1d2e] p-4 flex items-center gap-3 text-white justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-secondary p-2 rounded-full">
                        <Bot size={24} className="text-white"/>
                    </div>
                    <div>
                        <h2 className="font-bold flex items-center gap-2">Corujão Tutor <Sparkles size={14} className="text-yellow-400"/></h2>
                        <p className="text-xs text-slate-400">IA Educacional Potencializada pelo Gemini</p>
                    </div>
                </div>
                {forbiddenTopics.length > 0 && (
                    <div className="flex items-center gap-2 bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/50 text-xs text-rose-200 animate-pulse">
                        <ShieldAlert size={14} />
                        <span>Modo Prova Ativo: {forbiddenTopics.join(', ')} bloqueados.</span>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-brand-primary text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className="mb-1 last:mb-0">{line}</p>
                            ))}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-500 text-sm">
                            <Brain size={16} className="animate-pulse text-brand-secondary"/> O Corujão está pensando...
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-slate-700"
                        placeholder="Digite sua dúvida aqui..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !inputText.trim()}
                        className="bg-brand-primary hover:bg-brand-dark text-white p-3 rounded-xl disabled:opacity-50 transition"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">O Corujão pode cometer erros. Verifique informações importantes.</p>
            </div>
        </div>
    );
};
