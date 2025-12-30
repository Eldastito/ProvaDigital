
import React, { useState, useEffect } from 'react';
import { Radio, Power, Server, Box, Layers, MapPin, Briefcase, Truck, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { AppState, MeshPeer, ProvisioningPayload, School, Student, Exam, Tenant, MeshRole } from '../../types';
import { meshService } from '../../services/localMeshService';
import { useQuery } from '@tanstack/react-query';
import { fetchSchools, fetchStudents, fetchExams, fetchTenants } from '../../services/supabaseClient';

interface CommandCenterProps {
    state: AppState; 
    userSchoolId?: string;
}

export const CommandCenter = ({ state, userSchoolId }: CommandCenterProps) => {
    const { data: allSchools } = useQuery<School[]>({ queryKey: ['schools'], queryFn: fetchSchools, initialData: [] });
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allTenants } = useQuery<Tenant[]>({ queryKey: ['tenants'], queryFn: fetchTenants, initialData: [] });

    const [peers, setPeers] = useState<MeshPeer[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState(state.currentUser?.tenantId || '');
    
    const [suitcaseSize, setSuitcaseSize] = useState<number>(20); 
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]); 

    useEffect(() => {
        meshService.join('SERVER', 'SaaS-Central-Logistics', MeshRole.UNASSIGNED);
        const interval = setInterval(() => {
            setPeers(meshService.getPeers());
        }, 1000);
        return () => {
            clearInterval(interval);
            meshService.disconnect();
        };
    }, []);

    const tenantSchools = allSchools?.filter(s => s.tenantId === selectedTenantId) || [];
    const availableExams = allExams?.filter(e => e.tenantId === selectedTenantId) || [];
    const availableTablets = peers.filter(p => p.role === MeshRole.UNASSIGNED);

    const toggleExam = (id: string) => {
        if (selectedExamIds.includes(id)) setSelectedExamIds(selectedExamIds.filter(e => e !== id));
        else setSelectedExamIds([...selectedExamIds, id]);
    };

    const handleBatchLoad = () => {
        if (selectedExamIds.length === 0) return alert("Selecione pelo menos uma prova para compor o pacote regional.");
        if (availableTablets.length === 0) return alert("Nenhum tablet detectado na 'Sala de Carga'.");

        const confirmMsg = `CONFIRMAÇÃO DE CARGA REGIONAL\n\n` +
            `- Município: ${allTenants?.find(t => t.id === selectedTenantId)?.name}\n` +
            `- Conteúdo: ${selectedExamIds.length} Provas Criptografadas\n` +
            `- Destino: ${availableTablets.length} Dispositivos Detectados\n\n` +
            `Os tablets receberão dados de TODAS as escolas do município, permitindo flexibilidade total de transporte.`;

        if (!confirm(confirmMsg)) return;

        let processed = 0;
        availableTablets.forEach((tablet, idx) => {
            const suitcaseNumber = Math.floor(idx / suitcaseSize) + 1;
            
            meshService.broadcast('PROVISION_CMD', {
                targetRole: MeshRole.STUDENT,
                assignedName: `Mala ${suitcaseNumber} - Unidade ${idx % suitcaseSize + 1}`,
                killNetworkAfter: false 
            } as ProvisioningPayload);
            processed++;
        });

        alert(`Carga Regional concluída em ${processed} dispositivos! Podem ser acomodados nas malas.`);
    };

    const handleProvisionCoordinators = () => {
        const targets = availableTablets.slice(0, tenantSchools.length); 
        
        if (targets.length === 0) return alert("Sem dispositivos.");

        targets.forEach((t, i) => {
            const school = tenantSchools[i % tenantSchools.length];
            meshService.broadcast('PROVISION_CMD', {
                targetRole: MeshRole.COORDINATOR,
                assignedName: `COORD - ${school.name}`,
                killNetworkAfter: false
            } as ProvisioningPayload);
        });
        alert(`${targets.length} Tablets de Coordenação configurados com Chaves Mestras.`);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-[600px] space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Server className="text-brand-primary" size={32}/> Logística de Carga Unificada
                    </h2>
                    <p className="text-slate-500 mt-1">Prepare dispositivos para o município inteiro. Flexibilidade total entre escolas.</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Área de Staging (Wi-Fi Local)</div>
                    <div className="flex items-center justify-end gap-3">
                        <div className="text-3xl font-black text-slate-800">{peers.length}</div>
                        <div className={`w-4 h-4 rounded-full ${peers.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers size={20}/> 1. Conteúdo do Pacote</h3>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Município / Rede</label>
                            <select 
                                className="w-full border rounded-lg p-2 text-sm bg-slate-50 font-medium"
                                value={selectedTenantId}
                                onChange={e => setSelectedTenantId(e.target.value)}
                                disabled={!!userSchoolId}
                            >
                                {allTenants?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                            <div className="text-xs text-slate-400 uppercase font-bold px-2 py-1">Provas Disponíveis na Nuvem</div>
                            {availableExams.map(exam => (
                                <div 
                                    key={exam.id} 
                                    onClick={() => toggleExam(exam.id)}
                                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition ${selectedExamIds.includes(exam.id) ? 'bg-sky-50 border-brand-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{exam.title}</div>
                                        <div className="text-xs text-slate-500">{exam.subject} • {exam.durationMinutes} min</div>
                                    </div>
                                    {selectedExamIds.includes(exam.id) && <CheckCircle size={16} className="text-brand-primary"/>}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                            <AlertTriangle size={14} className="inline mr-1 mb-0.5"/>
                            <strong>Nota:</strong> Todos os dados serão carregados criptografados. O tablet só abre o conteúdo se receber a chave da escola correta.
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={20}/> 2. Configuração das Malas</h3>
                        
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[20, 10, 5].map(size => (
                                <button 
                                    key={size}
                                    onClick={() => setSuitcaseSize(size)}
                                    className={`py-3 rounded-lg border-2 font-bold text-sm flex flex-col items-center gap-1 transition ${suitcaseSize === size ? 'border-brand-primary bg-brand-light text-brand-dark' : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <Box size={20}/>
                                    {size} un.
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Previsão de Carga</div>
                            <div className="flex justify-center items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-800">{Math.ceil(availableTablets.length / suitcaseSize)}</span>
                                <span className="text-sm text-slate-500 font-medium">malas necessárias</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleBatchLoad}
                            disabled={availableTablets.length === 0 || selectedExamIds.length === 0}
                            className="w-full mt-6 bg-brand-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Truck size={20}/> Iniciar Carga em Massa
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleProvisionCoordinators}
                        className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 hover:text-brand-primary transition flex items-center justify-center gap-2"
                    >
                        <MapPin size={18}/> Configurar Tablets MESTRES (Coord)
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg h-full flex flex-col">
                        <h3 className="font-bold text-sm uppercase text-slate-400 mb-4 flex items-center gap-2">
                            <RefreshCcw size={16}/> Gestão de Ativos (Tempo Real)
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {peers.map(peer => (
                                <div key={peer.id} className="flex justify-between items-center border-b border-slate-700 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${peer.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                                        <div>
                                            <div className="text-xs font-mono text-slate-300">{peer.id.slice(0,8)}</div>
                                            <div className="text-[10px] font-bold text-white">{peer.name}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${peer.role === MeshRole.UNASSIGNED ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                        {peer.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
