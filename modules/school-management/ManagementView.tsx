import React from 'react';
import { GraduationCap, Briefcase, Users, Settings, Plus, X, School as SchoolIcon, Upload, Radio, FileText, Download, Network, GitMerge, ArrowRight, ShieldCheck, Database, AlertTriangle } from 'lucide-react';
import { UserRole } from '../../types';
import { useSchoolManagement } from './hooks/useSchoolManagement';
import { CommandCenter } from './components/CommandCenter';
import { ManagementForms } from './components/ManagementForms';
import { UserManagementTab } from '../../modules/admin/users/UserManagementTab';

export const ManagementView = () => {
    const {
        activeTab, setActiveTab,
        isModalOpen, setIsModalOpen,
        editingUser, editingStudent, editingSchool, editingClass,
        schoolForm, setSchoolForm,
        classForm, setClassForm,
        studentForm, setStudentForm,
        userForm, setUserForm,
        currentUser, currentTenantId, userSchoolId,
        isTenantAdmin, isDirector,
        visibleSchools, visibleClasses, visibleStudents,
        state,
        csvInputRef, batchSchoolInputRef,
        handleBatchSchoolImport, downloadTemplate, handleSubmit, handleCsvImport,
        openModal, handleDelete, onUpdateSettings
    } = useSchoolManagement();

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Hidden File Inputs (Persistent) */}
            <input type="file" accept=".csv" className="hidden" ref={csvInputRef} onChange={handleCsvImport} />
            <input type="file" accept=".csv" className="hidden" ref={batchSchoolInputRef} onChange={handleBatchSchoolImport} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl md:text-2xl font-bold text-brand-dark flex items-center gap-2">
                    <GraduationCap className="flex-shrink-0" /> Gestão Escolar
                    {!isTenantAdmin && (
                        <span className="text-[10px] md:text-sm font-normal bg-brand-light text-brand-primary px-3 py-1 rounded-full whitespace-nowrap">
                            {state.schools.find(s => s.id === userSchoolId)?.name}
                        </span>
                    )}
                </h1>
                <div className="flex w-full sm:w-auto gap-2">
                    {activeTab === 'STUDENTS' && (
                        <button onClick={() => csvInputRef.current?.click()} className="flex-1 sm:flex-none justify-center bg-white text-slate-600 border border-slate-300 px-3 md:px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Upload size={18} /> <span className="sm:inline">Importar</span> CSV
                        </button>
                    )}
                    {/* Hide header Add button for COMMAND_CENTER, SETTINGS, etc. and for USERS/PROFESSORES/RESPONSAVEIS (has its own button) or if no permission for SCHOOLS */}
                    {activeTab !== 'COMMAND_CENTER' && activeTab !== 'SETTINGS' && activeTab !== 'BATCH_IMPORT' && activeTab !== 'HIERARCHY' && activeTab !== 'USERS' && activeTab !== 'PROFESSORES' && activeTab !== 'RESPONSAVEIS' && (isTenantAdmin || isDirector || activeTab !== 'SCHOOLS') && (
                        <button onClick={() => openModal()} className="flex-1 sm:flex-none justify-center btn-gradient px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-xs md:text-sm font-medium">
                            <Plus size={18} />
                            Adicionar <span className="sm:inline">{activeTab === 'SCHOOLS' ? 'Escola' : activeTab === 'CLASSES' ? 'Turma' : activeTab === 'STUDENTS' ? 'Aluno' : 'Usuário'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-6 overflow-x-auto pb-1">
                {isTenantAdmin && (
                    <>
                        <button onClick={() => setActiveTab('HIERARCHY')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'HIERARCHY' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                            <GitMerge size={18} /> Organograma
                        </button>
                        <button onClick={() => setActiveTab('BATCH_IMPORT')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'BATCH_IMPORT' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                            <FileText size={18} /> Carga em Lote
                        </button>
                    </>
                )}
                <button onClick={() => setActiveTab('SCHOOLS')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'SCHOOLS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <Briefcase size={18} /> {isDirector ? 'Minha Escola / Infra' : 'Escolas'}
                </button>
                <button onClick={() => setActiveTab('CLASSES')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'CLASSES' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <SchoolIcon size={18} /> Turmas
                </button>
                <button onClick={() => setActiveTab('STUDENTS')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'STUDENTS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <Users size={18} /> Alunos
                </button>
                <button onClick={() => setActiveTab('PROFESSORES')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'PROFESSORES' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <Users size={18} /> Professores
                </button>
                <button onClick={() => setActiveTab('RESPONSAVEIS')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'RESPONSAVEIS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <Users size={18} /> Responsáveis
                </button>
                <button onClick={() => setActiveTab('USERS')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'USERS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <Settings size={18} /> Geral
                </button>
                <button onClick={() => setActiveTab('COMMAND_CENTER')} className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'COMMAND_CENTER' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>
                    <Radio size={18} /> Centro de Comando
                </button>
                <button onClick={() => setActiveTab('SETTINGS')} className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'SETTINGS' ? 'border-brand-dark text-brand-dark' : 'border-transparent text-slate-500'}`}>
                    <ShieldCheck size={18} /> Governança & LGPD
                </button>
                {isTenantAdmin && (
                    <button onClick={() => setActiveTab('TENANT_SETTINGS')} className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'TENANT_SETTINGS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                        <Settings size={18} /> Configuração do Tenant
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">

                {activeTab === 'HIERARCHY' && (
                    <div className="p-4 md:p-8 overflow-x-auto custom-scrollbar">
                        <div className="min-w-[800px] flex flex-col items-center">
                            {/* Root: Secretaria */}
                            <div className="bg-brand-dark text-white p-4 rounded-xl shadow-lg border-2 border-brand-primary w-64 text-center z-10">
                                <div className="flex justify-center mb-2"><Network size={32} /></div>
                                <div className="font-bold text-lg">Secretaria de Educação</div>
                                <div className="text-xs text-brand-light">{state.schools.length} Escolas Vinculadas</div>
                            </div>

                            {/* Connector Line */}
                            <div className="h-12 w-0.5 bg-slate-300 my-0"></div>

                            {/* Schools Row */}
                            <div className="flex flex-wrap justify-center gap-8 relative">
                                {/* Horizontal Line connecting schools */}
                                <div className="absolute top-0 left-10 right-10 h-0.5 bg-slate-300 -z-0"></div>

                                {state.schools.map(school => (
                                    <div key={school.id} className="flex flex-col items-center mt-0 relative z-10">
                                        <div className="h-6 w-0.5 bg-slate-300 mb-0"></div>

                                        {/* School Node */}
                                        <div className="bg-white border-2 border-brand-secondary p-3 rounded-lg shadow-sm w-56 hover:shadow-md transition-all cursor-pointer group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <SchoolIcon size={18} className="text-brand-primary" />
                                                <div className="font-bold text-sm text-slate-800 truncate">{school.name}</div>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 bg-slate-50 p-1 rounded">
                                                <span className="flex gap-1 items-center"><Users size={10} /> {state.students.filter(s => s.schoolId === school.id).length}</span>
                                                <span className="flex gap-1 items-center"><Briefcase size={10} /> {state.users.filter(u => u.schoolId === school.id && u.role === 'PROFESSOR').length}</span>
                                            </div>

                                            {/* Expanded Classes on Hover */}
                                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 hidden group-hover:block animate-in fade-in">
                                                {state.classes.filter(c => c.schoolId === school.id).map(cls => (
                                                    <div key={cls.id} className="text-xs text-slate-600 flex items-center gap-1 py-0.5">
                                                        <ArrowRight size={10} className="text-slate-300" /> {cls.name} ({cls.series})
                                                    </div>
                                                ))}
                                                {state.classes.filter(c => c.schoolId === school.id).length === 0 && <span className="text-xs italic text-slate-300">Sem turmas</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-12 text-center text-xs text-slate-400">
                            Visualização hierárquica da rede municipal. Passe o mouse sobre a escola para ver as turmas.
                        </div>
                    </div>
                )}

                {activeTab === 'BATCH_IMPORT' && (
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Import Schools & Directors */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-brand-primary text-white p-2 rounded-lg"><SchoolIcon size={24} /></div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Carga de Escolas</h3>
                                        <p className="text-xs text-slate-500">Importar Escolas via CSV</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                    Utilize esta ferramenta para cadastrar múltiplas escolas de uma vez. O arquivo deve conter nome e INEP.
                                </p>
                                <div className="space-y-3">
                                    <button onClick={downloadTemplate} className="w-full py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100">
                                        <Download size={16} /> Baixar Modelo CSV
                                    </button>
                                    <button onClick={() => batchSchoolInputRef.current?.click()} className="w-full py-3 bg-brand-primary text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md">
                                        <Upload size={18} /> Selecionar Arquivo (.csv)
                                    </button>
                                </div>
                            </div>

                            {/* Import Students (Restored) */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-emerald-600 text-white p-2 rounded-lg"><Users size={24} /></div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Carga de Alunos (Global)</h3>
                                        <p className="text-xs text-slate-500">Importar Alunos via CSV</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                    Importe alunos para qualquer turma. O sistema solicitará o ID da Turma para vincular os alunos do arquivo.
                                </p>
                                <button onClick={() => csvInputRef.current?.click()} className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 shadow-md">
                                    <Upload size={18} /> Selecionar Arquivo (.csv)
                                </button>
                                {/* Reusing the same input ref for simplicity, as logic is shared */}
                            </div>
                        </div>

                        <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                            <Database size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-blue-800 text-sm">Log de Processamento</h4>
                                <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc pl-4">
                                    <li>Nenhum processamento em lote recente.</li>
                                    <li>O sistema valida duplicidade de INEP automaticamente.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SETTINGS' && (
                    <div className="p-8 max-w-3xl mx-auto">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={18} /> Preferências da Escola</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">Ranking de Alunos</div>
                                        <div className="text-xs text-slate-500">Permitir que alunos vejam sua posição na turma</div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="ranking-toggle" checked={state.settings.rankingEnabled} onChange={() => onUpdateSettings && onUpdateSettings({ ...state.settings, rankingEnabled: !state.settings.rankingEnabled })} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                        <label htmlFor="ranking-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${state.settings.rankingEnabled ? 'bg-brand-primary' : 'bg-slate-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">Anonimato no Ranking</div>
                                        <div className="text-xs text-slate-500">Se ativo, exibe apenas matrícula em vez do nome</div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="anon-toggle" checked={state.settings.rankingAnonymity === 'ANONIMO'} onChange={() => onUpdateSettings && onUpdateSettings({ ...state.settings, rankingAnonymity: state.settings.rankingAnonymity === 'NOMINAL' ? 'ANONIMO' : 'NOMINAL' })} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                        <label htmlFor="anon-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${state.settings.rankingAnonymity === 'ANONIMO' ? 'bg-brand-primary' : 'bg-slate-300'}`}></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                            <ShieldCheck className="mx-auto mb-2 text-emerald-500" size={24} />
                            Todas as alterações de cadastro são auditadas e registradas conforme LGPD.
                        </div>
                    </div>
                )}

                {activeTab === 'COMMAND_CENTER' && (
                    <CommandCenter state={state} userSchoolId={userSchoolId} />
                )}

                {activeTab === 'SCHOOLS' && (
                    <div className="divide-y divide-slate-100">
                        {visibleSchools.map(s => (
                            <div key={s.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm md:text-base">{s.name}</div>
                                    <div className="text-[10px] md:text-xs text-slate-500 uppercase font-medium">INEP: {s.inep}</div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded hidden md:inline">ID: {s.id.slice(0, 6)}</span>
                                    {isDirector && (
                                        <button onClick={() => openModal(s)} className="flex-1 sm:flex-none text-[10px] md:text-xs font-bold bg-brand-light text-brand-primary px-3 py-2 md:py-1 rounded hover:bg-brand-secondary hover:text-white transition text-center uppercase">
                                            Infraestrutura
                                        </button>
                                    )}
                                    {isTenantAdmin && (
                                        <>
                                            <button onClick={() => openModal(s)} className="flex-1 sm:flex-none text-[10px] md:text-xs font-bold border border-slate-200 text-slate-500 px-3 py-2 md:py-1 rounded hover:bg-slate-100 text-center uppercase">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(s.id, 'SCHOOL', s.name)} className="flex-1 sm:flex-none text-[10px] md:text-xs font-bold border border-red-200 text-red-500 px-3 py-2 md:py-1 rounded hover:bg-red-50 text-center uppercase">
                                                Excluir
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {visibleSchools.length === 0 && <div className="p-8 text-center text-slate-400">Nenhuma escola cadastrada ou acessível.</div>}
                    </div>
                )}

                {activeTab === 'CLASSES' && (
                    <div className="divide-y divide-slate-100">
                        {visibleClasses.map(c => (
                            <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-slate-50">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm md:text-base">{c.name} <span className="text-slate-400 text-[10px] md:text-xs font-normal">({c.series})</span></div>
                                    <div className="text-[10px] md:text-xs text-slate-500 uppercase font-medium">
                                        {c.shift} • {state.schools.find(s => s.id === c.schoolId)?.name}
                                        {c.room && <span className="ml-2 text-slate-400 normal-case">• Sala: {c.room}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(c, 'CLASS')} className="text-[10px] md:text-xs font-bold border border-slate-200 text-slate-500 px-3 py-1 rounded hover:bg-slate-100 uppercase">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(c.id, 'CLASS', c.name)} className="text-[10px] md:text-xs font-bold border border-red-200 text-red-500 px-3 py-1 rounded hover:bg-red-50 uppercase">
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                        {visibleClasses.length === 0 && <div className="p-8 text-center text-slate-400">Nenhuma turma cadastrada.</div>}
                    </div>
                )}

                {activeTab === 'STUDENTS' && (
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {visibleStudents.map(s => (
                            <div key={s.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                <div>
                                    <div className="font-bold text-slate-800">{s.name}</div>
                                    <div className="text-xs text-slate-500">Mat: {s.registrationNumber}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{state.classes.find(c => c.id === s.classId)?.name}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => openModal(s, 'STUDENT')} className="text-slate-400 hover:text-brand-primary p-1 rounded" title="Editar Aluno">
                                            <Settings size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(s.id, 'STUDENT', s.name)} className="text-slate-400 hover:text-red-500 p-1 rounded" title="Excluir Aluno">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {visibleStudents.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum aluno cadastrado.</div>}
                    </div>
                )}

                {activeTab === 'USERS' && currentUser && (
                    <UserManagementTab
                        currentUser={currentUser}
                        isTenantAdmin={isTenantAdmin}
                        schools={state.schools}
                        forcedRole="ALL"
                    />
                )}

                {activeTab === 'PROFESSORES' && currentUser && (
                    <UserManagementTab
                        currentUser={currentUser}
                        isTenantAdmin={isTenantAdmin}
                        schools={state.schools}
                        forcedRole={UserRole.PROFESSOR}
                    />
                )}

                {activeTab === 'RESPONSAVEIS' && currentUser && (
                    <UserManagementTab
                        currentUser={currentUser}
                        isTenantAdmin={isTenantAdmin}
                        schools={state.schools}
                        forcedRole={UserRole.PAIS}
                    />
                )}

                {activeTab === 'TENANT_SETTINGS' && isTenantAdmin && (
                    <div className="p-8 max-w-4xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Features Toggling */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="text-indigo-600" size={20} /> Funcionalidades Ativas
                                </h3>

                                {(() => {
                                    const tenant = state.tenants.find(t => t.id === currentTenantId);
                                    const features = tenant?.features || {
                                        ai_audit: true,
                                        neuro_screening: true,
                                        tablet_mode: true,
                                        offline_sync: false,
                                        bi_advanced: true
                                    };

                                    const toggleFeature = (key: string) => {
                                        const newFeatures = { ...features, [key]: !(features as any)[key] };
                                        state.updateTenantFeatures(currentTenantId, newFeatures);
                                    };

                                    return (
                                        <div className="space-y-4">
                                            {[
                                                { id: 'ai_audit', label: 'Auditoria com IA', desc: 'Habilita auditoria pedagógica automatizada em provas.' },
                                                { id: 'neuro_screening', label: 'NeuroScreening', desc: 'Habilita triagem cognitiva e comportamental.' },
                                                { id: 'tablet_mode', label: 'Modo Tablet', desc: 'Interface otimizada para dispositivos móveis.' },
                                                { id: 'offline_sync', label: 'Sincronização Offline', desc: 'Permite aplicação de provas sem internet.' },
                                                { id: 'bi_advanced', label: 'Analytics Avançado (BI)', desc: 'Dashboards dinâmicos e exportação de dados.' }
                                            ].map(feat => (
                                                <div key={feat.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800">{feat.label}</div>
                                                        <div className="text-[10px] text-slate-500">{feat.desc}</div>
                                                    </div>
                                                    <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                                                        <input
                                                            type="checkbox"
                                                            id={`toggle-${feat.id}`}
                                                            checked={(features as any)[feat.id]}
                                                            onChange={() => toggleFeature(feat.id)}
                                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                        />
                                                        <label htmlFor={`toggle-${feat.id}`} className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${(features as any)[feat.id] ? 'bg-indigo-600' : 'bg-slate-300'}`}></label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Tenant Details */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-4">Metadados do Município</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Tenant ID:</span>
                                            <span className="font-mono text-slate-800 font-bold">{currentTenantId}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Tipo de Rede:</span>
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Public Municipal</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                                    <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Zona de Impacto
                                    </h4>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Alterar funcionalidades globais impacta imediatamente todos os usuários deste Tenant.
                                        Mudanças são registradas logs de auditoria imutáveis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Generic Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`bg-white rounded-xl shadow-2xl w-full overflow-hidden border border-brand-primary/20 ${activeTab === 'SCHOOLS' ? 'max-w-2xl' : 'max-w-md'}`}>
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">
                                {activeTab === 'SCHOOLS' ? (isDirector ? 'Atualizar Censo Escolar' : 'Gerenciar Escola') : `${editingUser || editingStudent || editingClass ? 'Editar' : 'Adicionar'} ${activeTab === 'CLASSES' ? 'Turma' : activeTab === 'STUDENTS' ? 'Aluno' : 'Usuário'}`}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <ManagementForms
                                activeTab={activeTab}
                                isTenantAdmin={isTenantAdmin}
                                isDirector={isDirector}
                                userSchoolId={userSchoolId}
                                schools={state.schools}
                                classes={state.classes}
                                schoolForm={schoolForm} setSchoolForm={setSchoolForm}
                                classForm={classForm} setClassForm={setClassForm}
                                studentForm={studentForm} setStudentForm={setStudentForm}
                                userForm={userForm} setUserForm={setUserForm}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
