
import React, { useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';
import { School, SchoolClass, UserRole, SchoolResources } from '../../types';

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
    
    classForm: { name: string, series: string, shift: string, schoolId: string, capacity?: number };
    setClassForm: (val: any) => void;
    
    studentForm: { name: string, reg: string, classId: string };
    setStudentForm: (val: any) => void;
    
    userForm: { name: string, email: string, role: UserRole, schoolId: string };
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

    const [newResourceName, setNewResourceName] = useState('');

    const handleAddResource = () => {
        if (!newResourceName.trim()) return;
        const key = newResourceName.toLowerCase().replace(/\s+/g, '_');
        setSchoolForm({
            ...schoolForm,
            resources: { ...schoolForm.resources, [key]: false }
        });
        setNewResourceName('');
    };

    const handleRemoveResource = (key: string) => {
        const updatedResources = { ...schoolForm.resources };
        delete updatedResources[key];
        setSchoolForm({ ...schoolForm, resources: updatedResources });
    };

    const formatResourceLabel = (key: string) => {
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    };

    // --- SCHOOL FORM ---
    if (activeTab === 'SCHOOLS') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Escola</label>
                        <input className="w-full border rounded-lg p-2 bg-slate-50" value={schoolForm.name} disabled={isDirector} onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código INEP</label>
                        <input className="w-full border rounded-lg p-2 bg-slate-50" value={schoolForm.inep} disabled={isDirector} onChange={e => setSchoolForm({...schoolForm, inep: e.target.value})} />
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Shield size={16} className="text-brand-primary"/> Relatório de Infraestrutura & Recursos
                    </h4>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" 
                            placeholder="Adicionar novo item (Ex: Sala de Robótica)..."
                            value={newResourceName}
                            onChange={e => setNewResourceName(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAddResource()}
                        />
                        <button 
                            onClick={handleAddResource}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition"
                            title="Adicionar Recurso"
                        >
                            <Plus size={20}/>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {Object.keys(schoolForm.resources).map((key) => (
                            <div key={key} className="group relative flex items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={schoolForm.resources[key]} 
                                    onChange={(e) => setSchoolForm({
                                        ...schoolForm, 
                                        resources: { ...schoolForm.resources, [key]: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                                />
                                <span className="text-sm text-slate-700 flex-1">{formatResourceLabel(key)}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveResource(key); }}
                                    className="opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-50 rounded transition"
                                >
                                    <X size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onSubmit} className="w-full btn-premium text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-6 shadow-xl">
                    {isDirector ? 'Sincronizar Relatório' : 'Salvar Unidade Escolar'}
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
                        <select className="w-full border rounded-lg p-2" value={classForm.schoolId} onChange={e => setClassForm({...classForm, schoolId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    ) : (
                        <input className="w-full border rounded-lg p-2 bg-slate-100 text-slate-500" value={schools.find(s => s.id === userSchoolId)?.name} disabled />
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Turma</label>
                    <input className="w-full border rounded-lg p-2 font-bold" placeholder="Ex: 9A" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Série/Ano</label>
                        <input className="w-full border rounded-lg p-2" placeholder="Ex: 9º Ano" value={classForm.series} onChange={e => setClassForm({...classForm, series: e.target.value})} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turno</label>
                        <select className="w-full border rounded-lg p-2" value={classForm.shift} onChange={e => setClassForm({...classForm, shift: e.target.value})}>
                            <option value="MANHA">Manhã</option>
                            <option value="TARDE">Tarde</option>
                            <option value="NOITE">Noite</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd. Alunos</label>
                        <input 
                            type="number" 
                            className="w-full border rounded-lg p-2 font-black text-indigo-600" 
                            placeholder="Lotação" 
                            value={classForm.capacity} 
                            onChange={e => setClassForm({...classForm, capacity: parseInt(e.target.value) || 0})} 
                        />
                    </div>
                </div>
                <button onClick={onSubmit} className="w-full btn-premium text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-6 shadow-xl">Salvar Nova Turma</button>
            </div>
        );
    }

    // --- STUDENT FORM ---
    if (activeTab === 'STUDENTS') {
        const visibleClasses = isTenantAdmin ? classes : classes.filter(c => c.schoolId === userSchoolId);
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma de Destino</label>
                    <select className="w-full border rounded-lg p-2 font-bold text-brand-primary" value={studentForm.classId} onChange={e => setStudentForm({...studentForm, classId: e.target.value})}>
                        <option value="">Selecione a turma...</option>
                        {visibleClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Aluno</label>
                    <input className="w-full border rounded-lg p-2" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matrícula (Gerada Automaticamente)</label>
                    <input 
                        className="w-full border rounded-lg p-2 bg-slate-50 font-mono font-bold text-indigo-600" 
                        value={studentForm.reg} 
                        readOnly 
                        placeholder="Selecione a turma para gerar..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">Seguindo o padrão detectado na unidade escolar.</p>
                </div>
                <button onClick={onSubmit} className="w-full btn-premium text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-6 shadow-xl">Efetivar Matrícula</button>
            </div>
        );
    }

    // --- USER FORM ---
    if (activeTab === 'USERS') {
        return (
            <div className="space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label><input className="w-full border rounded-lg p-2" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input className="w-full border rounded-lg p-2" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função</label>
                    <select className="w-full border rounded-lg p-2" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <button onClick={onSubmit} className="w-full btn-premium text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-6 shadow-xl">Criar Usuário</button>
            </div>
        );
    }

    return null;
};
