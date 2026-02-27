
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Send, Brain, Sparkles, Bot, ShieldAlert, BookOpen, CheckCircle } from 'lucide-react';
import { AppState, User, OwlSession, ExamStatus } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { askOwlTutor } from '../../services/geminiService';
import { useSafeAppStore } from '../../store/useAppStore';
import { uuidv4 } from '../../utils/helpers';

interface OwlTutorViewProps {
    state: AppState;
    user: User;
}

export const OwlTutorView = () => {
    const state = useSafeAppStore();
    const { currentUser: user } = state;
    const location = useLocation();
    const externalContext = location.state?.context;

    if (!user) return null;

    const student = state.students.find(s => s.id === user.id) || state.students[0];

    // Fallback student for simulation/admin preview if no students exist in state
    const effectiveStudent = student || {
        id: user.id || 'test-student',
        name: user.name || 'Estudante de Teste',
        tenantId: user.tenantId || 't-default',
        schoolId: '',
        classId: '',
        registrationNumber: 'TEST-001'
    };

    const analytics = new AnalyticsService();
    const stats = effectiveStudent ? analytics.getStudentStats(effectiveStudent.id) : null;

    // Identify Active Exams (Today + Published)
    const activeExams = state.exams.filter(e =>
        e.status === ExamStatus.ACTIVE &&
        e.scheduledDate === new Date().toISOString().split('T')[0]
    );
    const forbiddenTopics = activeExams.map(e => e.subject);

    // Session State
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);

    // Initialize messages after finding student
    useEffect(() => {
        if (effectiveStudent && messages.length === 0) {
            setMessages([
                {
                    role: 'model',
                    text: `Olá ${effectiveStudent.name.split(' ')[0]}! Sou o Corujão 🦉. ${stats ? `Vi que seu ponto forte é ${stats.strongestSubject} e podemos melhorar em ${stats.weakestSubject}.` : ''} Como posso ajudar hoje?`
                }
            ]);
        }
    }, [effectiveStudent, stats]);

    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { owlTutorContext } = state;
    const { setOwlTutorContext } = useSafeAppStore();

    // --- RATE LIMITING (Client Side) ---
    const checkRateLimit = () => {
        if (!effectiveStudent) return false;
        const STORAGE_KEY = `owl_rate_limit_${effectiveStudent.id}_${new Date().toISOString().split('T')[0]}`;
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        const LIMIT = 20; // safe daily limit for demo
        if (currentCount >= LIMIT) {
            return false;
        }
        localStorage.setItem(STORAGE_KEY, (currentCount + 1).toString());
        return true;
    };
    // -----------------------------------

    // Handle Context on Mount
    useEffect(() => {
        if (externalContext) {
            setMessages([
                { role: 'model', text: `Olá! Recebi os detalhes da sua recente avaliação. Notei pontos interessantes para conversarmos. O que você gostaria de esclarecer sobre o feedback que recebeu? 🦉` }
            ]);
        } else if (owlTutorContext) {
            // If there is a context (e.g. from Error Explanation), override initial state
            if (owlTutorContext.initialMessage) {
                // If it's a specific question/context, we start fresh-ish or append
                const initialMsg = { role: 'model' as const, text: owlTutorContext.initialMessage };
                setMessages([initialMsg]);
            }
        }
    }, [externalContext]); // Run on mount or context change

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        if (!checkRateLimit()) {
            setMessages(prev => [...prev, { role: 'model', text: "🦉 Ops! Você atingiu seu limite diário de perguntas ao Corujão. Volte amanhã para mais aprendizado!" }]);
            return;
        }

        const newMessages = [...messages, { role: 'user' as const, text: inputText }];
        setMessages(newMessages);
        setInputText('');
        setLoading(true);

        // Combine base context with specific context if available
        let context = `Ponto fraco: ${stats?.weakestSubject}. IDG (Nota Global): ${stats?.idgScore}.`;
        if (externalContext) {
            context += `\n[CONTEXTO DE RESULTADO DA PROVA]: ${externalContext}`;
        }
        if (owlTutorContext && owlTutorContext.contextData) {
            context += `\n[CONTEXTO ESPECÍFICO]: ${owlTutorContext.contextData}`;
        }

        if (!effectiveStudent) return;

        const responseText = await askOwlTutor(
            messages,
            inputText,
            effectiveStudent.name,
            context,
            forbiddenTopics, // Pass Active Exam Subjects to Block Cheating
            effectiveStudent.tenantId // RAG Scope (Tenant Isolation)
        );

        setMessages([...newMessages, { role: 'model', text: responseText }]);
        setLoading(false);
    };

    // --- TABS STATE ---
    const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

    // --- HISTORY DATA (Computed only if student exists) ---
    const studentResults = (state.results || [])
        .filter(r => r && r.studentId === effectiveStudent.id)
        .sort((a, b) => new Date(b.gradedAt || 0).getTime() - new Date(a.gradedAt || 0).getTime());

    const getExamTitle = (examId: string) => (state.exams || []).find(e => e && e.id === examId)?.title || 'Prova Removida';

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border border-brand-primary/20 shadow-lg overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[#0f1d2e] p-4 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-secondary p-2 rounded-full">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold flex items-center gap-2">Corujão Tutor <Sparkles size={14} className="text-yellow-400" /></h2>
                            <p className="text-xs text-slate-400">IA Educacional Potencializada pelo Gemini</p>
                        </div>
                    </div>
                    {forbiddenTopics.length > 0 && (
                        <div className="flex items-center gap-2 bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/50 text-xs text-rose-200 animate-pulse">
                            <ShieldAlert size={14} />
                            <span>Modo Prova Ativo</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'chat'
                            ? 'bg-brand-secondary text-white shadow-lg'
                            : 'bg-white/10 text-slate-400 hover:bg-white/20'
                            }`}
                    >
                        <Send size={16} /> Chat Tutor
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                            ? 'bg-brand-secondary text-white shadow-lg'
                            : 'bg-white/10 text-slate-400 hover:bg-white/20'
                            }`}
                    >
                        <BookOpen size={16} /> Meus Relatórios
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'chat' ? (
                <>
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50" ref={scrollRef}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
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
                                    <Brain size={16} className="animate-pulse text-brand-secondary" /> O Corujão está pensando...
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
                </>
            ) : (
                /* History Tab */
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-emerald-500" />
                        Provas Realizadas
                    </h3>

                    {studentResults.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Brain size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Você ainda não realizou nenhuma prova.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {studentResults.map(result => (
                                <div key={result.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{getExamTitle(result.examId)}</h4>
                                        <p className="text-xs text-slate-500">Concluída em {new Date(result.gradedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400">NOTA</span>
                                            <div className="text-xl font-black text-brand-primary">{result.totalScore.toFixed(1)}</div>
                                        </div>
                                        <Link
                                            to={`/online-exam/results/${result.examId}`}
                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-primary hover:text-white transition"
                                            title="Ver Relatório Completo"
                                        >
                                            <Bot size={20} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};
