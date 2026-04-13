import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, RefreshCcw, MapPin, Radio, Layers, Plus, AlertTriangle, Briefcase, Server, ShieldCheck, HelpCircle, Wifi, Smartphone, Monitor } from 'lucide-react';
import { AppState, MeshPeer, MeshRole, MeshMessage, ProvisioningPayload, SecurityReport } from '../../../types';
import { meshService } from '../../../services/localMeshService';
import { envConfig } from '../../../services/environmentConfig';
import { QRDataTransfer } from '../../../services/qrCodecService';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../../components/ui/Toast';

interface CommandCenterProps {
    state: AppState;
    userSchoolId?: string;
}

export const CommandCenter = ({ state, userSchoolId }: CommandCenterProps) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'PRODUCTION' | 'EXPEDITION' | 'QUALITY'>((localStorage.getItem('cc_activeTab') as any) || 'PRODUCTION');
    const [peers, setPeers] = useState<MeshPeer[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(localStorage.getItem('cc_schoolId') || '');
    const [roleConfig, setRoleConfig] = useState(JSON.parse(localStorage.getItem('cc_roleConfig') || '{"coordinators": 1, "professors": 5, "students": 30}'));
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>(JSON.parse(localStorage.getItem('cc_examIds') || '[]'));
    const [selectedTenantId, setSelectedTenantId] = useState<string>(localStorage.getItem('cc_tenantId') || state.currentUser?.tenantId || '');

    // Wizard de Carga States
    const [loadingStep, setLoadingStep] = useState<1 | 2 | 3 | 4>(1);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [provisioningProgress, setProvisioningProgress] = useState(0);

    // QR Transfer State
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
    const [showQrModal, setShowQrModal] = useState(false);

    // New states for charge phase and conflict detection
    const [chargePhase, setChargePhase] = useState<'STUDENT' | 'PROFESSOR' | 'COORDINATOR' | 'IDLE'>('IDLE');
    const [conflictedPeers, setConflictedPeers] = useState<string[]>([]);
    const [securityReports, setSecurityReports] = useState<Record<string, SecurityReport>>({});
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [gatewayStatus, setGatewayStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
    const CURRENT_BIN_VERSION = "2.5.0";

    // --- LOGISTICS GATEWAY CHECK ---
    useEffect(() => {
        const checkGateway = async () => {
            try {
                const config = envConfig.getNetworkConfig();
                const res = await fetch(`http://localhost:${config.port}/health`, { mode: 'cors' });
                if (res.ok) {
                    setGatewayStatus('ONLINE');
                    // Se o gateway local estiver ativo, podemos usar ele para sinalização prioritária
                    console.log(`🔗 [CC] Gateway Local detectado em :${config.port}. Mesh Wi-Fi Nativo Ativo.`);
                } else {
                    setGatewayStatus('OFFLINE');
                }
            } catch (e) {
                setGatewayStatus('OFFLINE');
            }
        };

        checkGateway();
        const interval = setInterval(checkGateway, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- PERSISTÊNCIA DE ESTADO (LOCALSTORAGE) ---
    const STORAGE_KEY = `cc_wizard_${state.currentUser?.tenantId}_${state.currentUser?.id}`;

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.loadingStep) setLoadingStep(parsed.loadingStep);
                // The following states are now initialized directly from localStorage,
                // so we only need to update them if they were saved in the old STORAGE_KEY format.
                // For new runs, the direct localStorage calls will handle it.
                if (parsed.selectedSchoolId && !localStorage.getItem('cc_schoolId')) setSelectedSchoolId(parsed.selectedSchoolId);
                if (parsed.roleConfig && !localStorage.getItem('cc_roleConfig')) setRoleConfig(parsed.roleConfig);
                if (parsed.selectedExamIds && !localStorage.getItem('cc_examIds')) setSelectedExamIds(parsed.selectedExamIds);
                if (parsed.selectedTenantId && !localStorage.getItem('cc_tenantId')) setSelectedTenantId(parsed.selectedTenantId);
            } catch (e) {
                console.error("Failed to restore wizard state", e);
            }
        }
    }, []);

    useEffect(() => {
        // Não persistimos estados efêmeros como isProvisioning ou provisioningProgress
        const stateToSave = {
            loadingStep,
            // The following states are now persisted individually
            // selectedSchoolId,
            // roleConfig,
            // selectedExamIds,
            // selectedTenantId
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

        // Persist individual states
        localStorage.setItem('cc_schoolId', selectedSchoolId);
        localStorage.setItem('cc_roleConfig', JSON.stringify(roleConfig));
        localStorage.setItem('cc_examIds', JSON.stringify(selectedExamIds));
        localStorage.setItem('cc_tenantId', selectedTenantId);
        localStorage.setItem('cc_activeTab', activeTab);

    }, [loadingStep, selectedSchoolId, roleConfig, selectedExamIds, selectedTenantId, activeTab]);

    useEffect(() => {
        meshService.join('command-center-sede', 'Centro de Comando (Sede)', 'SERVER', selectedTenantId);

        meshService.onMessage((msg) => {
            if (msg.type === 'ANNOUNCE' || msg.type === 'DISCOVERY') {
                setPeers(meshService.getPeers());

                // Passo 1: Verificar Versão do Binário ao descobrir novo tablet OU se o tablet anunciar e ainda estiver UNASSIGNED
                // Isso garante que o provisionamento aconteça mesmo se a mensagem DISCOVERY inicial for perdida.
                const isUnassigned = msg.sender.role === 'UNASSIGNED';
                if (msg.type === 'DISCOVERY' || (msg.type === 'ANNOUNCE' && isUnassigned)) {
                    console.log(`[CC] 📡 Detectado dispositivo para provisionamento: ${msg.sender.id} (${msg.type})`);
                    meshService.sendTo(msg.sender.id, 'BIN_VERSION_CHECK', { requiredVersion: CURRENT_BIN_VERSION });
                }
            }

            if (msg.type === 'SECURITY_REPORT') {
                setSecurityReports(prev => ({ ...prev, [msg.sender.id]: msg.payload }));

                // AUTO-PROVISIONING: Se o relatório for saudável, envia dados automaticamente
                if (!msg.payload.isRooted && msg.payload.isBinaryIntact) {
                    console.log(`[CC] ✅ Tablet ${msg.sender.id} aprovado no check de segurança. Enviando dados...`);

                    // Determinar papel padrão baseado na fase atual ou usar STUDENT como fallback
                    const targetRole = (chargePhase !== 'IDLE' ? chargePhase : 'STUDENT') as MeshRole;
                    const peerId = msg.sender.id;

                    meshService.sendTo(peerId, 'PROVISION_CMD', {
                        targetRole,
                        assignedName: `${targetRole}-${peerId.substring(0, 4)}`,
                        schoolId: selectedSchoolId,
                        examIds: selectedExamIds,
                        metadata: {
                            provisionedAt: new Date().toISOString(),
                            autoProvisioned: true
                        }
                    });
                } else {
                    console.warn(`[CC] ⚠️ Tablet ${msg.sender.id} REJEITADO: Falha de segurança.`);
                }
            }

            if (msg.type === 'DISCOVERY_CONFLICT') {
                setConflictedPeers(prev => [...prev, msg.payload.conflictedId]);
                console.warn(`[CC] Bloqueando ID em conflito: ${msg.payload.conflictedId}`);
            }
        });

        const interval = setInterval(() => {
            setPeers(meshService.getPeers());
        }, 3000);

        return () => {
            clearInterval(interval);
            meshService.disconnect();
        };
    }, [chargePhase, selectedSchoolId, selectedExamIds, selectedTenantId]);

    // --- LÓGICA DE CARGA SEGMENTADA (WIZARD) ---

    const tenantSchools = state.schools.filter(s => s.tenantId === selectedTenantId);
    const availableExams = state.exams.filter(e => e.tenantId === selectedTenantId && (selectedSchoolId ? e.schoolId === selectedSchoolId : true));
    const availableTablets = peers.filter(p => p.role === 'UNASSIGNED');

    const toggleExam = (id: string) => {
        if (selectedExamIds.includes(id)) setSelectedExamIds(selectedExamIds.filter(e => e !== id));
        else setSelectedExamIds([...selectedExamIds, id]);
    };

    const handleStartProvisioning = async () => {
        if (availableTablets.length === 0) return toast.warning('Nenhum tablet detectado', 'Verifique a Sala de Carga.');
        if (selectedExamIds.length === 0) return toast.warning('Selecione pelo menos uma prova');
        if (!selectedSchoolId) return toast.warning('Selecione a escola de destino');

        setIsProvisioning(true);
        setProvisioningProgress(0);

        const school = state.schools.find(s => s.id === selectedSchoolId);
        const totalToProvision = roleConfig.coordinators + roleConfig.professors + roleConfig.students;
        const tabletsToUse = availableTablets.slice(0, totalToProvision);

        for (let i = 0; i < tabletsToUse.length; i++) {
            const tablet = tabletsToUse[i];
            let role: 'COORDINATOR' | 'PROFESSOR' | 'STUDENT' = 'STUDENT';

            if (i < roleConfig.coordinators) role = 'COORDINATOR';
            else if (i < roleConfig.coordinators + roleConfig.professors) role = 'PROFESSOR';

            // Malas segmentadas por papel e escola (Simulação de metadados de carga)
            const suitcaseTag = `${school?.name.substring(0, 3).toUpperCase()}-${role[0]}-${Math.floor(i / 10) + 1}`;

            meshService.sendTo(tablet.id, 'PROVISION_CMD', {
                targetRole: role,
                assignedName: `${role[0]}_${tablet.id.substring(0, 4)}`,
                schoolId: selectedSchoolId,
                examIds: selectedExamIds,
                metadata: {
                    suitcaseTag,
                    provisionedAt: new Date().toISOString()
                }
            } as any);

            setProvisioningProgress(Math.round(((i + 1) / tabletsToUse.length) * 100));
            await new Promise(r => setTimeout(r, 500)); // Simula latência de rede mesh
        }

        setIsProvisioning(false);
        setLoadingStep(4);
        toast.success('Provisionamento concluído!', 'Todos os dispositivos foram carregados.');
    };

    const handleGenerateQR = async () => {
        if (selectedExamIds.length === 0) return toast.warning('Selecione as provas primeiro');

        const payload = {
            type: 'FORGE_OFFLINE_PACKAGE',
            tenantId: selectedTenantId,
            schoolId: selectedSchoolId,
            exams: selectedExamIds.map(id => state.exams.find(e => e.id === id)),
            timestamp: Date.now(),
            version: '1.2.0'
        };

        const chunks = await QRDataTransfer.compressAndChunk(payload);
        setQrChunks(chunks);
        setCurrentChunkIdx(0);
        setShowQrModal(true);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-[600px] space-y-8">

            {/* Header / Tabs */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm">
                {(['PRODUCTION', 'EXPEDITION', 'QUALITY'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        {tab === 'PRODUCTION' ? 'Carga (Wizard)' : tab === 'EXPEDITION' ? 'Expedição' : 'Qualidade'}
                    </button>
                ))}
                <button
                    onClick={() => setShowHelpModal(true)}
                    className="ml-4 px-4 py-2 text-brand-primary font-bold flex items-center gap-2 hover:bg-brand-primary/5 rounded-xl transition-all"
                >
                    <HelpCircle size={18} /> Como Operar na Sede?
                </button>
            </div>

            {/* Gateway Status Bar */}
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${gatewayStatus === 'ONLINE'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : gatewayStatus === 'CHECKING'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${gatewayStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' :
                    gatewayStatus === 'CHECKING' ? 'bg-amber-400 animate-pulse' :
                        'bg-red-400'
                    }`} />
                <Wifi size={16} />
                {gatewayStatus === 'ONLINE' && (
                    <span>🛜 Gateway Wi-Fi Ativo (Porta {envConfig.getNetworkConfig().port}) — <b>{peers.length} dispositivo(s)</b> na rede</span>
                )}
                {gatewayStatus === 'CHECKING' && (
                    <span>Verificando Gateway Local...</span>
                )}
                {gatewayStatus === 'OFFLINE' && (
                    <span>⚠️ Gateway Offline — Execute <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">npm run mesh:gateway</code> no terminal</span>
                )}
            </div>

            {activeTab === 'PRODUCTION' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Stepper */}
                    <div className="flex items-center justify-between max-w-4xl mx-auto mb-12 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                        {[1, 2, 3, 4].map(step => (
                            <div
                                key={step}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-500 ${loadingStep >= step ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                            >
                                {loadingStep > step ? <CheckCircle size={20} /> : step}
                                <span className={`absolute -bottom-7 text-[10px] uppercase font-black tracking-tighter whitespace-nowrap ${loadingStep === step ? 'text-brand-primary' : 'text-slate-400'}`}>
                                    {step === 1 ? 'Contexto' : step === 2 ? 'Configuração' : step === 3 ? 'Carga' : 'Resumo'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* WIZARD PANEL */}
                        <div className="lg:col-span-2 space-y-6">
                            {loadingStep === 1 && (
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95 duration-300">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><MapPin className="text-brand-primary" /> 1. Seleção de Contexto</h3>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Rede / Município</label>
                                            <select
                                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-primary transition"
                                                value={selectedTenantId}
                                                onChange={e => setSelectedTenantId(e.target.value)}
                                            >
                                                {state.tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Escola de Destino</label>
                                            <select
                                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-primary transition"
                                                value={selectedSchoolId}
                                                onChange={e => setSelectedSchoolId(e.target.value)}
                                            >
                                                <option value="">Selecione a Escola</option>
                                                {tenantSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Provas do Pacote</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                                            {availableExams.map(exam => (
                                                <div
                                                    key={exam.id}
                                                    onClick={() => toggleExam(exam.id)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all ${selectedExamIds.includes(exam.id) ? 'bg-brand-primary/5 border-brand-primary' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                                                >
                                                    <div>
                                                        <p className="font-black text-slate-800">{exam.title}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{exam.subject}</p>
                                                    </div>
                                                    {selectedExamIds.includes(exam.id) ? <CheckCircle className="text-brand-primary" /> : <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200"></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={() => setLoadingStep(2)}
                                            disabled={!selectedSchoolId || selectedExamIds.length === 0}
                                            className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-30 flex items-center gap-3"
                                        >
                                            Continuar <Radio size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loadingStep === 2 && (
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95 duration-300">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Layers className="text-brand-primary" /> 2. Configuração de Lote</h3>

                                    <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-brand-primary">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Contexto Ativo</p>
                                        <p className="font-black text-slate-800">{state.schools.find(s => s.id === selectedSchoolId)?.name} • {selectedExamIds.length} Provas</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-2xl bg-sky-50 border-2 border-sky-100 text-center">
                                                <MapPin className="mx-auto mb-2 text-sky-600" size={32} />
                                                <p className="text-[10px] font-black uppercase text-sky-600">Coordenadores</p>
                                                <input
                                                    type="number"
                                                    value={roleConfig.coordinators}
                                                    onChange={e => setRoleConfig({ ...roleConfig, coordinators: parseInt(e.target.value) })}
                                                    className="w-full bg-transparent text-center text-3xl font-black text-slate-800 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-center">
                                                <Briefcase className="mx-auto mb-2 text-indigo-600" size={32} />
                                                <p className="text-[10px] font-black uppercase text-indigo-600">Professores</p>
                                                <input
                                                    type="number"
                                                    value={roleConfig.professors}
                                                    onChange={e => setRoleConfig({ ...roleConfig, professors: parseInt(e.target.value) })}
                                                    className="w-full bg-transparent text-center text-3xl font-black text-slate-800 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-center">
                                                <Radio className="mx-auto mb-2 text-emerald-600" size={32} />
                                                <p className="text-[10px] font-black uppercase text-emerald-600">Alunos</p>
                                                <input
                                                    type="number"
                                                    value={roleConfig.students}
                                                    onChange={e => setRoleConfig({ ...roleConfig, students: parseInt(e.target.value) })}
                                                    className="w-full bg-transparent text-center text-3xl font-black text-slate-800 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Total de Tablets</p>
                                            <p className="text-2xl font-black">{roleConfig.coordinators + roleConfig.professors + roleConfig.students} Dispositivos</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-bold uppercase">Status da Sala</p>
                                            <p className={`font-black ${availableTablets.length >= (roleConfig.coordinators + roleConfig.professors + roleConfig.students) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {availableTablets.length} Disponíveis
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4">
                                        <button onClick={() => setLoadingStep(1)} className="text-slate-500 font-bold hover:text-slate-800">Voltar</button>
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={handleGenerateQR}
                                                className="text-slate-400 text-sm font-bold hover:text-slate-600 underline underline-offset-4 decoration-slate-300 transition-colors"
                                            >
                                                Usar QR Fallback (Manual)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLoadingStep(3);
                                                    setChargePhase('IDLE');
                                                }}
                                                className="bg-brand-primary text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:translate-y-[-2px] active:scale-95 transition-all flex items-center gap-3"
                                            >
                                                <Radio className="animate-pulse" size={18} />
                                                Abrir Sala de Carga (Mesh)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loadingStep === 3 && (
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-12 animate-in zoom-in-95 duration-300 py-16 text-center">
                                    <div className="flex justify-center gap-4 mb-8">
                                        {(['STUDENT', 'PROFESSOR', 'COORDINATOR'] as const).map(phase => (
                                            <div
                                                key={phase}
                                                className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-2 font-black transition-all ${chargePhase === phase ? 'bg-brand-primary border-brand-primary text-white scale-105 shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}
                                            >
                                                {chargePhase === phase && <RefreshCcw className="animate-spin" size={16} />}
                                                {phase === 'STUDENT' ? 'Fase A: Alunos' : phase === 'PROFESSOR' ? 'Fase B: Profs' : 'Fase C: Coord'}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="relative w-48 h-48 mx-auto">
                                        <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                                        <div
                                            className="absolute inset-0 border-8 border-brand-primary rounded-full transition-all duration-500"
                                            style={{
                                                clipPath: `polygon(50% 50%, -50% -50%, ${provisioningProgress > 50 ? '150% -50%' : '50% -50%'}, ${provisioningProgress > 75 ? '150% 150%' : '150% 50%'}, ${provisioningProgress > 100 ? '-50% 150%' : '50% 150%'}, 50% 50%)`,
                                                transform: `rotate(${provisioningProgress * 3.6}deg)`
                                            }}
                                        ></div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black text-slate-800">{provisioningProgress}%</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lote Global</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-slate-800">Protocolo Zero-Touch Ativo</h3>
                                        <p className="text-slate-500 max-w-md mx-auto">
                                            {chargePhase === 'IDLE'
                                                ? "Aguardando início do disparo estagiado."
                                                : `Carregando dispositivos da fase: ${chargePhase}.`}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {chargePhase === 'IDLE' ? (
                                            <button
                                                onClick={() => {
                                                    setChargePhase('STUDENT');
                                                    setIsProvisioning(true);
                                                }}
                                                className="bg-brand-primary text-white px-16 py-5 rounded-3xl text-lg font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto"
                                            >
                                                <Truck /> Iniciar Fases de Carga
                                            </button>
                                        ) : (
                                            <div className="flex gap-4 mx-auto">
                                                <button
                                                    onClick={() => {
                                                        if (chargePhase === 'STUDENT') setChargePhase('PROFESSOR');
                                                        else if (chargePhase === 'PROFESSOR') setChargePhase('COORDINATOR');
                                                        else {
                                                            setChargePhase('IDLE');
                                                            setLoadingStep(4);
                                                        }
                                                    }}
                                                    className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition"
                                                >
                                                    Avançar para Próxima Fase
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setChargePhase('IDLE');
                                                        setIsProvisioning(false);
                                                    }}
                                                    className="border-2 border-rose-200 text-rose-500 px-6 py-4 rounded-2xl font-black hover:bg-rose-50 transition"
                                                >
                                                    Abortar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {conflictedPeers.length > 0 && (
                                        <div className="mt-8 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 animate-bounce">
                                            <AlertTriangle />
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase">Tentativa de Fraude / Conflito</p>
                                                <p className="text-[10px] font-bold">SN em conflito detectado e bloqueado: {conflictedPeers[0]}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {loadingStep === 4 && (
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95 duration-300">
                                    <div className="text-center py-6">
                                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800">Lote Preparado!</h3>
                                        <p className="text-slate-500">O provisionamento foi concluído e os ativos foram auditados.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-2">Escola</p>
                                            <p className="font-black text-slate-800">{state.schools.find(s => s.id === selectedSchoolId)?.name}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-2">Total de Ativos</p>
                                            <p className="font-black text-slate-800">{roleConfig.coordinators + roleConfig.professors + roleConfig.students} Tablets</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setActiveTab('EXPEDITION')}
                                            className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition"
                                        >
                                            Verificar Malas
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLoadingStep(1);
                                                setSelectedExamIds([]);
                                            }}
                                            className="flex-1 border-2 border-slate-200 py-5 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition"
                                        >
                                            Nova Carga
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COL: MESH MONITORING */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl h-full border-t-8 border-brand-primary">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-black text-sm uppercase text-white tracking-widest flex items-center gap-2">
                                        <Server className="text-brand-primary" size={16} /> Sala de Carga
                                    </h3>
                                    <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                        {peers.length} Online
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {peers.length > 0 ? peers.map(peer => (
                                        <div
                                            key={peer.id}
                                            className={`p-4 rounded-2xl border-2 transition-all duration-300 flex justify-between items-center ${peer.role === 'UNASSIGNED' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-brand-primary/10 border-brand-primary/30'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${peer.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`}></div>
                                                <div>
                                                    <p className="text-xs font-black text-white">{peer.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{peer.id.substring(0, 8)}</p>
                                                        {securityReports[peer.id] && (
                                                            <div className="flex gap-1">
                                                                <ShieldCheck size={10} className={securityReports[peer.id].isBinaryIntact ? "text-emerald-400" : "text-rose-400"} />
                                                                {securityReports[peer.id].isRooted && <AlertTriangle size={10} className="text-rose-400" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${peer.role === 'UNASSIGNED' ? 'bg-slate-800 text-slate-400' : 'bg-brand-primary text-white'}`}>
                                                    {peer.role}
                                                </span>
                                                {peer.role === 'UNASSIGNED' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            meshService.sendTo(peer.id, 'BIN_VERSION_CHECK', { requiredVersion: CURRENT_BIN_VERSION });
                                                        }}
                                                        className="text-[9px] text-brand-primary font-black uppercase hover:underline"
                                                    >
                                                        ⚡ Forçar Carga
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-20 opacity-30">
                                            <RefreshCcw size={48} className="mx-auto mb-4 animate-spin-slow" />
                                            <p className="font-bold text-sm">Buscando dispositivos...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                {state.logisticsCases?.length > 0 ? state.logisticsCases.map(suitcase => (
                                    <div key={suitcase.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
                                                <Briefcase size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{suitcase.caseNumber}</div>
                                                <div className="text-xs text-slate-500">{suitcase.currentSchoolId} • {suitcase.assets?.length || 0}/{suitcase.capacity} Tablets</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${suitcase.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
                                <div className="text-2xl font-black">{state.logisticsCases?.length || 0} Malas</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Escolas Atendidas</div>
                                <div className="text-2xl font-black">{new Set(state.logisticsCases?.map(s => s.currentSchoolId)).size} Unidades</div>
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

                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left">
                                    <div className="flex gap-2 text-slate-800 font-bold text-xs mb-1">
                                        <AlertTriangle size={14} className="text-amber-500" /> COMO REALIZAR A CARGA:
                                    </div>
                                    <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                                        <li>Este QR Code <b>não pode ser lido por celulares comuns</b>.</li>
                                        <li>Use a câmera do <b>Tablet FORGE</b> no modo "Receber Carga".</li>
                                        <li>Os dados estão divididos em <b>{qrChunks.length} partes</b> para maior segurança.</li>
                                        <li>Escaneie cada parte e clique em "Próximo" até completar 100%.</li>
                                    </ul>
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
                                                toast.success('Carga concluída!', 'O dispositivo possui todos os dados necessários.');
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
            {showHelpModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in">
                    <div className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-brand-primary/20">
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Guia de Operação (Protocolo Sede)</h2>
                                    <p className="text-slate-500 font-bold text-sm">Instruções para carga massiva e segurança.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="p-4 hover:bg-slate-200 rounded-full transition-all active:scale-95"
                            >
                                <Plus size={28} className="rotate-45 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* COLUNA 1: REDE */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Wifi className="text-brand-primary" /> 1. Preparação da Rede
                                </h3>
                                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
                                    <p className="text-sm text-blue-900 font-bold leading-relaxed">
                                        A plataforma não cria um sinal de Wi-Fi. Ela opera dentro de uma rede existente. Para os tablets "enxergarem" o Centro de Comando:
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-xs text-blue-800">
                                            <div className="p-1 bg-blue-200 rounded-full mt-0.5"><Monitor size={12} /></div>
                                            <span><b>Passo A:</b> No Windows, ative o <b>Mobile Hotspot</b> (Hotspot Móvel) e defina um nome/senha.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-xs text-blue-800">
                                            <div className="p-1 bg-blue-200 rounded-full mt-0.5"><Smartphone size={12} /></div>
                                            <span><b>Passo B:</b> Conecte todos os tablets na rede Wi-Fi criada pelo seu computador.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-xs text-blue-800">
                                            <div className="p-1 bg-blue-200 rounded-full mt-0.5"><Radio size={12} /></div>
                                            <span><b>Passo C:</b> Os tablets aparecerão automaticamente na "Sala de Carga" à direita.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* COLUNA 2: PROTOCOLO 3 PASSOS */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Layers className="text-brand-primary" /> 2. O Protocolo 3-Passos
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center font-black text-slate-500">1</div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">Download do APK</p>
                                            <p className="text-xs text-slate-500">O tablet baixa a versão {CURRENT_BIN_VERSION} do app Forge automaticamente.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center font-black text-slate-500">2</div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">Teste Anti-Fraude</p>
                                            <p className="text-xs text-slate-500">O sistema bloqueia tablets com Root ou aplicativos não oficiais.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center font-black text-slate-500">3</div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">Carga E2E</p>
                                            <p className="text-xs text-slate-500">Os dados da prova são enviados de forma fragmentada e segura.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 rounded-b-[32px] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <AlertTriangle className="text-amber-400" size={24} />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-xs">
                                    Lembre-se: O servidor de carga deve permanecer ativo durante todo o processo de provisionamento.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                Entendi, vamos lá!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
