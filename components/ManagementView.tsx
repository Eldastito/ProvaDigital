
import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Plus, X, School as SchoolIcon, ArrowRight, BookOpen, ShieldCheck, MapPin, Hash, UserPlus, Trash2 } from 'lucide-react';
import { AppState, School, SchoolClass, Student, User, UserRole } from '../types';
import { uuidv4 } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    fetchSchools, fetchClasses, fetchStudents, fetchUsers,
    insertSchool, updateSchool, insertClass, insertStudent, insertUser
} from '../services/supabaseClient';
import { ManagementForms } from './Management/ManagementForms';

type ManagementTab = 'SCHOOLS' | 'CLASSES' | 'STUDENTS' | 'USERS';

export const ManagementView = ({ state }: { state: AppState }) => {
    const { currentUser } = useAppStore();
    const [activeTab, setActiveTab] = useState<ManagementTab>('SCHOOLS'); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { data: schools = [] } = useQuery<School[]>({ queryKey: ['schools'], queryFn: fetchSchools });
    const { data: classes = [] } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses });
    const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents });
    const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: fetchUsers });

    const isTenantAdmin = currentUser?.role === UserRole.TENANT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;
    const isDirector = currentUser?.role === UserRole.DIRETOR;

    const visibleSchools = isTenantAdmin ? schools : schools.filter(s => s.id === currentUser?.schoolId);
    const visibleClasses = isTenantAdmin ? classes : classes.filter(c => c.schoolId === currentUser?.schoolId);
    const visibleStudents = isTenantAdmin ? students : students.filter(s => s.schoolId === currentUser?.schoolId);

    // Form States
    const [schoolForm, setSchoolForm] = useState<any>({ name: '', inep: '', resources: { funding: true, uniforms: false, textbooks: true } });
    const [classForm, setClassForm] = useState<any>({ name: '', series: '', shift: 'MANHA', schoolId: currentUser?.schoolId || '', capacity: 35 });
    const [studentForm, setStudentForm] = useState<any>({ name: '', reg: '', classId: '', schoolId: currentUser?.schoolId || '' });
    const [userForm, setUserForm] = useState<any>({ name: '', email: '', role: UserRole.PROFESSOR, schoolId: currentUser?.schoolId || '' });

    // --- AUTO MATRÍCULA LOGIC ---
    useEffect(() => {
        if (activeTab === 'STUDENTS' && studentForm.classId) {
            const targetClass = classes.find(c => c.id === studentForm.classId);
            const schoolStudents = students.filter(s => s.schoolId === targetClass?.schoolId);
            
            let suggestion = '';
            if (schoolStudents.length > 0) {
                // Tenta detectar o padrão da última matrícula
                const lastReg = schoolStudents[schoolStudents.length - 1].registrationNumber;
                const match = lastReg.match(/^(.*?)(\d+)$/);
                if (match) {
                    const prefix = match[1];
                    const num = parseInt(match[2]);
                    suggestion = `${prefix}${(num + 1).toString().padStart(match[2].length, '0')}`;
                } else {
                    suggestion = `REG-${(schoolStudents.length + 1).toString().padStart(3, '0')}`;
                }
            } else {
                // Padrão default baseado no ano
                suggestion = `${new Date().getFullYear()}-${visibleClasses.find(c=>c.id===studentForm.classId)?.name}-001`;
            }
            setStudentForm(prev => ({ ...prev, reg: suggestion }));
        }
    }, [studentForm.classId, activeTab, students, classes]);

    const addSchoolMutation = useMutation({ mutationFn: insertSchool, onSuccess: () => { alert('Unidade cadastrada!'); setIsModalOpen(false); } });
    const addClassMutation = useMutation({ mutationFn: insertClass, onSuccess: () => { alert('Turma criada!'); setIsModalOpen(false); } });
    const addStudentMutation = useMutation({ mutationFn: insertStudent, onSuccess: () => { alert('Matrícula realizada!'); setIsModalOpen(false); } });
    const addUserMutation = useMutation({ mutationFn: insertUser, onSuccess: () => { alert('Usuário cadastrado!'); setIsModalOpen(false); } });

    const handleSubmit = () => {
        if (!currentUser) return;
        
        if (activeTab === 'SCHOOLS') {
            addSchoolMutation.mutate({ 
                id: uuidv4(), 
                tenantId: currentUser.tenantId, 
                name: schoolForm.name, 
                inep: schoolForm.inep, 
                resources: schoolForm.resources 
            });
        }
        if (activeTab === 'CLASSES') {
            addClassMutation.mutate({ 
                id: uuidv4(), 
                schoolId: classForm.schoolId || currentUser.schoolId || '', 
                name: classForm.name, 
                series: classForm.series, 
                shift: classForm.shift,
                capacity: classForm.capacity
            });
        }
        if (activeTab === 'STUDENTS') {
            const targetClass = classes.find(c => c.id === studentForm.classId);
            addStudentMutation.mutate({
                id: uuidv4(),
                tenantId: currentUser.tenantId,
                schoolId: targetClass?.schoolId || currentUser.schoolId || '',
                classId: studentForm.classId,
                name: studentForm.name,
                registrationNumber: studentForm.reg
            });
        }
        if (activeTab === 'USERS') {
            addUserMutation.mutate({
                id: uuidv4(),
                tenantId: currentUser.tenantId,
                schoolId: userForm.schoolId || currentUser.schoolId || '',
                name: userForm.name,
                email: userForm.email,
                role: userForm.role
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                        <GraduationCap className="text-indigo-600" size={40}/> Unidades e Matrículas
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Gestão de infraestrutura, turmas e cadastro de alunos da rede.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-premium px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl">
                    <Plus size={20} /> Novo Registro
                </button>
            </div>

            <div className="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('SCHOOLS')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'SCHOOLS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Escolas / Unidades</button>
                <button onClick={() => setActiveTab('CLASSES')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'CLASSES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Turmas / Séries</button>
                <button onClick={() => setActiveTab('STUDENTS')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'STUDENTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Estudantes</button>
                <button onClick={() => setActiveTab('USERS')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Staff / Equipe</button>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                {activeTab === 'SCHOOLS' && (
                    <div className="divide-y divide-slate-50">
                        {visibleSchools.map(s => (
                            <div key={s.id} className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-white transition-all">
                                        <SchoolIcon size={32}/>
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-xl tracking-tight">{s.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Hash size={12}/> INEP: {s.inep}</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                <Users size={12}/> {students.filter(st => st.schoolId === s.id).length} Alunos
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" size={24} />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'CLASSES' && (
                    <div className="divide-y divide-slate-50">
                        {visibleClasses.map(c => (
                            <div key={c.id} className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-white transition-all">
                                        <BookOpen size={32}/>
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-xl tracking-tight">{c.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.series}</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.shift}</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                <Users size={12}/> {students.filter(st => st.classId === c.id).length} / {c.capacity || 'N/A'} Lotação
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-emerald-600 transition-all group-hover:translate-x-1" size={24} />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'STUDENTS' && (
                    <div className="divide-y divide-slate-50">
                        {visibleStudents.map(s => (
                            <div key={s.id} className="p-6 px-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-lg tracking-tight">{s.name}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                            <MapPin size={10}/> {classes.find(c => c.id === s.classId)?.name || 'Sem Turma'} 
                                            <span className="text-slate-200">•</span>
                                            RM: {s.registrationNumber}
                                        </div>
                                    </div>
                                </div>
                                <button className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'USERS' && (
                    <div className="divide-y divide-slate-50">
                        {users.filter(u => isTenantAdmin ? true : u.schoolId === currentUser?.schoolId).map(u => (
                            <div key={u.id} className="p-6 px-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${u.role === UserRole.PROFESSOR ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-lg tracking-tight">{u.name}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={10} className="text-indigo-500"/> {u.role.replace('_', ' ')}
                                            <span className="text-slate-200">•</span>
                                            {u.email}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-slate-600 transition-all" size={20} />
                            </div>
                        ))}
                    </div>
                )}

                {visibleSchools.length === 0 && activeTab === 'SCHOOLS' && (
                    <div className="p-32 text-center text-slate-300 flex flex-col items-center">
                        <SchoolIcon size={80} className="mb-4 opacity-10"/>
                        <p className="font-black uppercase tracking-widest text-xs italic">Nenhuma unidade escolar encontrada.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                         <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                             <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                    {activeTab === 'SCHOOLS' ? 'Nova Unidade' : activeTab === 'CLASSES' ? 'Nova Turma' : activeTab === 'STUDENTS' ? 'Nova Matrícula' : 'Novo Usuário'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Preencha os dados oficiais do registro</p>
                             </div>
                             <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={32}/></button>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <ManagementForms
                                activeTab={activeTab}
                                isTenantAdmin={isTenantAdmin}
                                isDirector={isDirector}
                                userSchoolId={currentUser?.schoolId}
                                schools={schools}
                                classes={classes}
                                schoolForm={schoolForm}
                                setSchoolForm={setSchoolForm}
                                classForm={classForm}
                                setClassForm={setClassForm}
                                studentForm={studentForm}
                                setStudentForm={setStudentForm}
                                userForm={userForm}
                                setUserForm={setUserForm}
                                onSubmit={handleSubmit}
                            />
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};
