
import { useAppStore } from '../store/useAppStore';
import { Action, Resource, UserRole } from '../types';

export const usePermissions = () => {
    const { currentUser, globalPermissions } = useAppStore();

    const can = (action: Action, resource: Resource): boolean => {
        if (!currentUser) return false;

        // 1. Super Admin tem bypass total (segurança de infraestrutura)
        if (currentUser.role === UserRole.SUPER_ADMIN) return true;

        // 2. Verificar na Matriz de Permissões configurada pelos gestores
        const rolePerms = globalPermissions[currentUser.role];
        if (!rolePerms) return false;

        const allowedActions = rolePerms[resource];
        if (!allowedActions) return false;

        return allowedActions.includes(action);
    };

    // Helpers utilitários de alta legibilidade
    return {
        can,
        canView: (res: Resource) => can('VIEW', res),
        canCreate: (res: Resource) => can('CREATE', res),
        canEdit: (res: Resource) => can('EDIT', res),
        canDelete: (res: Resource) => can('DELETE', res),
    };
};
