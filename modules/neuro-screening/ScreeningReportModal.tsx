
import React from 'react';
import { Activity, AlertCircle, Award, Brain, CheckCircle, Printer, X, Calendar, User, FileText, ClipboardCheck, Zap } from 'lucide-react';
import { AssessmentResult, AssessmentType } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { uuidv4 } from '../../utils/helpers';

interface ScreeningReportModalProps {
    report: AssessmentResult;
    studentName: string;
    studentId: string;
    observations?: string[]; // IDs das ocorrências do diário
    onClose: () => void;
}

export const ScreeningReportModal = ({ report, studentName, studentId, observations, onClose }: ScreeningReportModalProps) => {

    const getAssessmentIcon = (type: AssessmentType) => {
        switch (type) {
            case AssessmentType.DISC: return <Activity size={32} className="text-blue-600" />;
            case AssessmentType.LEARNING_STYLE: return <Brain size={32} className="text-purple-600" />;
            case AssessmentType.POSITIVE_PSYCH: return <Activity size={32} className="text-amber-500" />;
            case AssessmentType.TEMPERAMENT: return <Brain size={32} className="text-emerald-600" />;
            case AssessmentType.TDAH_SCREENING: return <Activity size={32} className="text-rose-600" />;
            case AssessmentType.AUTISM_SCREENING: return <Brain size={32} className="text-indigo-600" />;
            default: return <Activity size={32} />;
        }
    };

    const getAssessmentColor = (type: AssessmentType) => {
        switch (type) {
            case AssessmentType.DISC: return 'bg-blue-50 text-blue-700 border-blue-200';
            case AssessmentType.LEARNING_STYLE: return 'bg-purple-50 text-purple-700 border-purple-200';
            case AssessmentType.POSITIVE_PSYCH: return 'bg-amber-50 text-amber-700 border-amber-200';
            case AssessmentType.TEMPERAMENT: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case AssessmentType.TDAH_SCREENING: return 'bg-rose-50 text-rose-700 border-rose-200';
            case AssessmentType.AUTISM_SCREENING: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const { currentUser, addNeuroReportDelivery } = useAppStore();
    const [recipientName, setRecipientName] = React.useState('');
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const handlePrintReport = () => {
        window.print();
    };

    const handleConfirmDelivery = async () => {
        if (!recipientName) {
            alert('Por favor, informe o nome do responsável que recebeu o relatório.');
            return;
        }

        setIsSaving(true);
        const delivery: any = {
            id: uuidv4(),
            studentId,
            recipientName,
            deliveredById: currentUser?.id || 'unknown',
            deliveredAt: new Date().toISOString(),
            snapshot: {
                studentName,
                studentRegistration: studentId,
                observations: observations || [],
                screeningResults: [report]
            },
            disclaimerAccepted: true
        };

        await addNeuroReportDelivery(delivery);
        setIsConfirmed(true);
        setIsSaving(false);
        alert('✅ Entrega registrada com sucesso no sistema de auditoria.');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto print:p-0 print:overflow-visible print:bg-white print:static print:block">

            {/* GLOBAL PRINT STYLES - ISOLATION TECHNIQUE */}
            <style>{`
                @media print {
                    body {
                        overflow: visible !important;
                        height: auto !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-report-container, #printable-report-container * {
                        visibility: visible;
                    }
                    #printable-report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        min-height: 100vh;
                        margin: 0;
                        padding: 0;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        overflow: visible !important;
                        display: block !important;
                    }
                    /* Reset layout constraints specifically for print */
                    .print\\:h-auto {
                        height: auto !important;
                    }
                    .print\\:max-h-none {
                        max-height: none !important;
                    }
                    .print\\:overflow-visible {
                        overflow: visible !important;
                    }
                    
                    /* Forçar cores de fundo para gráficos */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Ocultar botões e scrollbars */
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Container do Modal */}
            <div id="printable-report-container" className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col relative overflow-hidden h-full md:h-auto md:max-h-[95vh] print:h-auto print:max-h-none print:rounded-none print:shadow-none print:overflow-visible">

                {/* Botão de Fechar (Oculto na Impressão) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/80 hover:bg-slate-100 rounded-full text-slate-500 transition z-30 shadow-sm border border-slate-100 no-print"
                >
                    <X size={24} />
                </button>

                {/* Botão de Imprimir (Oculto na Impressão) */}
                <button
                    onClick={handlePrintReport}
                    className="absolute top-4 right-16 md:top-6 md:right-20 p-2 bg-brand-primary hover:bg-brand-dark text-white rounded-full transition z-30 shadow-lg no-print flex items-center gap-2 px-4 font-bold text-sm"
                >
                    <Printer size={18} /> Imprimir / Salvar PDF
                </button>

                {/* Área de Conteúdo com Scroll */}
                <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">

                    {/* HEADER INSTITUCIONAL (Visível Apenas na Impressão) */}
                    <div className="hidden print:flex flex-col items-center border-b-2 border-slate-800 pb-6 mb-8 pt-10 px-12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center">
                                <Brain size={32} className="text-slate-800" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-black uppercase tracking-widest text-slate-900 leading-none">Secretaria de Educação</div>
                                <div className="text-sm font-bold text-slate-600 uppercase tracking-wide mt-1">Núcleo de Apoio Psicopedagógico</div>
                            </div>
                        </div>

                        <div className="w-full bg-slate-50 border border-slate-300 p-4 rounded-lg flex justify-between text-sm font-mono mt-2">
                            <div>
                                <div className="text-slate-500 text-xs uppercase">Estudante</div>
                                <div className="font-bold text-slate-900 text-lg">{studentName}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs uppercase">Matrícula</div>
                                <div className="font-bold text-slate-900 text-lg">{studentId}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs uppercase">Data Avaliação</div>
                                <div className="font-bold text-slate-900 text-lg">{new Date(report.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Cabeçalho do Relatório (Tela) */}
                    <div className="bg-white p-6 md:p-10 pb-0 flex flex-col items-center text-center pt-12 md:pt-16 print:pt-0 print:pb-4">
                        <div className="flex items-center justify-center gap-3 mb-4 print:hidden">
                            <div className={`p-3 rounded-2xl shadow-md ${getAssessmentColor(report.type)} bg-opacity-20`}>
                                {getAssessmentIcon(report.type)}
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{report.type.replace(/_/g, ' ')}</h3>
                                <div className="text-xs text-slate-400">Realizado em {new Date(report.date).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Título do Resultado */}
                        <div className="print:w-full print:text-left print:mb-6">
                            <span className="hidden print:block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resultado da Triagem</span>
                            <h1 className="text-4xl md:text-5xl lg:text-4xl font-black text-slate-900 mb-2 tracking-tight leading-tight px-4 print:px-0 print:text-3xl uppercase">
                                {report.resultType}
                            </h1>
                        </div>

                        {/* Disclaimer */}
                        {/* Disclaimer Crítico */}
                        <div className="mt-4 p-4 bg-rose-600 text-white border-2 border-rose-900 rounded-xl shadow-lg ring-4 ring-rose-100 animate-pulse print:animate-none print:ring-0 print:border-black print:bg-white print:text-black">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={24} className="flex-shrink-0 mt-0.5 print:hidden" />
                                <div className="text-left">
                                    <h4 className="font-black text-sm uppercase tracking-tighter mb-1 print:text-black print:text-xs">Atenção Prioritária aos Pais / Responsáveis</h4>
                                    <p className="font-bold text-xs leading-tight print:text-black print:text-[10px] print:leading-none">
                                        É de INTEIRA RESPONSABILIDADE do pai ou responsável conduzir a criança a um especialista de saúde (Neuropediatra, Psiquiatra Infantil ou Psicólogo Clínico) para uma consulta formal e emissão de laudo médico. A escola provê indicadores pedagógicos, mas não substitui o diagnóstico clínico.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Corpo do Texto */}
                    <div className="p-6 md:p-12 space-y-10 bg-white print:p-12 print:pt-4">

                        {/* Seção de Observações Diárias (Ocorrências) */}
                        {observations && observations.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-3 text-xl border-b pb-4 print:text-black print:border-black print:text-lg print:mb-4">
                                    <FileText size={24} className="text-brand-primary print:hidden" /> Observações em Sala de Aula
                                </h4>
                                <div className="grid grid-cols-2 gap-3 print:grid-cols-3">
                                    {observations.map(obsId => (
                                        <div key={obsId} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 print:bg-white print:border-slate-300">
                                            <span className="text-lg">📍</span> {obsId.replace(/_/g, ' ')}
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 text-xs text-slate-500 italic">Estes indicadores foram registrados pelo professor regente durante atividades curriculares regulares.</p>
                            </div>
                        )}

                        {/* Analysis Section */}
                        <div>
                            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-3 text-xl border-b pb-4 print:text-black print:border-black print:text-lg print:mb-4">
                                <Activity size={24} className="text-brand-primary print:hidden" /> Parecer Técnico
                            </h4>
                            <div className="text-slate-700 leading-relaxed text-base md:text-lg space-y-6 font-normal text-justify print:text-black print:text-sm print:leading-normal">
                                {report.report.split('\n').map((paragraph, idx) => (
                                    <p key={idx} className="mb-4">{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-8 print:break-inside-avoid">
                            {/* Strengths */}
                            <div className="bg-emerald-50 rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-sm print:bg-white print:border print:border-slate-300 print:rounded-lg print:p-4 print:shadow-none">
                                <h4 className="font-bold text-emerald-800 mb-6 flex items-center gap-2 text-lg md:text-xl print:text-black print:text-base print:mb-3">
                                    <Award size={24} className="print:hidden" /> Indicadores Positivos
                                </h4>
                                <ul className="space-y-4 print:space-y-2">
                                    {report.strengths.map((s, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0 print:text-black print:w-4 print:h-4" />
                                            <div className="text-slate-700 text-sm font-medium print:text-black">{s}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className="bg-rose-50 rounded-2xl p-6 md:p-8 border border-rose-100 shadow-sm print:bg-white print:border print:border-slate-300 print:rounded-lg print:p-4 print:shadow-none">
                                <h4 className="font-bold text-rose-800 mb-6 flex items-center gap-2 text-lg md:text-xl print:text-black print:text-base print:mb-3">
                                    <AlertCircle size={24} className="print:hidden" /> Pontos de Atenção
                                </h4>
                                <ul className="space-y-4 print:space-y-2">
                                    {report.weaknesses.map((w, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Activity size={18} className="text-rose-500 mt-0.5 flex-shrink-0 print:text-black print:w-4 print:h-4" />
                                            <div className="text-slate-700 text-sm font-medium print:text-black">{w}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Recommendations (PDI) */}
                        {report.recommendations && report.recommendations.length > 0 && (
                            <div className="bg-brand-light/20 rounded-2xl p-6 md:p-8 border border-brand-primary/20 shadow-sm print:bg-white print:border print:border-slate-300 print:rounded-lg print:p-4 print:shadow-none">
                                <h4 className="font-bold text-brand-dark mb-6 flex items-center gap-2 text-lg md:text-xl print:text-black print:text-base print:mb-3">
                                    <Brain size={24} className="print:hidden" /> Plano de Desenvolvimento Individual (Recomendações)
                                </h4>
                                <ul className="space-y-4 print:space-y-2">
                                    {report.recommendations.map((r, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Zap size={18} className="text-brand-primary mt-0.5 flex-shrink-0 print:text-black print:w-4 print:h-4" />
                                            <div className="text-slate-700 text-sm font-medium print:text-black">{r}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Signature Section (Print Only) */}
                        <div className="hidden print:flex justify-between mt-20 pt-12 break-inside-avoid">
                            <div className="text-center w-5/12">
                                <div className="border-t border-black mb-2"></div>
                                <div className="font-bold text-sm">Profissional Responsável</div>
                                <div className="text-xs uppercase">Carimbo / Assinatura</div>
                            </div>
                            <div className="text-center w-5/12">
                                <div className="border-t border-black mb-2"></div>
                                <div className="font-bold text-sm">Gestão Escolar</div>
                                <div className="text-xs uppercase">Ciência / Data</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Fixo / Auditoria (Oculto na Impressão) */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4 no-print">
                    {!isConfirmed ? (
                        <div className="max-w-xl mx-auto space-y-4">
                            <div className="flex flex-col gap-2 text-left">
                                <label className="text-xs font-black text-slate-400 uppercase">Confirmar Entrega ao Responsável</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white shadow-inner focus:ring-2 focus:ring-brand-primary outline-none"
                                        placeholder="Nome Completo do Pai ou Responsável..."
                                        value={recipientName}
                                        onChange={e => setRecipientName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleConfirmDelivery}
                                disabled={isSaving || !recipientName}
                                className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition shadow-lg uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? 'Registrando...' : <><ClipboardCheck size={20} /> Registrar Entrega e Gerar Auditoria</>}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-tighter">Ao clicar, o sistema salvará um snapshot criptografado desta análise para fins judiciais e administrativos.</p>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold mb-2">
                                <CheckCircle size={20} /> ENTREGA REGISTRADA
                            </div>
                            <p className="text-xs text-emerald-600 font-medium">Responsável: {recipientName} • Em {new Date().toLocaleString()}</p>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-12 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition uppercase tracking-wide text-sm"
                    >
                        Fechar Janela
                    </button>
                </div>
            </div>
        </div>
    );
};
