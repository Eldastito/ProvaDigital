import React, { useState, useMemo } from 'react';
import {
    ShieldCheck,
    BarChart3,
    Search,
    CheckCircle2,
    AlertTriangle,
    History,
    Edit3,
    Trash2,
    Filter,
    ChevronRight,
    PlayCircle,
    RotateCcw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Item, LiteracyDomain, ItemLifecycleStatus } from '../../types';
import { CalibrationService } from '../../services/calibrationService';
import { Badge } from '../../components/ui/Badge';
import { translateDifficultyLevel, translateLiteracyDomain } from '../../utils/translations';
import { useToast } from '../../components/ui/Toast';

export const PsychometricCuradoriaView = () => {
    const { items, updateItem, updateItemWithVersion } = useAppStore();
    const [filter, setFilter] = useState('');
    const toast = useToast();
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'MODEL_ESTIMATED' | 'DATA_CALIBRATED' | 'FLAGGED'>('ALL');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isCalibrating, setIsCalibrating] = useState(false);

    // Filtragem de Itens
    const filteredItems = useMemo(() => {
        return items.filter(i => {
            const matchesSearch = i.statement.toLowerCase().includes(filter.toLowerCase()) ||
                i.subject.toLowerCase().includes(filter.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || i.triParams?.calibrationStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [items, filter, statusFilter]);

    const selectedItem = items.find(i => i.id === selectedItemId);

    // Executar calibração simulada
    const handleRunCalibration = async () => {
        setIsCalibrating(true);
        try {
            const calibrated = await CalibrationService.calibrateItems(filteredItems);
            // Atualizar cada item na store
            for (const item of calibrated) {
                await updateItem(item);
            }
            toast.success('Calibração concluída', calibrated.length + ' itens calibrados');
        } finally {
            setIsCalibrating(false);
        }
    };

    // Aprovar calibração (Auditoria)
    const handleApprove = (item: Item) => {
        const approvedItem = {
            ...item,
            triParams: {
                ...item.triParams!,
                calibrationStatus: 'DATA_CALIBRATED' as any
            },
            lifecycleStatus: ItemLifecycleStatus.APPROVED
        };
        updateItem(approvedItem);
        setSelectedItemId(null);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Curadoria & Calibração TRI</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-tight uppercase">Governança Psicométrica de Itens</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                        <Search size={16} className="text-slate-400 mr-2" />
                        <input
                            className="bg-transparent border-none text-sm focus:outline-none w-64"
                            placeholder="Buscar por enunciado ou disciplina..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleRunCalibration}
                        disabled={isCalibrating}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {isCalibrating ? <RotateCcw size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                        Gerar Calibração TRI
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Item List */}
                <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col">
                    <div className="p-4 border-b bg-slate-50 flex gap-2">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${statusFilter === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
                        >TODOS</button>
                        <button
                            onClick={() => setStatusFilter('DATA_CALIBRATED')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${statusFilter === 'DATA_CALIBRATED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
                        >CALIBRADOS</button>
                        <button
                            onClick={() => setStatusFilter('MODEL_ESTIMATED')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${statusFilter === 'MODEL_ESTIMATED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
                        >ESTIMADOS (IA)</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedItemId === item.id ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.subject}</span>
                                    <Badge color={item.triParams?.calibrationStatus === 'DATA_CALIBRATED' ? 'indigo' : 'yellow'}>
                                        {item.triParams?.calibrationStatus || 'PENDING'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2 leading-tight mb-2">{item.statement}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[8px] font-bold text-slate-400">DIFF (b)</p>
                                            <p className="text-xs font-bold text-slate-900">{item.triParams?.difficulty || '0.0'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-bold text-slate-400">DISC (a)</p>
                                            <p className="text-xs font-bold text-slate-900">{item.triParams?.discrimination || '0.0'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Item Detail & ICC Curve */}
                <div className="flex-1 bg-slate-50 overflow-y-auto p-8">
                    {selectedItem ? (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-bold text-slate-800">Detalhes do Item</h2>
                                        <div className="flex gap-2">
                                            <Badge color="gray">{translateLiteracyDomain(selectedItem.literacyDomain!)}</Badge>
                                            <Badge color="blue">{translateDifficultyLevel(selectedItem.difficulty)}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                                            <Edit3 size={14} /> Editar Enunciado
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedItem)}
                                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
                                        >
                                            <ShieldCheck size={14} /> Aprovar Parâmetros
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed italic">
                                    "{selectedItem.statement}"
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Desempenho Estatístico</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <StatCard label="Amostra (N)" value={selectedItem.triParams?.calibrationMetadata?.sampleSize?.toString() || '0'} />
                                            <StatCard label="Erro Padrão" value={(selectedItem.triParams?.calibrationMetadata?.standardError || 0).toFixed(4)} />
                                            <StatCard label="Adesão (Fit)" value="0.992" />
                                        </div>

                                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Histórico de Calibração</p>
                                            <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                                                <History size={14} />
                                                Última calibração: {selectedItem.triParams?.calibrationMetadata?.lastCalibratedAt ? new Date(selectedItem.triParams.calibrationMetadata.lastCalibratedAt).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ICC Chart - SVG based */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Curva Característica (ICC)</h3>
                                        <div className="h-48 w-full bg-white border border-slate-100 rounded-xl relative overflow-hidden">
                                            <ICCChart
                                                difficulty={selectedItem.triParams?.difficulty || 0}
                                                discrimination={selectedItem.triParams?.discrimination || 1}
                                                guessing={selectedItem.triParams?.guessing || 0}
                                            />
                                        </div>
                                        <p className="text-[10px] text-center text-slate-400 font-medium">Probabilidade de Acerto (y) vs Habilidade θ (x)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-rose-500" />
                                    <div>
                                        <p className="text-sm font-bold text-rose-900">Descartar Item</p>
                                        <p className="text-xs text-rose-600">Este item deixará de ser usado em avaliações oficiais e adaptativas.</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition">
                                    Remover do Banco
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <BarChart3 size={64} className="opacity-20" />
                            <p className="font-bold">Selecione um item para auditar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-white p-3 border border-slate-200 rounded-xl text-center">
        <p className="text-[9px] font-black text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
);

const ICCChart = ({ difficulty, discrimination, guessing }: any) => {
    const points = CalibrationService.getICCPoints(difficulty, discrimination, guessing);

    const width = 400;
    const height = 180;
    const padding = 20;

    const pathData = points.map((p, i) => {
        // x map de theta (-4, 4) para largura
        const x = padding + ((p.theta + 4) / 8) * (width - 2 * padding);
        // y map de probabilidade (0, 1) para altura (invertida em SVG)
        const y = height - padding - (p.probability * (height - 2 * padding));
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Grid */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={width / 2} y1={padding} x2={width / 2} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2" />

            {/* Curve */}
            <path d={pathData} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Legend theta values */}
            <text x={padding} y={height - 5} fontSize="8" fill="#94a3b8" textAnchor="middle">-4</text>
            <text x={width / 2} y={height - 5} fontSize="8" fill="#94a3b8" textAnchor="middle">θ = 0</text>
            <text x={width - padding} y={height - 5} fontSize="8" fill="#94a3b8" textAnchor="middle">+4</text>
        </svg>
    );
};
