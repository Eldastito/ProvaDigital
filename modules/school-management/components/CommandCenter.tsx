
import React, { useState, useEffect } from 'react';
import { Radio, Power, Server, Box, Layers, MapPin, Briefcase, Truck, CheckCircle, AlertTriangle, RefreshCcw, Plus } from 'lucide-react';
import { AppState, MeshPeer, ProvisioningPayload } from '../../../types';
import { meshService } from '../../../services/localMeshService';
import { QRDataTransfer } from '../../../services/qrCodecService';
import { QRCodeSVG } from 'qrcode.react';

interface CommandCenterProps {
    state: AppState;
    userSchoolId?: string;
}

export const CommandCenter = ({ state, userSchoolId }: CommandCenterProps) => {
    const [activeTab, setActiveTab] = useState<'PRODUCTION' | 'EXPEDITION' | 'QUALITY'>('PRODUCTION');
    const [peers, setPeers] = useState<MeshPeer[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState(state.currentUser?.tenantId || '');

    // Configuração de Lote
    const [suitcaseSize, setSuitcaseSize] = useState<number>(20); // 20, 10, 5
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]); // Multiplas provas (semana toda)

    // Gestão de Incidentes
    const [replacementTarget, setReplacementTarget] = useState('');

    // QR Transfer State
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
    const [showQrModal, setShowQrModal] = useState(false);

    useEffect(() => {
        meshService.join('SERVER', 'SaaS-Central-Logistics', 'UNASSIGNED');
        const interval = setInterval(() => {
            setPeers(meshService.getPeers());
        }, 1000);
        return () => {
            clearInterval(interval);
            meshService.disconnect();
        };
    }, []);

    // --- LÓGICA DE CARGA REGIONAL ---

    // 1. Total de Tablets Necessários no Município (Visão Macro)
    const tenantSchools = state.schools.filter(s => s.tenantId === selectedTenantId);
    const totalStudentsInTenant = state.students.filter(s => s.tenantId === selectedTenantId).length;

    // Provas disponíveis para carga (ex: todas as provas da semana)
    const availableExams = state.exams.filter(e => e.tenantId === selectedTenantId);

    // Dispositivos virgens na rede (Staging Area)
    const availableTablets = peers.filter(p => p.role === 'UNASSIGNED');

    const toggleExam = (id: string) => {
        if (selectedExamIds.includes(id)) setSelectedExamIds(selectedExamIds.filter(e => e !== id));
        else setSelectedExamIds([...selectedExamIds, id]);
    };

    const handleBatchLoad = () => {
        if (selectedExamIds.length === 0) return alert("Selecione pelo menos uma prova para compor o pacote regional.");
        if (availableTablets.length === 0) return alert("Nenhum tablet detectado na 'Sala de Carga'.");

        const confirmMsg = `CONFIRMAÇÃO DE CARGA REGIONAL\n\n` +
            `- Município: ${state.tenants.find(t => t.id === selectedTenantId)?.name}\n` +
            `- Conteúdo: ${selectedExamIds.length} Provas Criptografadas\n` +
            `- Destino: ${availableTablets.length} Dispositivos Detectados\n\n` +
            `Os tablets receberão dados de TODAS as escolas do município, permitindo flexibilidade total de transporte.`;

        if (!confirm(confirmMsg)) return;

        // Simulação de Carga em Massa
        let processed = 0;
        availableTablets.forEach((tablet, idx) => {
            // Lógica de Mala: Agrupar visualmente
            const suitcaseNumber = Math.floor(idx / suitcaseSize) + 1;

            // O payload agora é genérico para a região. 
            // O tablet do aluno vira um "Cofre Fechado"
            meshService.sendTo(tablet.id, 'PROVISION_CMD', {
                targetRole: 'STUDENT', // Default state
                assignedName: `Mala ${suitcaseNumber} - Unidade ${idx % suitcaseSize + 1}`,
                killNetworkAfter: false // Mantém rede para receber ativação na escola
            } as ProvisioningPayload);
            processed++;
        });

        alert(`Carga Regional concluída em ${processed} dispositivos! Podem ser acomodados nas malas.`);
    };

    const handleProvisionCoordinators = () => {
        // Coordenadores recebem chaves mestras, não apenas dados cifrados
        const targets = availableTablets.slice(0, tenantSchools.length); // 1 por escola idealmente

        if (targets.length === 0) return alert("Sem dispositivos.");

        targets.forEach((t, i) => {
            const school = tenantSchools[i % tenantSchools.length];
            meshService.sendTo(t.id, 'PROVISION_CMD', {
                targetRole: 'COORDINATOR',
                assignedName: `COORD - ${school.name}`,
                killNetworkAfter: false
            } as ProvisioningPayload);
        });
        alert(`${targets.length} Tablets de Coordenação configurados com Chaves Mestras.`);
    };

    const handleGenerateQR = async () => {
        if (selectedExamIds.length === 0) return alert("Selecione as provas primeiro.");

        // Simulação de payload de carga completa
        const payload = {
            type: 'FORGE_OFFLINE_PACKAGE',
            tenantId: selectedTenantId,
            exams: selectedExamIds.map(id => state.exams.find(e => e.id === id)),
            timestamp: Date.now(),
            version: '1.0.5'
        };

        const chunks = await QRDataTransfer.compressAndChunk(payload);
        setQrChunks(chunks);
        setCurrentChunkIdx(0);
        setShowQrModal(true);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-[600px] space-y-8">

            {/* Header */}
            {activeTab === 'PRODUCTION' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* COLUNA 1: O PACOTE DE DADOS (Conteúdo) */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers size={20} /> 1. Conteúdo do Pacote</h3>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Município / Rede</label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm bg-slate-50 font-medium"
                                    value={selectedTenantId}
                                    onChange={e => setSelectedTenantId(e.target.value)}
                                    disabled={!!userSchoolId}
                                >
                                    {state.tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                                <div className="text-xs text-slate-400 uppercase font-bold px-2 py-1">Provas Disponíveis</div>
                                {availableExams.map(exam => (
                                    <div
                                        key={exam.id}
                                        onClick={() => toggleExam(exam.id)}
                                        className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition ${selectedExamIds.includes(exam.id) ? 'bg-sky-50 border-brand-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="font-bold text-sm text-slate-800">{exam.title}</div>
                                        {selectedExamIds.includes(exam.id) && <CheckCircle size={16} className="text-brand-primary" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 2: CARGA EM MASSA */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Box size={20} /> 2. Carga em Massa</h3>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={handleBatchLoad}
                                    disabled={availableTablets.length === 0 || selectedExamIds.length === 0}
                                    className="col-span-2 bg-brand-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Truck size={20} /> Carregar {availableTablets.length} Tablets
                                </button>
                                <button
                                    onClick={handleGenerateQR}
                                    disabled={selectedExamIds.length === 0}
                                    className="col-span-2 bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Radio size={20} /> Gerar QR de Carga
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleProvisionCoordinators}
                            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                        >
                            <MapPin size={18} /> Habilitar Tablets de Coordenação
                        </button>
                    </div>

                    {/* COLUNA 3: MONITORAMENTO DA SALA DE CARGA */}
                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg h-full">
                        <h3 className="font-bold text-sm uppercase text-slate-400 mb-4 flex items-center gap-2">
                            <RefreshCcw size={16} /> Sala de Carga (Realtime)
                        </h3>
                        <div className="space-y-2 overflow-y-auto max-h-[400px]">
                            {peers.map(peer => (
                                <div key={peer.id} className="flex justify-between items-center border-b border-slate-700 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${peer.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                                        <div className="text-xs font-bold">{peer.name}</div>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">{peer.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'EXPEDITION' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={20} /> Gestão de Malas (Shipment)</h3>
                                <button className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Plus size={16} /> Nova Mala
                                </button>
                            </div>

                            <div className="space-y-3">
                                {state.logisticsSuitcases?.length > 0 ? state.logisticsSuitcases.map(suitcase => (
                                    <div key={suitcase.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
                                                <Briefcase size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{suitcase.tag}</div>
                                                <div className="text-xs text-slate-500">{suitcase.schoolId} • {suitcase.actualTabletCount}/{suitcase.expectedTabletCount} Tablets</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${suitcase.status === 'READY' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {suitcase.status}
                                            </span>
                                            <button className="text-xs font-bold text-brand-primary hover:underline">Detalhes</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                                        <Truck size={48} className="mx-auto mb-4 opacity-10" />
                                        <p>Nenhuma mala em preparação.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                        <h3 className="font-bold text-sm uppercase text-slate-400 mb-4 flex items-center gap-2">
                            <MapPin size={16} /> Resumo de Expedição
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Total para Despacho</div>
                                <div className="text-2xl font-black">12 Malas</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Escolas Atendidas</div>
                                <div className="text-2xl font-black">{tenantSchools.length} Unidades</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'QUALITY' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><CheckCircle size={20} /> Check-in e Auditoria (Retorno)</h3>
                            <div className="flex gap-4 mb-8">
                                <input
                                    type="text"
                                    placeholder="Scaneie o QR da Mala ou digite Tag..."
                                    className="flex-1 border rounded-lg p-4 font-mono text-lg"
                                />
                                <button className="bg-slate-800 text-white px-8 rounded-lg font-bold">Verificar</button>
                            </div>

                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black">
                                        <tr>
                                            <th className="px-4 py-3">Ação</th>
                                            <th className="px-4 py-3">Mala</th>
                                            <th className="px-4 py-3">Tablet (Serial)</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-600">
                                        {state.logisticsAudit?.slice(0, 10).map(log => (
                                            <tr key={log.id}>
                                                <td className="px-4 py-3 font-medium">{log.action}</td>
                                                <td className="px-4 py-3">{log.suitcaseId}</td>
                                                <td className="px-4 py-3 font-mono">{log.tabletSerial}</td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle size={14} /> OK
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="bg-rose-900 text-white p-6 rounded-xl shadow-lg">
                        <h3 className="font-bold text-sm uppercase text-white/50 mb-4 flex items-center gap-2">
                            <AlertTriangle size={16} /> Auditoria de Ativos
                        </h3>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CheckCircle size={48} className="mb-4 text-emerald-400" />
                            <p className="font-bold">Equipamentos em Conformidade</p>
                            <p className="text-xs text-white/60">Controle de perdas integrado.</p>
                        </div>
                    </div>
                </div>
            )}
            {showQrModal && qrChunks.length > 0 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-primary rounded-lg">
                                    <RefreshCcw size={20} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Maleta Digital (Carga QR)</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Protocolo Forge Anti-Sniffing</p>
                                </div>
                            </div>
                            <button onClick={() => setShowQrModal(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="bg-white p-6 rounded-2xl shadow-inner mb-6 border-2 border-slate-100">
                                <QRCodeSVG
                                    value={qrChunks[currentChunkIdx]}
                                    size={280}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Progresso da Carga</span>
                                    <span className="text-sm font-black text-brand-primary">{currentChunkIdx + 1} de {qrChunks.length}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-primary transition-all duration-300"
                                        style={{ width: `${((currentChunkIdx + 1) / qrChunks.length) * 100}%` }}
                                    ></div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setCurrentChunkIdx(prev => Math.max(0, prev - 1))}
                                        disabled={currentChunkIdx === 0}
                                        className="flex-1 py-4 px-6 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (currentChunkIdx < qrChunks.length - 1) {
                                                setCurrentChunkIdx(prev => prev + 1);
                                            } else {
                                                setShowQrModal(false);
                                                alert("Carga concluída! O dispositivo agora possui todos os dados necessários.");
                                            }
                                        }}
                                        className="flex-3 py-4 px-8 rounded-xl bg-brand-primary text-white font-bold shadow-lg hover:bg-brand-dark transition"
                                    >
                                        {currentChunkIdx === qrChunks.length - 1 ? "Finalizar" : "Próximo QR Code"}
                                    </button>
                                </div>
                            </div>

                            <p className="mt-8 text-xs text-slate-400 flex items-center gap-2">
                                <AlertTriangle size={14} /> Posicione a câmera do tablet FORGE para escanear a sequência.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
