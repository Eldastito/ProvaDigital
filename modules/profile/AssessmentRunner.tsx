
import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Brain, X, ShieldCheck, Activity } from 'lucide-react';
import { AssessmentType } from '../../types';
import { generateAssessmentReport } from '../../services/geminiService';
import { ASSESSMENTS_DATA } from '../../utils/assessmentData';

interface AssessmentRunnerProps {
    type: AssessmentType;
    userName: string;
    onComplete: (result: any) => void;
    onCancel: () => void;
}

export const AssessmentRunner = ({ type, userName, onComplete, onCancel }: AssessmentRunnerProps) => {
    const questions = ASSESSMENTS_DATA[type] || [];
    const [step, setStep] = useState<'CONSENT' | 'QUESTIONS'>('CONSENT');
    const [consentGiven, setConsentGiven] = useState(false);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<{ question: string, answer: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleStart = () => {
        if (consentGiven) setStep('QUESTIONS');
    };

    const handleOptionSelect = async (option: string) => {
        const newAnswers = [...answers, { question: questions[currentIndex].question, answer: option }];
        
        if (currentIndex < questions.length - 1) {
            setAnswers(newAnswers);
            setCurrentIndex(currentIndex + 1);
        } else {
            // Finish
            setAnswers(newAnswers);
            setLoading(true);
            
            const report = await generateAssessmentReport(userName, type, newAnswers);
            
            onComplete({
                type,
                date: new Date().toISOString(),
                ...report
            });
            setLoading(false);
        }
    };

    const progress = ((currentIndex) / questions.length) * 100;

    const isClinical = type === AssessmentType.TDAH_SCREENING || type === AssessmentType.AUTISM_SCREENING || type === AssessmentType.LEARNING_SCREENING;

    if (step === 'CONSENT') {
        return (
             <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl mx-auto overflow-hidden flex flex-col h-full p-8 animate-in slide-in-from-bottom-4">
                 <div className="flex justify-between items-start mb-6">
                     <div className={`p-3 rounded-full ${isClinical ? 'bg-rose-100 text-rose-600' : 'bg-brand-light text-brand-primary'}`}>
                         <ShieldCheck size={32} />
                     </div>
                     <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">
                     {isClinical ? 'Consentimento de Triagem Neuropsicopedagógica' : 'Consentimento de Dados (LGPD)'}
                 </h2>
                 
                 <div className="prose prose-sm text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <p className="mb-2">Para prosseguir com o instrumento de <strong>{type.replace(/_/g, ' ')}</strong>, precisamos processar as respostas.</p>
                     
                     {isClinical && (
                         <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded mb-4 text-xs font-bold">
                             ⚠️ AVISO LEGAL: Este instrumento baseia-se em critérios do DSM-5, TDE, TOL e outras escalas padronizadas, mas funciona como TRIAGEM PEDAGÓGICA. O resultado NÃO substitui diagnóstico médico oficial realizado por equipe multidisciplinar.
                         </div>
                     )}

                     <p className="mb-2"><strong>Protocolo de Aplicação:</strong></p>
                     <ul className="list-disc pl-4 space-y-1">
                         <li>A avaliação pode ser realizada em sessões, observando o aluno em diferentes contextos.</li>
                         <li>As respostas devem refletir o comportamento padrão nos últimos 6 meses.</li>
                         <li>Os dados gerados serão processados pela IA para sugerir hipóteses diagnósticas e encaminhamentos.</li>
                     </ul>
                 </div>

                 <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setConsentGiven(!consentGiven)}>
                     <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${consentGiven ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-300 bg-white'}`}>
                         {consentGiven && <CheckCircle size={16} />}
                     </div>
                     <span className="text-sm font-medium text-slate-700 select-none">Confirmo que sou responsável autorizado para realizar esta triagem.</span>
                 </div>

                 <button 
                    onClick={handleStart}
                    disabled={!consentGiven}
                    className="w-full py-4 bg-brand-dark text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary transition shadow-lg flex items-center justify-center gap-2"
                 >
                     Iniciar Sessão de Triagem <ArrowRight size={18}/>
                 </button>
             </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                <Brain size={80} className="text-brand-secondary animate-pulse mb-8"/>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Processando Neuroanálise...</h3>
                <p className="text-slate-600 text-xl max-w-xl leading-relaxed">
                    A Inteligência Artificial está cruzando suas respostas com padrões de TDE, Funções Executivas e critérios diagnósticos.
                </p>
                <div className="mt-8 flex gap-3 justify-center">
                    <div className="w-4 h-4 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-4 h-4 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-4 h-4 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl mx-auto overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="bg-white p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">{type.replace(/_/g, ' ')}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        {isClinical ? (
                            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded flex items-center gap-1"><Activity size={12}/> INSTRUMENTO CLÍNICO</span>
                        ) : (
                            <span className="text-xs font-bold bg-brand-light text-brand-primary px-2 py-1 rounded">AVALIAÇÃO DE PERFIL</span>
                        )}
                        <p className="text-sm text-slate-400 font-medium">Item {currentIndex + 1} de {questions.length}</p>
                    </div>
                </div>
                <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"><X size={28}/></button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-50 h-2">
                <div className={`h-2 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] ${isClinical ? 'bg-gradient-to-r from-rose-400 to-red-600' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`} style={{ width: `${progress}%` }}></div>
            </div>

            {/* Question Area */}
            <div className="p-12 flex-1 flex flex-col justify-center bg-slate-50/30">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-12 leading-snug text-center max-w-3xl mx-auto">
                    {questions[currentIndex]?.question}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
                    {questions[currentIndex]?.options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleOptionSelect(opt)}
                            className="text-left p-6 rounded-2xl border-2 border-white bg-white hover:border-brand-primary hover:bg-sky-50 transition-all duration-200 group flex flex-col justify-center shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-brand-primary/10 transition-colors"></div>
                            <span className="text-lg text-slate-700 font-semibold group-hover:text-brand-dark relative z-10">{opt}</span>
                            <div className="mt-4 flex items-center text-brand-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Selecionar <ArrowRight size={16} className="ml-2"/>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 text-center text-sm text-slate-400 font-medium">
                {isClinical ? "Observação Clínica: Considere frequência, intensidade e contexto." : "Responda com honestidade."}
            </div>
        </div>
    );
};
