import React, { useState, useMemo } from 'react';
import { User, UserRole, School } from '../../../types';
import { UserFilters } from './UserFilters';
import { UserList } from './UserList';
import { UserFormModal } from './UserFormModal';
import { userService } from '../../../services/userService';
import { useSafeAppStore } from '../../../store/useAppStore';
import { Plus, Table } from 'lucide-react';
import { BatchImportModal } from './BatchImportModal';

interface UserManagementTabProps {
    currentUser: User;
    isTenantAdmin: boolean;
    schools: School[];
    forcedRole?: UserRole | 'ALL';
    canManageUsers: boolean;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
    currentUser,
    isTenantAdmin,
    schools,
    forcedRole = 'ALL',
    canManageUsers
}) => {
    const { users, classes } = useSafeAppStore();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>(forcedRole);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Filter Logic
    const filteredUsers = useMemo(() => {
        let result = users;

        // Permission Filter: If not Admin, only see users from same school OR users with no school (to fix orphans)
        if (!isTenantAdmin && currentUser.schoolId) {
            result = result.filter(u => u.schoolId === currentUser.schoolId || !u.schoolId);
        }

        // Text Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            );
        }

        // Role Filter
        if (roleFilter !== 'ALL') {
            result = result.filter(u => u.role === roleFilter);
        }

        return result;
    }, [users, searchTerm, roleFilter, isTenantAdmin, currentUser.schoolId]);

    // Handlers
    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: any) => {
        if (editingUser) {
            await userService.updateUser(editingUser.id, data);
        } else {
            // Inject Tenant ID
            await userService.createUser({
                ...data,
                tenantId: currentUser.tenantId,
                status: 'ACTIVE'
            });
        }
    };

    const handleDelete = async (user: User) => {
        if (confirm(`Deseja realmente excluir permanentemente o usuário ${user.name}?`)) {
            await userService.deleteUser(user.id);
        }
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        if (confirm(`Confirmar ação de ${newStatus === 'BLOCKED' ? 'BLOQUEIO' : 'DESBLOQUEIO'} para ${user.name}?`)) {
            await userService.updateUser(user.id, { status: newStatus });
        }
    };

    const handleResetPassword = async (email: string) => {
        if (confirm(`Enviar link de redefinição de senha para ${email}?`)) {
            await userService.resetPassword(email);
            alert('Link enviado com sucesso (Mock)');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-slate-800">
                    Gerenciamento de Usuários
                </h2>
                <div className="flex gap-2">
                    {canManageUsers && (
                        <>
                            <button
                                onClick={() => setIsBatchImportOpen(true)}
                                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-200 transition shadow-sm border border-slate-200"
                            >
                                <Table size={18} />
                                Importação em Lote
                            </button>
                            <button
                                onClick={handleAdd}
                                className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-secondary transition shadow-sm"
                            >
                                <Plus size={18} />
                                Adicionar Usuário
                            </button>
                        </>
                    )}
                </div>
            </div>

            {forcedRole === 'ALL' && (
                <UserFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                />
            )}

            {forcedRole !== 'ALL' && (
                <div className="flex bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                    <input
                        type="text"
                        placeholder="Buscar nesta lista..."
                        className="flex-1 bg-transparent outline-none text-sm px-2"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            <UserList
                users={filteredUsers}
                schools={schools}
                classes={classes}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
                canManageUsers={canManageUsers}
            />

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                editingUser={editingUser}
                availableSchools={schools}
                availableClasses={classes} // Passing classes to modal
                allStudents={users.filter(u => u.role === UserRole.ALUNO)}
                currentTenantId={currentUser?.tenantId || ''}
                isTenantAdmin={isTenantAdmin}
            />

            {isBatchImportOpen && (
                <BatchImportModal
                    onClose={() => setIsBatchImportOpen(false)}
                    onSuccess={() => {
                        // Remote data will reload via subscription or manual call if needed
                    }}
                />
            )}
        </div>
    );
};
