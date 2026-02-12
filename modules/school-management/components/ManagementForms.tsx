
import React from 'react';
import { Shield } from 'lucide-react';
import { School, SchoolClass, UserRole, SchoolResources } from '../../../types';

interface ManagementFormsProps {
    activeTab: string;
    isTenantAdmin: boolean;
    isDirector: boolean;
    userSchoolId?: string;
    schools: School[];
    classes: SchoolClass[];

    // Form States & Setters
    schoolForm: { name: string, inep: string, resources: SchoolResources };
    setSchoolForm: (val: any) => void;

    classForm: { name: string, series: string, shift: string, schoolId: string, room?: string };
    setClassForm: (val: any) => void;

    studentForm: { name: string, reg: string, classId: string };
    setStudentForm: (val: any) => void;

    userForm: { name: string, email: string, role: UserRole, schoolId: string, classIds: string[] };
    setUserForm: (val: any) => void;

    onSubmit: () => void;
}

export const ManagementForms = ({
    activeTab, isTenantAdmin, isDirector, userSchoolId, schools, classes,
    schoolForm, setSchoolForm,
    classForm, setClassForm,
    studentForm, setStudentForm,
    userForm, setUserForm,
    onSubmit
}: ManagementFormsProps) => {

    // --- SCHOOL FORM ---
    if (activeTab === 'SCHOOLS') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Escola</label>
                        <input className="w-full border rounded-lg p-2 bg-slate-50" value={schoolForm.name} disabled={isDirector} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código INEP</label>
                        <input className="w-full border rounded-lg p-2 bg-slate-50" value={schoolForm.inep} disabled={isDirector} onChange={e => setSchoolForm({ ...schoolForm, inep: e.target.value })} />
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Shield size={16} className="text-brand-primary" /> Relatório de Infraestrutura & Recursos
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">Marque os itens disponíveis ou recebidos na unidade escolar.</p>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { key: 'funding', label: 'Verba Recebida' },
                            { key: 'uniforms', label: 'Uniformes Entregues' },
                            { key: 'textbooks', label: 'Material Didático' },
                            { key: 'adminMaterials', label: 'Material Administrativo' },
                            { key: 'food', label: 'Merenda Regular' },
                            { key: 'internet', label: 'Internet Banda Larga' },
                            { key: 'lab', label: 'Laboratório Informática' },
                            { key: 'accessibility', label: 'Acessibilidade (PCD)' },
                            { key: 'extracurricular', label: 'Ativ. Extracurricular' },
                            { key: 'transportation', label: 'Transporte Escolar' },
                            { key: 'security', label: 'Segurança/Câmeras' },
                            { key: 'ac_cooling', label: 'Climatização (Ar)' },
                        ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={schoolForm.resources[item.key as keyof SchoolResources]}
                                    onChange={(e) => setSchoolForm({
                                        ...schoolForm,
                                        resources: { ...schoolForm.resources, [item.key]: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                                />
                                <span className="text-sm text-slate-700">{item.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button onClick={onSubmit} className="w-full btn-gradient text-white py-3 rounded-lg font-bold mt-6 shadow-md">
                    {isDirector ? 'Salvar Relatório' : 'Salvar Escola'}
                </button>
            </div>
        );
    }

    // --- CLASS FORM ---
    if (activeTab === 'CLASSES') {
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escola</label>
                    {isTenantAdmin ? (
                        <select className="w-full border rounded-lg p-2" value={classForm.schoolId} onChange={e => setClassForm({ ...classForm, schoolId: e.target.value })}>
                            <option value="">Selecione...</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    ) : (
                        <input className="w-full border rounded-lg p-2 bg-slate-100 text-slate-500" value={schools.find(s => s.id === userSchoolId)?.name} disabled />
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Turma</label>
                    <input className="w-full border rounded-lg p-2" placeholder="Ex: 9A" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Série/Ano</label>
                        <input className="w-full border rounded-lg p-2" placeholder="Ex: 9º Ano" value={classForm.series} onChange={e => setClassForm({ ...classForm, series: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turno</label>
                        <select className="w-full border rounded-lg p-2" value={classForm.shift} onChange={e => setClassForm({ ...classForm, shift: e.target.value })}>
                            <option value="MANHA">Manhã</option>
                            <option value="TARDE">Tarde</option>
                            <option value="NOITE">Noite</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sala (Opcional)</label>
                    <input className="w-full border rounded-lg p-2" placeholder="Ex: Sala 101, Bloco B" value={classForm.room || ''} onChange={e => setClassForm({ ...classForm, room: e.target.value })} />
                </div>
                <button onClick={onSubmit} className="w-full btn-gradient text-white py-3 rounded-lg font-bold mt-6 shadow-md">Salvar Turma</button>
            </div>
        );
    }

    // --- STUDENT FORM ---
    if (activeTab === 'STUDENTS') {
        const visibleClasses = isTenantAdmin ? classes : classes.filter(c => c.schoolId === userSchoolId);
        return (
            <div className="space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label><input className="w-full border rounded-lg p-2" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matrícula</label><input className="w-full border rounded-lg p-2" value={studentForm.reg} onChange={e => setStudentForm({ ...studentForm, reg: e.target.value })} /></div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma</label>
                    <select className="w-full border rounded-lg p-2" value={studentForm.classId} onChange={e => setStudentForm({ ...studentForm, classId: e.target.value })}>
                        <option value="">Selecione...</option>
                        {visibleClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                    </select>
                </div>
                <button onClick={onSubmit} className="w-full btn-gradient text-white py-3 rounded-lg font-bold mt-6 shadow-md">Salvar Aluno</button>
            </div>
        );
    }

    // --- USER FORM ---
    if (activeTab === 'USERS') {
        return (
            <div className="space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label><input className="w-full border rounded-lg p-2" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input className="w-full border rounded-lg p-2" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função</label>
                    <select className="w-full border rounded-lg p-2" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole })}>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* SCHOOL SELECTION (Required for non-Admin roles if Tenant Admin is creating) */}
                {isTenantAdmin && userForm.role !== UserRole.TENANT_ADMIN && userForm.role !== UserRole.SUPER_ADMIN && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular à Escola</label>
                        <select
                            className="w-full border rounded-lg p-2"
                            value={userForm.schoolId || ''}
                            onChange={e => setUserForm({ ...userForm, schoolId: e.target.value, classIds: [] })}
                        >
                            <option value="">Selecione uma Escola...</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}

                {/* CLASS SELECTION (Only for PROFESSOR) */}
                {userForm.role === UserRole.PROFESSOR && (userForm.schoolId || userSchoolId) && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turmas Associadas</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {classes.filter(c => c.schoolId === (userForm.schoolId || userSchoolId)).map(cls => (
                                <label key={cls.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={userForm.classIds?.includes(cls.id)}
                                        onChange={e => {
                                            const newClassIds = e.target.checked
                                                ? [...(userForm.classIds || []), cls.id]
                                                : (userForm.classIds || []).filter(id => id !== cls.id);
                                            setUserForm({ ...userForm, classIds: newClassIds });
                                        }}
                                        className="rounded text-brand-primary focus:ring-brand-primary"
                                    />
                                    <span className="text-sm text-slate-700 truncate" title={cls.name}>{cls.name} <span className="text-xs text-slate-400">({cls.series})</span></span>
                                </label>
                            ))}
                            {classes.filter(c => c.schoolId === (userForm.schoolId || userSchoolId)).length === 0 && (
                                <div className="text-xs text-slate-400 col-span-2 italic">Nenhuma turma cadastrada nesta escola.</div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            Selecione as turmas que este professor leciona. Ele terá acesso apenas aos alunos destas turmas.
                        </p>
                    </div>
                )}

                <button onClick={onSubmit} className="w-full btn-gradient text-white py-3 rounded-lg font-bold mt-6 shadow-md">Salvar Usuário</button>
            </div>
        );
    }

    return null;
};
