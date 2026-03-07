import React, { useState } from 'react';
import { 
    Globe, 
    Ship, 
    Zap, 
    Share2, 
    Download, 
    CheckCircle2, 
    MapPin, 
    Network,
    ExternalLink,
    FileJson,
    Flag
} from 'lucide-react';
import { dataExportService } from '../../services/dataExportService';

/**
 * GlobalEcosystemView - Fase 10 (v4.0)
 * Visão de integração com o ecossistema global e padrões MEC/INEP.
 */
export default function GlobalEcosystemView() {
    const [isExporting, setIsExporting] = useState(false);

    const handleInepExport = () => {
        setIsExporting(true);
        // Simulação de dados para o export oficial
        const schoolData = { inepCode: "35044123" };
        const mockResults = [
            { studentId: 'std_001', totalScore: 540.5, status: 'PRESENT', submittedAt: new Date().toISOString() },
            { studentId: 'std_002', totalScore: 610.2, status: 'PRESENT', submittedAt: new Date().toISOString() },
            { studentId: 'std_003', totalScore: 480.9, status: 'PRESENT', submittedAt: new Date().toISOString() },
        ];

        setTimeout(() => {
            dataExportService.exportToINEP(schoolData, mockResults);
            setIsExporting(false);
        }, 1500);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                            <Globe size={28} className="animate-spin-slow" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            Ecossistema Global <span className="text-blue-600">v4.0</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        A maturidade final do ExamePad: Integração regulatória nacional e prontidão para distribuição multi-regional.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${i+20}`} alt="User" />
                            </div>
                        ))}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pr-4">
                        12 REGIONS ACTIVE
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* MEC/INEP Official Integration */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition">
                            <Flag size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <FileJson size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Integração Oficial MEC / INEP</h2>
                            </div>
                            
                            <p className="text-slate-600 mb-8 leading-relaxed max-w-xl">
                                Gere o arquivo de transferência de dados pedagógicos seguindo o **Layout Nacional v4.0**. 
                                Este módulo automatiza a comunicação com os censos escolares e sistemas de avaliação estadual.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <ComplianceCheck label="Cód. INEP Validado" />
                                <ComplianceCheck label="Esquema JSON v4.0" />
                                <ComplianceCheck label="Assinatura Digital PKI" />
                                <ComplianceCheck label="Controle de Hash de Lote" />
                            </div>

                            <button 
                                onClick={handleInepExport}
                                disabled={isExporting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {isExporting ? <Zap size={20} className="animate-bounce" /> : <Download size={20} />}
                                {isExporting ? 'Processando Lote...' : 'Gerar Exportação Oficial MEC/INEP'}
                            </button>
                        </div>
                    </div>

                    {/* Simulation Map */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative h-[400px] overflow-hidden">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Network size={20} className="text-blue-400" /> Distribuição de Edge Nodes
                                </h3>
                                <p className="text-xs text-slate-400 font-mono">Simulação de Fluxo Global v4.0</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    ONLINE
                                </div>
                            </div>
                        </div>

                        {/* Simulated Map Dots */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-1/2 left-1/4"><MapPin size={24} className="text-white"/></div>
                            <div className="absolute top-1/3 left-1/2"><MapPin size={24} className="text-blue-400"/></div>
                            <div className="absolute top-2/3 left-3/4"><MapPin size={24} className="text-white"/></div>
                            <div className="absolute top-1/4 left-3/4"><MapPin size={24} className="text-blue-400"/></div>
                        </div>

                        {/* Connection Lines Simulation */}
                        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                            <path d="M 25% 50% Q 40% 30% 50% 33% T 75% 66%" stroke="white" strokeWidth="2" fill="none" />
                            <path d="M 50% 33% Q 65% 15% 75% 25%" stroke="#3b82f6" strokeWidth="2" fill="none" />
                        </svg>

                        <div className="absolute bottom-8 left-8 right-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <NodeStats region="us-east-1" latency="12ms" />
                            <NodeStats region="sa-east-1" latency="8ms" />
                            <NodeStats region="eu-central-1" latency="105ms" />
                            <NodeStats region="ap-northeast-1" latency="240ms" />
                        </div>
                    </div>
                </div>

                {/* Sidebar - Ecossistema */}
                <div className="space-y-6">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6">
                        <h4 className="font-black text-blue-900 mb-4 flex items-center gap-2">
                            <Zap size={18} /> Global Ready (v4.0)
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Multi-região</div>
                                    <p className="text-[10px] text-slate-500">Replicação automática entre AWS São Paulo e Virginia.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Sync Intercontinental</div>
                                    <p className="text-[10px] text-slate-500">Protocolo de transporte otimizado para altas latências.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Share2 size={18} className="text-blue-500" /> Parcerias Educacionais
                        </h4>
                        <div className="space-y-4">
                            <EcosystemIntegration name="Microsoft Education" status="Verified" icon="☁️" />
                            <EcosystemIntegration name="Google Workspace" status="Linked" icon="📁" />
                            <EcosystemIntegration name="Canvas LMS" status="Ready" icon="🎓" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-black rounded-3xl p-6 text-white text-center">
                        <Globe size={40} className="mx-auto mb-4 text-blue-400 opacity-50" />
                        <h5 className="font-black text-lg mb-1 italic">EP GLOBAL MISSION</h5>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-6">Educação sem fronteiras</p>
                        <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition">
                            Acessar Roadmap v5.0 <ExternalLink size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComplianceCheck({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {label}
        </div>
    );
}

function NodeStats({ region, latency }: { region: string, latency: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md">
            <div className="text-[10px] text-slate-500 uppercase font-black mb-1">{region}</div>
            <div className="text-lg font-black">{latency}</div>
        </div>
    );
}

function EcosystemIntegration({ name, status, icon }: { name: string, status: string, icon: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-bold text-slate-700">{name}</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                {status}
            </span>
        </div>
    );
}
