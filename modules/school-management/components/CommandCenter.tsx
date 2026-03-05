
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

    // Wizard de Carga States
    const [loadingStep, setLoadingStep] = useState<1 | 2 | 3 | 4>(1);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [roleConfig, setRoleConfig] = useState({
        coordinators: 1,
        professors: 2,
        students: 20
    });
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [provisioningProgress, setProvisioningProgress] = useState(0);

    // QR Transfer State
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

    // --- PERSISTÊNCIA DE ESTADO (LOCALSTORAGE) ---
    const STORAGE_KEY = `cc_wizard_${state.currentUser?.tenantId}_${state.currentUser?.id}`;

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.loadingStep) setLoadingStep(parsed.loadingStep);
                if (parsed.selectedSchoolId) setSelectedSchoolId(parsed.selectedSchoolId);
                if (parsed.roleConfig) setRoleConfig(parsed.roleConfig);
                if (parsed.selectedExamIds) setSelectedExamIds(parsed.selectedExamIds);
                if (parsed.selectedTenantId) setSelectedTenantId(parsed.selectedTenantId);
            } catch (e) {
                console.error("Failed to restore wizard state", e);
            }
        }
    }, []);

    useEffect(() => {
        // Não persistimos estados efêmeros como isProvisioning ou provisioningProgress
        const stateToSave = {
            loadingStep,
            selectedSchoolId,
            roleConfig,
            selectedExamIds,
            selectedTenantId
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [loadingStep, selectedSchoolId, roleConfig, selectedExamIds, selectedTenantId]);

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

    // --- LÓGICA DE CARGA SEGMENTADA (WIZARD) ---

    const tenantSchools = state.schools.filter(s => s.tenantId === selectedTenantId);
    const availableExams = state.exams.filter(e => e.tenantId === selectedTenantId && (selectedSchoolId ? e.schoolId === selectedSchoolId : true));
    const availableTablets = peers.filter(p => p.role === 'UNASSIGNED');

    const toggleExam = (id: string) => {
        if (selectedExamIds.includes(id)) setSelectedExamIds(selectedExamIds.filter(e => e !== id));
        else setSelectedExamIds([...selectedExamIds, id]);
    };

    const handleStartProvisioning = async () => {
        if (availableTablets.length === 0) return alert("Nenhum tablet detectado na 'Sala de Carga'.");
        if (selectedExamIds.length === 0) return alert("Selecione pelo menos uma prova.");
        if (!selectedSchoolId) return alert("Selecione a escola de destino.");

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
        alert("Provisionamento concluído com sucesso!");
    };

    const handleGenerateQR = async () => {
        if (selectedExamIds.length === 0) return alert("Selecione as provas primeiro.");

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
                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleGenerateQR}
                                                className="px-8 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition"
                                            >
                                                Gerar QR Fallback
                                            </button>
                                            <button
                                                onClick={() => setLoadingStep(3)}
                                                disabled={availableTablets.length < (roleConfig.coordinators + roleConfig.professors + roleConfig.students)}
                                                className="bg-brand-primary text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-30"
                                            >
                                                Iniciar Carga Mesh
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loadingStep === 3 && (
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-12 animate-in zoom-in-95 duration-300 py-16 text-center">
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
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transmitindo</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-slate-800">Enviando Pacotes Blindados</h3>
                                        <p className="text-slate-500 max-w-md mx-auto">Os tablets estão recebendo os metadados cifrados via conexão direta peer-to-peer.</p>
                                    </div>

                                    {!isProvisioning ? (
                                        <button
                                            onClick={handleStartProvisioning}
                                            className="bg-brand-primary text-white px-16 py-5 rounded-3xl text-lg font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto"
                                        >
                                            <Truck /> Executar Carga Massiva
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 text-brand-primary font-black animate-pulse">
                                            <RefreshCcw className="animate-spin" /> COMUNICAÇÃO MESH ATIVA...
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
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{peer.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${peer.role === 'UNASSIGNED' ? 'bg-slate-800 text-slate-400' : 'bg-brand-primary text-white'}`}>
                                                    {peer.role}
                                                </span>
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
