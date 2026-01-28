import React from 'react';
import { User, UserRole } from '../../../types';
import { Settings, ShieldCheck, Users, X, Lock, Unlock } from 'lucide-react';
import { translateUserRole } from '../../../utils/translations';

interface UserListProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onResetPassword: (email: string) => void;
    onToggleStatus: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
    users,
    onEdit,
    onDelete,
    onResetPassword,
    onToggleStatus
}) => {
    if (users.length === 0) {
        return (
            <div className="p-12 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Nenhum usuário encontrado com os filtros atuais.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <th className="p-4 font-bold">Usuário</th>
                            <th className="p-4 font-bold">Função</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className={`hover:bg-slate-50 transition ${user.status === 'BLOCKED' ? 'bg-slate-50/50' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${user.status === 'BLOCKED' ? 'bg-red-100 text-red-500' : 'bg-brand-light text-brand-primary'
                                            }`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                {user.name}
                                                {user.status === 'BLOCKED' && <Lock size={12} className="text-red-500" />}
                                            </div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border uppercase ${user.role === UserRole.ALUNO ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            user.role === UserRole.PROFESSOR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-purple-50 text-purple-600 border-purple-100'
                                        }`}>
                                        {translateUserRole(user.role)}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'BLOCKED' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {user.status === 'BLOCKED' ? 'Bloqueado' : 'Ativo'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 rounded text-slate-400 hover:text-brand-primary hover:bg-brand-light transition"
                                            title="Editar"
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button
                                            onClick={() => onResetPassword(user.email)}
                                            className="p-2 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition"
                                            title="Resetar Senha"
                                        >
                                            <ShieldCheck size={16} />
                                        </button>
                                        <button
                                            onClick={() => onToggleStatus(user)}
                                            className={`p-2 rounded transition ${user.status === 'BLOCKED'
                                                    ? 'text-red-500 hover:bg-red-100'
                                                    : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                                }`}
                                            title={user.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
                                        >
                                            {user.status === 'BLOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>
                                        <button
                                            onClick={() => onDelete(user)}
                                            className="p-2 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                            title="Excluir"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                Mostrando {users.length} usuários
            </div>
        </div>
    );
};
