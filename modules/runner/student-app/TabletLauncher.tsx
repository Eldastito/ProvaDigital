import React, { useState, useEffect } from 'react';
import { meshService } from '../../../services/localMeshService';
import { nativeBridge } from '../../../services/nativeBridgeService';
import { QrCode, ArrowLeft, ShieldCheck, Users, GraduationCap, Scan, Search, School, User, Lock, ChevronRight, LogIn, Battery, Wifi, Settings, LogOut, AlertTriangle, RefreshCcw } from 'lucide-react';
import { UserRole, School as SchoolType, User as UserType } from '../../../types';

import { useSafeAppStore } from '../../../store/useAppStore';
import { AppState } from '../../../types';

interface TabletLauncherProps {
    onSelectApp: (app: 'COORDINATOR' | 'PROFESSOR' | 'STUDENT', payload?: any) => void;
    onBack: () => void;
}

export const TabletLauncher = ({ onSelectApp, onBack }: TabletLauncherProps) => {
    const state = useSafeAppStore();
    // Main Mode
    const [mode, setMode] = useState<'SELECT' | 'SCANNING_QR' | 'COORD_FLOW' | 'AUTO_PROVISIONING'>('SELECT');
    const [provisioningStatus, setProvisioningStatus] = useState<string>('Aguardando sinal da rede...');
    const [isHardwareConflict, setIsHardwareConflict] = useState(false);

    // Coordinator Flow State
    const [coordStep, setCoordStep] = useState<'SCHOOL_SEARCH' | 'AUTH'>('SCHOOL_SEARCH');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [password, setPassword] = useState('');
    const [targetRole, setTargetRole] = useState<UserRole | null>(null);
    const [scanProgress, setScanProgress] = useState(0);

    // --- ZERO-TOUCH AUTO DISCOVERY LOGIC ---
    useEffect(() => {
        const initDiscovery = async () => {
            console.log('[DEBUG] 🏁 Iniciando descoberta mesh no tablet...');
            try {
                // Tenta obter o Serial Number real do hardware
                const deviceId = await nativeBridge.getDeviceId();
                console.log(`[DEBUG] 🆔 Device ID obtido: ${deviceId}`);

                // Entra na rede como UNASSIGNED para disparar Discovery
                console.log(`[DEBUG] 📡 Tentando meshService.join() para tenant: ${state.currentUser?.tenantId || 'global'}`);
                meshService.join(deviceId, `Tablet-${deviceId.substring(0, 4)}`, 'UNASSIGNED', state.currentUser?.tenantId);
                setMode('AUTO_PROVISIONING');
                console.log('[DEBUG] ✅ Modo AUTO_PROVISIONING ativado');

                meshService.onMessage(async (msg) => {
                    console.log(`[DEBUG] 📩 Mensagem recebida via Mesh: ${msg.type} de ${msg.sender.name}`);
                    if (msg.type === 'BIN_VERSION_CHECK') {
                        const { requiredVersion } = msg.payload;
                        const currentVersion = "2.5.0"; // Versão fixa para simulação

                        if (currentVersion !== requiredVersion) {
                            setProvisioningStatus(`Atualizando App para v${requiredVersion}...`);
                            await nativeBridge.downloadUpdateAPK(requiredVersion);
                            window.location.reload(); // Simula reinicialização após update
                            // Versão OK -> Realizar Check de Segurança
                            console.log('[DEBUG] 🛡️ Versão OK. Iniciando security check...');
                            setProvisioningStatus('Verificando integridade do dispositivo...');
                            const health = await nativeBridge.checkSecurityHealth();
                            console.log('[DEBUG] 📊 Relatório de segurança gerado:', health);
                            meshService.sendTo(msg.sender.id, 'SECURITY_REPORT', {
                                ...health,
                                serialNumber: deviceId,
                                timestamp: Date.now()
                            });
                            setProvisioningStatus('Dispositivo Seguro. Aguardando dados...');
                            console.log('[DEBUG] 📤 Relatório de segurança enviado ao CC.');
                        }
                    }

                    if (msg.type === 'PROVISION_CMD') {
                        handleAutoProvision(msg.payload);
                    }

                    if (msg.type === 'DISCOVERY_CONFLICT') {
                        console.error('[DEBUG] ❌ Conflito de hardware detectado!');
                        setIsHardwareConflict(true);
                        setProvisioningStatus('ERRO: Conflito de Hardware Detectado!');
                    }
                });
            } catch (err) {
                console.error('[DEBUG] 💀 Falha crítica no initDiscovery:', err);
                setProvisioningStatus('ERRO: Falha ao inicializar rede.');
            }
        };

        // Loop de Indução: Se em 5 segundos não sair de "Aguardando sinal", força novo DISCOVERY
        const discoveryRetry = setInterval(() => {
            if (provisioningStatus.includes('Aguardando sinal')) {
                console.log('[DEBUG] 🔄 Re-enviando sinal de descoberta (Retry)...');
                nativeBridge.getDeviceId().then(id => {
                    meshService.broadcast('DISCOVERY', { serialNumber: id });
                });
            }
        }, 10000);

        // Sempre inicia a descoberta mesh (independente de login)
        initDiscovery();

        return () => {
            clearInterval(discoveryRetry);
            meshService.disconnect();
        };
    }, [provisioningStatus]);

    const handleAutoProvision = (payload: any) => {
        setProvisioningStatus(`Configurando como ${payload.targetRole}...`);

        // Simula delay de configuração interna
        setTimeout(() => {
            onSelectApp(payload.targetRole, {
                source: 'ZERO_TOUCH_PROVISIONING',
                name: payload.assignedName,
                exams: payload.exams
            });
        }, 2000);
    };

    // --- QR SCANNER LOGIC (Legacy for Prof/Student) ---
    const startScan = (role: UserRole) => {
        setTargetRole(role);
        setMode('SCANNING_QR');
        setScanProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                handleScanSuccess(role);
            }
        }, 100);
    };

    const handleScanSuccess = (role: UserRole) => {
        if (role === UserRole.PROFESSOR) onSelectApp('PROFESSOR', { source: 'COORDINATOR_QR' });
        else if (role === UserRole.ALUNO) onSelectApp('STUDENT', { source: 'PROFESSOR_QR' });
    };

    // --- COORDINATOR FLOW LOGIC ---
    const startCoordinatorFlow = () => {
        setMode('COORD_FLOW');
        setCoordStep('SCHOOL_SEARCH');
        setSearchTerm('');
        setSelectedSchool(null);
    };

    const handleSchoolSelect = (school: SchoolType) => {
        setSelectedSchool(school);
        setCoordStep('AUTH');
        // Reset user selection
        setSelectedUser(null);
        setPassword('');
    };

    const handleCoordinatorLogin = () => {
        if (!selectedUser) return alert("Selecione seu usuário.");
        if (!password) return alert("Digite sua senha.");

        // Mock Password Check
        if (password.length < 3) return alert("Senha incorreta (Simulação: digite qualquer coisa com 3+ chars).");

        onSelectApp('COORDINATOR', {
            auth: 'PASSWORD_VERIFIED',
            schoolId: selectedSchool?.id,
            userId: selectedUser.id,
            userName: selectedUser.name
        });
    };

    // Filters
    const filteredSchools = state.schools.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.inep.includes(searchTerm)
    );

    const availableCoordinators = state.users.filter(u =>
        u.schoolId === selectedSchool?.id &&
        (u.role === UserRole.SUPERVISOR || u.role === UserRole.DIRETOR)
    );

    // --- RENDER: COORDINATOR FLOW ---
    if (mode === 'COORD_FLOW') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6">
                <div className="w-full max-w-4xl">
                    <button onClick={() => setMode('SELECT')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8">
                        <ArrowLeft size={20} /> Voltar para Seleção
                    </button>

                    {coordStep === 'SCHOOL_SEARCH' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <h1 className="text-3xl font-bold text-white mb-2">Qual é a sua escola?</h1>
                            <p className="text-slate-400 mb-8">Selecione a unidade onde a prova será aplicada.</p>

                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl text-lg focus:ring-2 focus:ring-brand-primary outline-none placeholder-slate-500"
                                    placeholder="Pesquisar por nome ou INEP..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {filteredSchools.map(school => (
                                    <button
                                        key={school.id}
                                        onClick={() => handleSchoolSelect(school)}
                                        className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-primary p-4 rounded-xl text-left transition group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-700 p-2 rounded-lg group-hover:bg-brand-primary group-hover:text-white transition">
                                                <School size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-lg">{school.name}</div>
                                                <div className="text-sm text-slate-400">INEP: {school.inep}</div>
                                            </div>
                                            <ChevronRight className="ml-auto text-slate-500 group-hover:text-brand-primary" />
                                        </div>
                                    </button>
                                ))}
                                {filteredSchools.length === 0 && (
                                    <div className="col-span-2 text-center py-12 text-slate-500">
                                        Nenhuma escola encontrada.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {coordStep === 'AUTH' && selectedSchool && (
                        <div className="animate-in fade-in slide-in-from-right-4 max-w-md mx-auto">
                            <div className="text-center mb-8">
                                <div className="bg-brand-primary/20 text-brand-primary p-4 rounded-full inline-flex mb-4">
                                    <School size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-white">{selectedSchool.name}</h2>
                                <button onClick={() => setCoordStep('SCHOOL_SEARCH')} className="text-sm text-brand-secondary hover:underline mt-2">Trocar Escola</button>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Selecione seu usuário</label>
                                    <div className="space-y-2">
                                        {availableCoordinators.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => setSelectedUser(user)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${selectedUser?.id === user.id ? 'bg-brand-primary border-brand-primary text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                                            >
                                                <User size={18} />
                                                <span className="font-medium">{user.name}</span>
                                                {selectedUser?.id === user.id && <ShieldCheck size={18} className="ml-auto" />}
                                            </button>
                                        ))}
                                        {availableCoordinators.length === 0 && <p className="text-slate-500 text-sm">Nenhum coordenador cadastrado nesta unidade.</p>}
                                    </div>
                                </div>

                                {selectedUser && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Senha de Acesso</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="password"
                                                className="w-full bg-slate-900 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                                placeholder="Sua senha do SaaS"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1">
                                            <ShieldCheck size={12} /> Utilize a mesma senha que você usa para logar no sistema web.
                                        </p>

                                        <button
                                            onClick={handleCoordinatorLogin}
                                            className="w-full mt-6 bg-brand-primary text-white py-3 rounded-lg font-bold hover:bg-brand-dark transition shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <LogIn size={20} /> Entrar no Tablet
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER: QR SCANNER (For Prof/Student) ---
    if (mode === 'SCANNING_QR') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative">
                <button onClick={() => setMode('SELECT')} className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center gap-2 z-20">
                    <ArrowLeft size={24} /> Cancelar
                </button>

                <div className="w-full max-w-md aspect-[3/4] bg-slate-900 rounded-2xl border-2 border-slate-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80')] bg-cover opacity-30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-emerald-500 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-[scan_1.5s_ease-in-out_infinite] shadow-[0_0_10px_#10b981]"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-8 left-0 right-0 text-center px-6">
                        <h3 className="text-xl font-bold text-white mb-2">
                            {targetRole === UserRole.PROFESSOR && "Escaneie o QR do Coordenador"}
                            {targetRole === UserRole.ALUNO && "Escaneie o QR do Professor"}
                        </h3>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: AUTO PROVISIONING (Zero-Touch) ---
    if (mode === 'AUTO_PROVISIONING') {
        return (
            <div className="min-h-screen bg-[#0f1d2e] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-12">
                    <div className={`w-32 h-32 rounded-full border-4 border-dashed animate-spin-slow flex items-center justify-center ${isHardwareConflict ? 'border-rose-500' : 'border-brand-secondary/40'}`}>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isHardwareConflict ? (
                            <ShieldCheck className="text-rose-500" size={48} />
                        ) : (
                            <Wifi className="text-brand-secondary animate-pulse" size={48} />
                        )}
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white mb-4">
                    {isHardwareConflict ? 'Segurança Ativada' : 'Provisionamento Inteligente'}
                </h1>

                <div className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${isHardwareConflict ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                    {isHardwareConflict ? <AlertTriangle size={20} /> : <RefreshCcw size={20} className="animate-spin" />}
                    {provisioningStatus}
                </div>

                {isHardwareConflict ? (
                    <div className="mt-8 max-w-sm">
                        <p className="text-slate-400 text-sm mb-6">
                            Este dispositivo tentou se conectar usando um identificador de hardware já em uso na rede. Por segurança, o acesso foi bloqueado.
                        </p>
                        <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition">
                            Tentar Novamente
                        </button>
                    </div>
                ) : (
                    <div className="mt-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2">
                        <p>Aguardando comando do Centro de Comando (Sede)</p>
                        <p className="opacity-50">Protocolo Zero-Touch v2.5</p>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: MAIN SELECTOR ---
    return (
        <div className="min-h-screen bg-[#0f1d2e] flex flex-col items-center justify-center p-6">
            <div className="absolute top-6 left-6">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={20} /> Voltar ao SaaS
                </button>
            </div>

            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-white/5 rounded-full mb-4 border border-white/10">
                    <QrCode size={48} className="text-brand-secondary" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Inicializar Dispositivo</h1>
                <p className="text-slate-400">Selecione sua função para ativar este tablet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {/* COORDENADOR (CUSTOM FLOW) */}
                <button onClick={startCoordinatorFlow} className="group bg-slate-800 hover:bg-brand-primary border border-slate-700 hover:border-brand-secondary rounded-2xl p-8 transition-all duration-300 text-left flex flex-col justify-between h-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <ShieldCheck size={100} />
                    </div>
                    <div className="bg-slate-700 group-hover:bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 transition">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Sou Coordenador</h2>
                        <p className="text-sm text-slate-400 group-hover:text-sky-100">Entre com sua escola e senha.</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-brand-secondary group-hover:text-white font-bold text-sm">
                        <LogIn size={16} /> Login Seguro
                    </div>
                </button>

                {/* PROFESSOR (QR) */}
                <button onClick={() => startScan(UserRole.PROFESSOR)} className="group bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-400 rounded-2xl p-8 transition-all duration-300 text-left flex flex-col justify-between h-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <Users size={100} />
                    </div>
                    <div className="bg-slate-700 group-hover:bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 transition">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Sou Professor</h2>
                        <p className="text-sm text-slate-400 group-hover:text-purple-100">Receba a turma do Coordenador.</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-purple-400 group-hover:text-white font-bold text-sm">
                        <Scan size={16} /> Ler Pacote da Turma
                    </div>
                </button>

                {/* ALUNO (QR) */}
                <button onClick={() => startScan(UserRole.ALUNO)} className="group bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-400 rounded-2xl p-8 transition-all duration-300 text-left flex flex-col justify-between h-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <GraduationCap size={100} />
                    </div>
                    <div className="bg-slate-700 group-hover:bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 transition">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Sou Aluno</h2>
                        <p className="text-sm text-slate-400 group-hover:text-emerald-100">Receba sua prova do Professor.</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 group-hover:text-white font-bold text-sm">
                        <Scan size={16} /> Ler QR da Prova
                    </div>
                </button>
            </div>
        </div>
    );
};
