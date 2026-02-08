import React from 'react';
import { X, TrendingUp, DollarSign, PiggyBank, Activity } from 'lucide-react';

interface FinancialEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FinancialEducationModal: React.FC<FinancialEducationModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="bg-gradient-to-r from-brand-primary to-blue-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Entenda seus Números</h2>
                            <p className="text-blue-100 text-sm opacity-90">Glossário Financeiro Simplificado</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Custo Operacional */}
                    <div className="flex gap-4 group">
                        <div className="mt-1">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-800 text-lg">Custo Operacional Total (OpEx)</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                É o custo para <strong>"manter as luzes acesas"</strong> e a operação rodando todos os meses.
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500 space-y-1">
                                <p><strong>Inclui:</strong> Salários, aluguel, luz, internet, impostos sobre salário.</p>
                                <p><strong>Também inclui Depreciação:</strong> Uma "mensalidade invisível" que cobre o desgaste dos equipamentos.</p>
                            </div>
                        </div>
                    </div>

                    {/* Depreciação */}
                    <div className="flex gap-4 group">
                        <div className="mt-1">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-800 text-lg">Depreciação (A "Poupança" dos Tablets)</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Seus tablets e malas não duram para sempre. A depreciação é um custo mensal teórico que você "guarda" para comprar novos equipamentos quando os atuais ficarem velhos (ex: a cada 36 meses).
                            </p>
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 inline-block font-medium">
                                💡 Se ignorar isso, você terá lucro falso hoje e prejuízo amanhã quando precisar repor tudo.
                            </p>
                        </div>
                    </div>

                    {/* Margem e Lucro */}
                    <div className="flex gap-4 group">
                        <div className="mt-1">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                <PiggyBank size={20} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-800 text-lg">Lucro Líquido vs. Bruto (EBITDA)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div className="font-bold text-blue-800 mb-1 text-sm">EBITDA (Caixa Operacional)</div>
                                    <p className="text-xs text-blue-600/80">
                                        Dinheiro gerado pela operação <strong>antes</strong> de descontar a depreciação e impostos sobre lucro. É bom para ver se o negócio para em pé.
                                    </p>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <div className="font-bold text-emerald-800 mb-1 text-sm">Lucro Líquido (Real)</div>
                                    <p className="text-xs text-emerald-600/80">
                                        O que sobra limpo no bolso depois de pagar TUDO (impostos, salários, e reservar o $$ da reposição de equipamentos). Esse é o número final.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                    >
                        Entendi, vamos calcular!
                    </button>
                </div>
            </div>
        </div>
    );
};
