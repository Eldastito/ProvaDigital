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
    const {
        logisticsAssets,
        logisticsCases,
        custodyTransfers,
        logisticsIncidents,
        loadLogisticsData
    } = useAppStore();
    const [activeTab, setActiveTab] = useState<'assets' | 'cases' | 'transfers' | 'incidents' | 'demand'>('demand');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLogisticsData();
    }, []);

    // KPIs baseados em dados reais
    const totalAssets = logisticsAssets.length;
    const assetsInTransit = logisticsAssets.filter(a => a.status === 'IN_TRANSIT').length;
    const casesInTransit = logisticsCases.filter(c => c.status === 'IN_TRANSIT').length;
    const openIncidents = logisticsIncidents.filter(i => i.status === 'OPEN').length;

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
                        <p className="text-2xl font-bold text-slate-800">{totalAssets.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Malas em Trânsito</p>
                        <p className="text-2xl font-bold text-slate-800">{casesInTransit}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Divergências Abertas</p>
                        <p className="text-2xl font-bold text-slate-800">{openIncidents}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Ativos em Trânsito</p>
                        <p className="text-2xl font-bold text-slate-800">{assetsInTransit}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {['demand', 'assets', 'cases', 'transfers', 'incidents'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 font-medium transition-all border-b-2 capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab === 'demand' ? 'Previsão de Demanda' : tab === 'assets' ? 'Estoque de Tablets' : tab === 'cases' ? 'Malas de Transporte' : tab === 'transfers' ? 'Histórico de Custódia' : 'Incidentes'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                {activeTab === 'demand' && <DemandPlanningView />}

                {activeTab === 'assets' && (
                    <div className="p-6">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Serial</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Modelo</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Status</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Bateria</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Último Sync</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logisticsAssets.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum ativo cadastrado</td></tr>
                                ) : (
                                    logisticsAssets.map(asset => (
                                        <tr key={asset.id} className="border-b border-slate-50">
                                            <td className="px-4 py-3 font-mono text-sm">{asset.serialNumber}</td>
                                            <td className="px-4 py-3 text-sm">{asset.model}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{asset.lastBatteryLevel}%</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{asset.lastSyncAt ? new Date(asset.lastSyncAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'cases' && (
                    <div className="p-6">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Mala #</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Capacidade</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Status</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Ativos</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Data Criação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logisticsCases.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma mala cadastrada</td></tr>
                                ) : (
                                    logisticsCases.map(c => (
                                        <tr key={c.id} className="border-b border-slate-50">
                                            <td className="px-4 py-3 font-bold text-slate-800">{c.caseNumber}</td>
                                            <td className="px-4 py-3 text-sm">{c.capacity} tablets</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{c.assets?.length || 0}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'transfers' && (
                    <div className="p-6">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Data</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Tipo</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Mala</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Lacre</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {custodyTransfers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma transferência rituada</td></tr>
                                ) : (
                                    custodyTransfers.map(t => (
                                        <tr key={t.id} className="border-b border-slate-50">
                                            <td className="px-4 py-3 text-sm">{new Date(t.createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-slate-600">{t.type}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono">{t.caseId}</td>
                                            <td className="px-4 py-3 text-xs font-mono">{t.sealId}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.sealStatus === 'INTACT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.sealStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="p-6">
                        {logisticsIncidents.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircle size={48} className="mx-auto text-green-500 opacity-20 mb-4" />
                                <p className="text-slate-400">Nenhum incidente registrado</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {logisticsIncidents.map(incident => (
                                    <div key={incident.id} className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-4">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-lg h-fit">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="font-bold text-red-900">{incident.severity} SEVERITY</p>
                                                <span className="text-[10px] text-red-400 uppercase font-black">{new Date(incident.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-red-800 mt-1">{incident.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
