import React, { useState, useEffect } from 'react';
import {
    Package,
    Tablet,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Truck,
    ArrowRightLeft,
    Search,
    Plus
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TabletOptimizationService } from '../../services/tabletOptimizationService';
import { LogisticsAsset, LogisticsCase, CustodyTransfer, LogisticsIncident } from '../../types';

const LogisticsManagementView: React.FC = () => {
    const { exams, schools, users, loadRemoteData } = useAppStore();
    const [activeTab, setActiveTab] = useState<'assets' | 'cases' | 'transfers' | 'incidents' | 'demand'>('demand');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for initial UI dev (replace with store data later)
    const [assets] = useState<LogisticsAsset[]>([]);
    const [cases] = useState<LogisticsCase[]>([]);
    const [transfers] = useState<CustodyTransfer[]>([]);
    const [incidents] = useState<LogisticsIncident[]>([]);

    // Calculate demand based on scheduled exams
    const calculateDemand = () => {
        // This would use logisticsEngine.getRealLogisticsDemand(store)
        return []; // Placeholder for now
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Gestão Logística Master
                    </h1>
                    <p className="text-slate-500">Controle central de ativos, custódia e distribuição ExamePad</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg active:scale-95">
                        <Plus size={18} />
                        Cadastrar Novo Ativo
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Tablet size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Total Ativos</p>
                        <p className="text-2xl font-bold text-slate-800">1,240</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Malas em Trânsito</p>
                        <p className="text-2xl font-bold text-slate-800">42</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Divergências Abertas</p>
                        <p className="text-2xl font-bold text-slate-800">3</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Rotas Planejadas (Semana)</p>
                        <p className="text-2xl font-bold text-slate-800">18</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('demand')}
                    className={`px-4 py-2 font-medium transition-all border-b-2 ${activeTab === 'demand' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Previsão de Demanda
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`px-4 py-2 font-medium transition-all border-b-2 ${activeTab === 'assets' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Estoque de Tablets
                </button>
                <button
                    onClick={() => setActiveTab('cases')}
                    className={`px-4 py-2 font-medium transition-all border-b-2 ${activeTab === 'cases' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Malas de Transporte
                </button>
                <button
                    onClick={() => setActiveTab('transfers')}
                    className={`px-4 py-2 font-medium transition-all border-b-2 ${activeTab === 'transfers' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Histórico de Custódia
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                {activeTab === 'demand' && <DemandPlanningView />}
                {activeTab === 'assets' && (
                    <div className="p-8 text-center text-slate-400">
                        <Tablet size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Módulo de Gerenciamento de Assets (Serial/Status)</p>
                    </div>
                )}
                {/* Adicionar as outras abas conforme o desenvolvimento progredir */}
            </div>
        </div>
    );
};

const DemandPlanningView: React.FC = () => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Planejamento Semanal</h2>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Algoritmo: Reuso 15min + 15% Reserva</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Escola</th>
                            <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Data do Evento</th>
                            <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Pico Alunos</th>
                            <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Tablets Otimizados</th>
                            <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Economia</th>
                            <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Status Rota</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4 font-medium text-slate-800">Escola Municipal Machado de Assis</td>
                            <td className="px-4 py-4 text-slate-600 text-sm">Terça, 17/02</td>
                            <td className="px-4 py-4 text-slate-600">320</td>
                            <td className="px-4 py-4 text-indigo-700 font-bold">186 <span className="text-[10px] text-slate-400 font-normal ml-1">(+28 reserva)</span></td>
                            <td className="px-4 py-4 text-teal-600 font-semibold">42% de reuso</td>
                            <td className="px-4 py-4">
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">Aguardando Separação</span>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4 font-medium text-slate-800">Colégio Estadual Rio Branco</td>
                            <td className="px-4 py-4 text-slate-600 text-sm">Quarta, 18/02</td>
                            <td className="px-4 py-4 text-slate-600">150</td>
                            <td className="px-4 py-4 text-indigo-700 font-bold">92 <span className="text-[10px] text-slate-400 font-normal ml-1">(+14 reserva)</span></td>
                            <td className="px-4 py-4 text-teal-600 font-semibold">38% de reuso</td>
                            <td className="px-4 py-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">Rota Gerada (#R-42)</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Nota sobre o Cálculo
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                    O sistema calcula automaticamente o número mínimo de tablets necessário para cobrir o pico simultâneo de alunos, somando uma **reserva técnica de 15%**. O reuso é permitido entre turmas com intervalo de no mínimo **15 minutos** para preparação.
                </p>
            </div>
        </div>
    );
};

export default LogisticsManagementView;
