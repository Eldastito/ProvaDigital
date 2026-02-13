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
    currentTenantId,
    isTenantAdmin
}) => {
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        role: UserRole;
        schoolId: string;
        classIds: string[];
    }>({
        name: '',
        email: '',
        role: UserRole.PROFESSOR,
        schoolId: '',
        classIds: []
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
                    classIds: editingUser.classIds || []
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    role: UserRole.PROFESSOR,
                    schoolId: '',
                    classIds: []
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
            if (formData.role !== UserRole.TENANT_ADMIN && formData.role !== UserRole.SUPER_ADMIN && !formData.schoolId && isTenantAdmin) {
                // If Tenant Admin creating a school user, school is required unless user is also Admin
                // If director, schoolId will be injected by parent anyway, but here we check form
            }

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Função (Cargo)</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{translateUserRole(role)}</option>
                                ))}
                            </select>
                        </div>

                        {(formData.role !== UserRole.SUPER_ADMIN && formData.role !== UserRole.TENANT_ADMIN && (isTenantAdmin || availableSchools.length > 0)) && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Escola</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
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
