import React, { useState, useMemo } from 'react';
import { User, UserRole, School } from '../../../types';
import { UserFilters } from './UserFilters';
import { UserList } from './UserList';
import { UserFormModal } from './UserFormModal';
import { UserViewModal } from './UserViewModal';
import { userService } from '../../../services/userService';
import { useSafeAppStore } from '../../../store/useAppStore';
import { Plus, Table, X, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { BatchImportModal } from './BatchImportModal';
import { useToast } from '../../../components/ui/Toast';

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
    const {
        users,
        classes,
        selectedUserIds,
        toggleUserSelection,
        clearUserSelection,
        selectAllVisibleUsers,
        bulkDeleteUsers,
        bulkUpdateUserStatus
    } = useSafeAppStore();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>(forcedRole);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

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
                (u.name?.toLowerCase().includes(lower) || false) ||
                (u.email?.toLowerCase().includes(lower) || false)
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

    const handleView = (user: User) => {
        setViewingUser(user);
        setIsViewModalOpen(true);
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
            toast.success('Link enviado com sucesso (Mock)');
        }
    };

    const handleBulkDelete = async () => {
        if (confirm(`Deseja realmente excluir permanentemente os ${selectedUserIds.length} usuários selecionados?`)) {
            await bulkDeleteUsers(selectedUserIds);
        }
    };

    const handleBulkStatus = async (status: 'ACTIVE' | 'BLOCKED') => {
        const action = status === 'ACTIVE' ? 'DESBLOQUEAR' : 'BLOQUEAR';
        if (confirm(`Confirmar ${action} para os ${selectedUserIds.length} usuários selecionados?`)) {
            await bulkUpdateUserStatus(selectedUserIds, status);
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
                selectedUserIds={selectedUserIds}
                onToggleSelection={toggleUserSelection}
                onSelectAll={selectAllVisibleUsers}
                onView={handleView}
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
                availableClasses={classes}
                allUsers={users}
                currentTenantId={currentUser?.tenantId || ''}
                isTenantAdmin={isTenantAdmin}
            />

            <UserViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                user={viewingUser}
                schools={schools}
                classes={classes}
                allUsers={users}
            />

            {isBatchImportOpen && (
                <BatchImportModal
                    onClose={() => setIsBatchImportOpen(false)}
                    onSuccess={() => {
                        // Remote data will reload via subscription or manual call if needed
                    }}
                />
            )}

            {/* FLOATING BULK ACTIONS BAR */}
            {selectedUserIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 ring-1 ring-slate-700">
                    <div className="flex items-center gap-2 border-r border-slate-700 pr-4 mr-2">
                        <span className="bg-brand-primary h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {selectedUserIds.length}
                        </span>
                        <span className="text-sm font-medium">Selecionados</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkStatus('ACTIVE')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-bold transition whitespace-nowrap"
                        >
                            <Unlock size={14} className="text-emerald-400" /> Ativar
                        </button>
                        <button
                            onClick={() => handleBulkStatus('BLOCKED')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-bold transition whitespace-nowrap"
                        >
                            <Lock size={14} className="text-amber-400" /> Bloquear
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-900/40 text-red-400 text-xs font-bold transition whitespace-nowrap"
                        >
                            <X size={14} /> Excluir
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-700 mx-2" />

                    <button
                        onClick={() => clearUserSelection()}
                        className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Limpar seleção"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};
