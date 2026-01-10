import React, { useState, useEffect } from 'react';
import { Shield, Lock, FileText, CheckCircle, XCircle } from 'lucide-react';

interface PrivacyPolicyModalProps {
    onAccept: () => void;
    onReject: () => void;
}

export const PrivacyPolicyModal = ({ onAccept, onReject }: PrivacyPolicyModalProps) => {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
        if (bottom) setScrolledToBottom(true);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Política de Privacidade e Proteção de Dados</h2>
                        <p className="text-sm text-slate-500">Conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</p>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="p-6 overflow-y-auto space-y-6 text-slate-700 leading-relaxed text-sm flex-1"
                    onScroll={handleScroll}
                >
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-blue-800">
                        <Lock size={20} className="flex-shrink-0 mt-0.5" />
                        <p>Seus dados são criptografados e armazenados com segurança. Não vendemos suas informações para terceiros.</p>
                    </div>

                    <section>
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-brand-primary" /> 1. Quais dados coletamos?
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 ml-1">
                            <li><strong>Dados Pessoais:</strong> Nome completo, matrícula, e-mail (para login e identificação).</li>
                            <li><strong>Dados Acadêmicos:</strong> Notas, frequência, histórico escolar e respostas de avaliações.</li>
                            <li><strong>Dados Sensíveis (Opcionais):</strong> Resultados de triagens neuropsicopedagógicas (TDAH, Autismo) e estilos de aprendizagem, coletados <u>apenas com seu consentimento específico</u>.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-brand-primary" /> 2. Para que usamos seus dados?
                        </h3>
                        <p>Utilizamos a Base Legal de <strong>Execução de Contrato</strong> e <strong>Obrigação Legal</strong> para:</p>
                        <ul className="list-disc pl-5 space-y-1 ml-1 mt-2">
                            <li>Gerar boletins e relatórios de desempenho.</li>
                            <li>Calcular riscos de evasão escolar (Alertas Preventivos).</li>
                            <li>Personalizar planos de estudo com Inteligência Artificial.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-brand-primary" /> 3. Seus Direitos
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 ml-1">
                            <li>Acessar seus dados a qualquer momento.</li>
                            <li>Solicitar a correção de dados incompletos ou errados.</li>
                            <li>Revogar o consentimento para tratamento de dados sensíveis.</li>
                            <li>Solicitar a exclusão de dados não essenciais.</li>
                        </ul>
                    </section>

                    <div className="h-4"></div> {/* Spacer for scroll detection */}
                </div>

                {/* Footer */}
                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-4">
                    <p className="text-xs text-slate-500 text-center">
                        Ao clicar em "Aceitar", você concorda com nossos Termos de Uso.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onReject}
                            className="flex-1 px-6 py-3 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-2"
                        >
                            <XCircle size={18} /> Recusar
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} /> Aceitar e Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
