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
    allUsers: User[]; // Todos os usuários para auto-completar dados
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
    allUsers,
    currentTenantId,
    isTenantAdmin
}) => {
    const [activeTab, setActiveTab] = useState<'BASIC' | 'ACADEMIC' | 'FAMILY' | 'ADDRESS'>('BASIC');
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
        birthDate: string;
        gender: string;
        motherName: string;
        fatherName: string;
        responsibleEmail: string;
        responsiblePhone: string;
        documentNumber: string;
        address: {
            street: string;
            number: string;
            complement: string;
            neighborhood: string;
            city: string;
            state: string;
            zip: string;
        };
    }>({
        name: '',
        email: '',
        role: UserRole.PROFESSOR,
        schoolId: '',
        classIds: [],
        childrenIds: [],
        phone: '',
        registrationNumber: '',
        subjectIds: [],
        birthDate: '',
        gender: '',
        motherName: '',
        fatherName: '',
        responsibleEmail: '',
        responsiblePhone: '',
        documentNumber: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zip: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                setFormData({
                    name: editingUser.name || '',
                    email: editingUser.email || '',
                    role: editingUser.role,
                    schoolId: editingUser.schoolId || '',
                    classIds: editingUser.classIds || [],
                    childrenIds: editingUser.childrenIds || [],
                    phone: editingUser.phone || '',
                    registrationNumber: editingUser.registrationNumber || '',
                    subjectIds: editingUser.subjectIds || [],
                    birthDate: editingUser.birthDate || '',
                    gender: editingUser.gender || '',
                    motherName: editingUser.motherName || '',
                    fatherName: editingUser.fatherName || '',
                    responsibleEmail: editingUser.responsibleEmail || '',
                    responsiblePhone: editingUser.responsiblePhone || '',
                    documentNumber: editingUser.documentNumber || '',
                    address: {
                        street: editingUser.address?.street || '',
                        number: editingUser.address?.number || '',
                        complement: editingUser.address?.complement || '',
                        neighborhood: editingUser.address?.neighborhood || '',
                        city: editingUser.address?.city || '',
                        state: editingUser.address?.state || '',
                        zip: editingUser.address?.zip || ''
                    }
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
                    subjectIds: [],
                    birthDate: '',
                    gender: '',
                    motherName: '',
                    fatherName: '',
                    responsibleEmail: '',
                    responsiblePhone: '',
                    documentNumber: '',
                    address: {
                        street: '',
                        number: '',
                        complement: '',
                        neighborhood: '',
                        city: '',
                        state: '',
                        zip: ''
                    }
                });
            }
            setActiveTab('BASIC');
            setError(null);
        }
    }, [isOpen, editingUser]);

    // Otimização: Auto-preenchimento de dados de pai/mãe baseado no E-mail
    useEffect(() => {
        if (formData.responsibleEmail && formData.responsibleEmail.includes('@') && allUsers) {
            const rel = allUsers.find(u =>
                (u.role === UserRole.PAIS && u.email === formData.responsibleEmail) ||
                u.responsibleEmail === formData.responsibleEmail
            );
            if (rel && rel.id !== editingUser?.id) {
                setFormData(prev => ({
                    ...prev,
                    motherName: prev.motherName || rel.motherName || '',
                    fatherName: prev.fatherName || rel.fatherName || '',
                    responsiblePhone: prev.responsiblePhone || rel.responsiblePhone || rel.phone || '',
                    documentNumber: prev.documentNumber || rel.documentNumber || ''
                }));
            }
        }
    }, [formData.responsibleEmail, allUsers, editingUser?.id]);

    // Persistência: Recuperar e salvar rascunho (apenas para NOVO usuário)
    useEffect(() => {
        if (isOpen && !editingUser) {
            const draft = sessionStorage.getItem('userFormDraft');
            if (draft && JSON.stringify(formData) === JSON.stringify({
                name: '', email: '', role: UserRole.PROFESSOR, schoolId: '', classIds: [], childrenIds: [], phone: '', registrationNumber: '', subjectIds: [], birthDate: '', gender: '', motherName: '', fatherName: '', responsibleEmail: '', responsiblePhone: '', documentNumber: '', address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' }
            })) {
                try {
                    setFormData(JSON.parse(draft));
                } catch { /* ignore parse error */ }
            }
        }
    }, [isOpen, editingUser]);

    useEffect(() => {
        if (isOpen && !editingUser) {
            sessionStorage.setItem('userFormDraft', JSON.stringify(formData));
        }
    }, [formData, isOpen, editingUser]);

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
            if (!editingUser) {
                sessionStorage.removeItem('userFormDraft');
            }
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                {/* Tabs for Students */}
                {formData.role === UserRole.ALUNO && (
                    <div className="flex bg-slate-100 p-1 gap-1">
                        {[
                            { id: 'BASIC', label: 'Básico' },
                            { id: 'ACADEMIC', label: 'Escolar' },
                            { id: 'FAMILY', label: 'Filiação' },
                            { id: 'ADDRESS', label: 'Endereço' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded transition ${activeTab === tab.id
                                    ? 'bg-white text-brand-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {/* BASIC TAB */}
                    {(activeTab === 'BASIC' || formData.role !== UserRole.ALUNO) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
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

                                {formData.role === UserRole.ALUNO && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Gênero</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white font-medium"
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                            <option value="OUTRO">Outro / Não informar</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ACADEMIC TAB */}
                    {(activeTab === 'ACADEMIC' && formData.role === UserRole.ALUNO) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.birthDate}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nº de Matrícula</label>
                                    <input
                                        type="text"
                                        placeholder="RA / Matrícula"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.registrationNumber}
                                        onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 text-brand-primary">Escola de Matrícula</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-brand-primary/30 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-brand-light font-bold"
                                    value={formData.schoolId}
                                    onChange={e => setFormData({ ...formData, schoolId: e.target.value, classIds: [] })}
                                >
                                    <option value="">Selecione a Escola...</option>
                                    {availableSchools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.schoolId && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turmas Disponíveis</label>
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
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FAMILY TAB */}
                    {(activeTab === 'FAMILY' && formData.role === UserRole.ALUNO) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Mãe</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.motherName}
                                        onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Pai</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.fatherName}
                                        onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-brand-light p-4 rounded-xl border border-brand-primary/20">
                                <h4 className="text-xs font-bold text-brand-primary uppercase mb-3 flex items-center gap-2">
                                    <Check size={14} /> Dados do Responsável (Para Vínculo Automático)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase">E-mail do Responsável</label>
                                        <input
                                            type="email"
                                            placeholder="O sistema vinculará o pai/mãe por este e-mail"
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                                            value={formData.responsibleEmail}
                                            onChange={e => setFormData({ ...formData, responsibleEmail: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Telefone do Responsável</label>
                                        <input
                                            type="text"
                                            placeholder="(00) 00000-0000"
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                                            value={formData.responsiblePhone}
                                            onChange={e => setFormData({ ...formData, responsiblePhone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase">CPF / Documento</label>
                                        <input
                                            type="text"
                                            placeholder="000.000.000-00"
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                                            value={formData.documentNumber}
                                            onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-brand-primary mt-2 italic">
                                    * Informe o e-mail que o responsável usará para logar. O vínculo será automático.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ADDRESS TAB */}
                    {(activeTab === 'ADDRESS' && formData.role === UserRole.ALUNO) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Rua / Logradouro</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.address.street}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nº</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.address.number}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Bairro</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.address.neighborhood}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, neighborhood: e.target.value } })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">CEP</label>
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.address.zip}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, zip: e.target.value } })}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={formData.address.city}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">UF</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none uppercase"
                                        value={formData.address.state}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Non-Student Legacy Sections (School selection for Professors, etc.) */}
                    {formData.role !== UserRole.ALUNO && (
                        <div className="space-y-4">
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

                            {formData.role === UserRole.PROFESSOR && formData.schoolId && (
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
                                    </div>
                                </div>
                            )}

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
                        </div>
                    )}

                    {/* Children Selection for Parents (PLAN B: Manual Link) */}
                    {formData.role === UserRole.PAIS && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
                                Vínculo Manual de Filhos (Plano B)
                                <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[8px]">USAR EM CASO DE EXCEÇÃO</span>
                            </label>

                            <div className="space-y-2">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded-lg p-2 bg-white">
                                    <div className="grid grid-cols-1 gap-1">
                                        {allUsers.filter(u => u.role === UserRole.ALUNO).map(student => (
                                            <label key={student.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-100 last:border-0 group">
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
                                                    <span className="text-xs font-bold text-slate-700">{student.name}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {availableSchools.find(s => s.id === student.schoolId)?.name || 'Escola não vinculada'}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                        {allUsers.filter(u => u.role === UserRole.ALUNO).length === 0 && (
                                            <div className="text-center py-4 text-slate-400 text-xs italic">Nenhum aluno cadastrado para vínculo.</div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                                    O sistema já tenta vincular automaticamente por e-mail. Utilize esta lista apenas se o responsável usar um e-mail diferente do cadastrado no prontuário do aluno.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-between items-center bg-white border-t mt-4 -mx-6 px-6 pt-4 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                        >
                            Cancelar
                        </button>
                        <div className="flex gap-2">
                            {formData.role === UserRole.ALUNO && activeTab !== 'BASIC' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeTab === 'ACADEMIC') setActiveTab('BASIC');
                                        if (activeTab === 'FAMILY') setActiveTab('ACADEMIC');
                                        if (activeTab === 'ADDRESS') setActiveTab('FAMILY');
                                    }}
                                    className="px-4 py-2 text-slate-400 hover:text-slate-600 font-medium"
                                >
                                    Anterior
                                </button>
                            )}
                            {formData.role === UserRole.ALUNO && activeTab !== 'ADDRESS' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeTab === 'BASIC') setActiveTab('ACADEMIC');
                                        else if (activeTab === 'ACADEMIC') setActiveTab('FAMILY');
                                        else if (activeTab === 'FAMILY') setActiveTab('ADDRESS');
                                    }}
                                    className="px-6 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-secondary transition shadow-sm"
                                >
                                    Próximo
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-secondary transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : <><Check size={18} /> {editingUser ? 'Atualizar' : 'Cadastrar'}</>}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
