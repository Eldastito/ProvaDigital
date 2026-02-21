import React from 'react';
import { User, UserRole, School, SchoolClass } from '../../../types';
import { X, User as UserIcon, Mail, Phone, Calendar, Hash, MapPin, Building2, BookOpen, Fingerprint } from 'lucide-react';
import { translateUserRole } from '../../../utils/translations';

interface UserViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    schools: School[];
    classes: SchoolClass[];
    allUsers: User[];
}

export const UserViewModal: React.FC<UserViewModalProps> = ({ isOpen, onClose, user, schools, classes, allUsers }) => {
    if (!isOpen || !user) return null;

    const schoolName = schools.find(s => s.id === user.schoolId)?.name || 'Nenhuma escola vinculada';
    const userClasses = classes.filter(c => user.classIds?.includes(c.id));
    const children = allUsers.filter(u => user.childrenIds?.includes(u.id));

    // Find all professors that share at least one class with the student (if the user is a student)
    const linkedProfessors = user.role === UserRole.ALUNO && user.classIds && user.classIds.length > 0
        ? allUsers.filter(p => p.role === UserRole.PROFESSOR && p.classIds?.some(id => user.classIds?.includes(id)))
        : [];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-lg">
                            {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">Visualizar Cadastro</h3>
                            <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">{translateUserRole(user.role)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">

                    {/* Basic Info */}
                    <section>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                            <UserIcon size={14} /> Dados Básicos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Nome Completo</label>
                                <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.name || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">E-mail</label>
                                <div className="text-sm font-medium text-slate-800 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <Mail size={14} className="text-slate-400" /> {user.email || '-'}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Telefone / Celular</label>
                                <div className="text-sm font-medium text-slate-800 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <Phone size={14} className="text-slate-400" /> {user.phone || '-'}
                                </div>
                            </div>
                            {user.role === UserRole.ALUNO && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Gênero</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.gender === 'M' ? 'Masculino' : user.gender === 'F' ? 'Feminino' : user.gender || '-'}</div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Academic Info */}
                    <section>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                            <Building2 size={14} /> Dados Acadêmicos / Profissionais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.role === UserRole.ALUNO && (
                                <>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Nº Matrícula</label>
                                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <Hash size={14} className="text-slate-400" /> {user.registrationNumber || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Data de Nascimento</label>
                                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <Calendar size={14} className="text-slate-400" /> {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                </>
                            )}
                            {(user.role === UserRole.PROFESSOR || user.role === UserRole.DIRETOR || user.role === UserRole.SUPERVISOR) && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Registro Funcional (SIAPE / Nº)</label>
                                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <Fingerprint size={14} className="text-slate-400" /> {user.registrationNumber || '-'}
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Escola Principal Vinculada</label>
                                <div className="text-sm font-bold text-brand-primary bg-brand-light/30 p-2 rounded-lg border border-brand-primary/20">{schoolName}</div>
                            </div>

                            {(user.role === UserRole.PROFESSOR || user.role === UserRole.ALUNO) && (
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Turmas Vinculadas</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-wrap gap-2">
                                        {userClasses.length > 0 ? (
                                            userClasses.map(c => (
                                                <span key={c.id} className="bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 text-xs shadow-sm">
                                                    {c.name} ({c.series})
                                                </span>
                                            ))
                                        ) : <span className="text-slate-400 italic">Nenhuma turma</span>}
                                    </div>
                                </div>
                            )}

                            {/* Linked Professors For Students */}
                            {user.role === UserRole.ALUNO && linkedProfessors.length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Professores Vinculados às Turmas</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-wrap gap-2">
                                        {linkedProfessors.map(prof => (
                                            <span key={prof.id} className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                                                <UserIcon size={10} /> {prof.name}
                                                {prof.subjectIds && prof.subjectIds.length > 0 && (
                                                    <span className="text-[9px] text-emerald-500 font-bold ml-1 uppercase">({prof.subjectIds.join(', ')})</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {user.role === UserRole.PROFESSOR && user.subjectIds && user.subjectIds.length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Disciplinas</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {user.subjectIds.map(sub => (
                                            <span key={sub} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                                <BookOpen size={12} /> {sub}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Family Info */}
                    {(user.role === UserRole.ALUNO || user.role === UserRole.PAIS) && (
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                                <UserIcon size={14} /> Dados Familiares
                            </h4>

                            {user.role === UserRole.ALUNO && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Nome da Mãe</label>
                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.motherName || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Nome do Pai</label>
                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.fatherName || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">E-mail do Responsável (Login Familiar)</label>
                                        <div className="text-sm font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100">{user.responsibleEmail || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">CPF do Responsável</label>
                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.documentNumber || '-'}</div>
                                    </div>
                                </div>
                            )}

                            {user.role === UserRole.PAIS && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Filhos Vinculados a esta Conta</label>
                                    <div className="space-y-2">
                                        {children.length > 0 ? (
                                            children.map(child => (
                                                <div key={child.id} className="flex flex-col bg-slate-50 border border-slate-200 p-2 rounded-lg">
                                                    <span className="font-bold text-sm text-slate-800">{child.name}</span>
                                                    <span className="text-xs text-slate-500">Matrícula: {child.registrationNumber || 'N/A'}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-slate-400 italic">Nenhum filho vinculado.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Address Info */}
                    {user.role === UserRole.ALUNO && user.address && (
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                                <MapPin size={14} /> Endereço
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Logradouro / Número</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        {user.address.street} {user.address.number ? `, ${user.address.number}` : ''} {user.address.complement && `- ${user.address.complement}`}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Bairro</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.address.neighborhood || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">CEP</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{user.address.zip || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Cidade / UF</label>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        {user.address.city && user.address.state ? `${user.address.city} / ${user.address.state}` : '-'}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition shadow-sm">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
