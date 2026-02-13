import React, { useState, useEffect } from 'react';
import { User, UserRole, School, SchoolClass } from '../../../types';
import { X, Check, AlertCircle } from 'lucide-react';
import { translateUserRole } from '../../../utils/translations';
import { userService } from '../../../services/userService';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    editingUser?: User | null;
    availableSchools: School[];
    availableClasses: SchoolClass[];
    allStudents: User[]; // All students in the tenant for parent linkage
    currentTenantId: string;
    isTenantAdmin: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingUser,
    availableSchools,
    availableClasses,
    allStudents,
    currentTenantId,
    isTenantAdmin
}) => {
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        role: UserRole;
        schoolId: string;
        classIds: string[];
        childrenIds: string[];
        phone: string;
        registrationNumber: string;
        subjectIds: string[];
    }>({
        name: '',
        email: '',
        role: UserRole.PROFESSOR,
        schoolId: '',
        classIds: [],
        childrenIds: [],
        phone: '',
        registrationNumber: '',
        subjectIds: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                setFormData({
                    name: editingUser.name,
                    email: editingUser.email,
                    role: editingUser.role,
                    schoolId: editingUser.schoolId || '',
                    classIds: editingUser.classIds || [],
                    childrenIds: editingUser.childrenIds || [],
                    phone: editingUser.phone || '',
                    registrationNumber: editingUser.registrationNumber || '',
                    subjectIds: editingUser.subjectIds || []
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    role: UserRole.PROFESSOR,
                    schoolId: '',
                    classIds: [],
                    childrenIds: [],
                    phone: '',
                    registrationNumber: '',
                    subjectIds: []
                });
            }
            setError(null);
        }
    }, [isOpen, editingUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Basic Client Validations
            if (!formData.name.trim()) throw new Error('Nome é obrigatório');
            if (!formData.email.trim()) throw new Error('E-mail é obrigatório');

            // Call parent submit
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // List of students available for parent linkage (multi-school search within tenant)
    // Note: availableClasses might be filtered by school, but for parents we need all students
    // For now, we'll assume the parent component passes the full list of students if role is PAIS

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                            <input
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                            <input
                                type="text"
                                placeholder="(00) 00000-0000"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Função (Cargo)</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white font-medium"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{translateUserRole(role)}</option>
                                ))}
                            </select>
                        </div>

                        {(formData.role !== UserRole.SUPER_ADMIN && formData.role !== UserRole.TENANT_ADMIN && formData.role !== UserRole.PAIS && (isTenantAdmin || availableSchools.length > 0)) && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Escola</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white font-medium"
                                    value={formData.schoolId}
                                    onChange={e => setFormData({ ...formData, schoolId: e.target.value, classIds: [] })}
                                >
                                    <option value="">Selecione...</option>
                                    {availableSchools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {formData.role === UserRole.ALUNO && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nº de Matrícula</label>
                            <input
                                type="text"
                                placeholder="Gerada automaticamente se vazio"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-slate-50"
                                value={formData.registrationNumber}
                                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Class Selection for Professors and Students */}
                    {(formData.role === UserRole.PROFESSOR || formData.role === UserRole.ALUNO) && formData.schoolId && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turmas Associadas</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {availableClasses.filter(c => c.schoolId === formData.schoolId).map(cls => (
                                    <label key={cls.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.classIds?.includes(cls.id)}
                                            onChange={e => {
                                                const newClassIds = e.target.checked
                                                    ? [...(formData.classIds || []), cls.id]
                                                    : (formData.classIds || []).filter(id => id !== cls.id);
                                                setFormData({ ...formData, classIds: newClassIds });
                                            }}
                                            className="rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-sm text-slate-700 truncate" title={cls.name}>
                                            {cls.name} <span className="text-xs text-slate-400">({cls.series})</span>
                                        </span>
                                    </label>
                                ))}
                                {availableClasses.filter(c => c.schoolId === formData.schoolId).length === 0 && (
                                    <div className="text-xs text-slate-400 col-span-2 italic">Nenhuma turma cadastrada nesta escola.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subject Selection for Professors */}
                    {formData.role === UserRole.PROFESSOR && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Disciplinas / Áreas de Conhecimento</label>
                            <div className="flex flex-wrap gap-2">
                                {['Linguagens', 'Matemática', 'Ciências da Natureza', 'Ciências Humanas', 'Ensino Religioso'].map(subject => (
                                    <label key={subject} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 cursor-pointer hover:border-brand-primary group transition">
                                        <input
                                            type="checkbox"
                                            checked={formData.subjectIds?.includes(subject)}
                                            onChange={e => {
                                                const newSubjects = e.target.checked
                                                    ? [...(formData.subjectIds || []), subject]
                                                    : (formData.subjectIds || []).filter(s => s !== subject);
                                                setFormData({ ...formData, subjectIds: newSubjects });
                                            }}
                                            className="rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-xs font-medium text-slate-600 group-hover:text-brand-primary">{subject}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Children Selection for Parents */}
                    {formData.role === UserRole.PAIS && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vincular Filhos (Alunos)</label>

                            {/* Search-like student selection */}
                            <div className="space-y-2">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded p-2 bg-white">
                                    <div className="grid grid-cols-1 gap-1">
                                        {allStudents.map(student => (
                                            <label key={student.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-100 last:border-0">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.childrenIds?.includes(student.id)}
                                                    onChange={e => {
                                                        const newIds = e.target.checked
                                                            ? [...(formData.childrenIds || []), student.id]
                                                            : (formData.childrenIds || []).filter(id => id !== student.id);
                                                        setFormData({ ...formData, childrenIds: newIds });
                                                    }}
                                                    className="rounded text-brand-primary focus:ring-brand-primary"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{student.name}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {availableSchools.find(s => s.id === student.schoolId)?.name || 'Escola não vinculada'}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                        {allStudents.length === 0 && (
                                            <div className="text-center py-4 text-slate-400 text-xs italic">Nenhum aluno cadastrado para vínculo.</div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Selecione os filhos deste responsável. O sistema permite vincular alunos de diferentes escolas da rede.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-secondary transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : <><Check size={18} /> Salvar Usuário</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
