
import { useAppStore } from '../store/useAppStore';
import { Action, Resource, UserRole, RESOURCE_DEPENDENCIES } from '../types';

export const usePermissions = () => {
    const { currentUser, globalPermissions, tenants } = useAppStore();

    const can = (action: Action, resource: Resource, contextId?: string): boolean => {
        if (!currentUser) return false;

        // 1. Check SYSTEM_ADMIN & MASTER_SAAS override (Absolute Global Management)
        if (currentUser.role === UserRole.SYSTEM_ADMIN || currentUser.role === UserRole.MASTER_SAAS) return true;

        // 2. Check Tenant Level Restrictions (Feature Flags)
        const tenant = tenants.find(t => t.id === currentUser.tenantId);
        if (tenant?.disabledResources?.includes(resource)) {
            return false;
        }

        // 3. Hotfix Legado: Validação de Vínculo de Aluno p/ Pais
        if (currentUser.role === UserRole.PAIS && resource === 'STUDENT_DATA') {
            if (!contextId) return false; // Bloqueio preventivo se não houver contexto
            const hasLink = currentUser.childrenIds?.includes(contextId);
            if (!hasLink) {
                console.error(`🚨 Acesso negado: Responsável ${currentUser.id} tentou acessar aluno ${contextId} sem vínculo.`);
                return false;
            }
        }

        // 4. Check Role Matrix
        const rolePerms = globalPermissions[currentUser.role];
        if (!rolePerms) return false;

        const allowedActions = rolePerms[resource];
        return allowedActions?.includes(action) || false;
    };

    // Helper simples para verificar apenas visualização
    const canView = (resource: Resource) => {
        if (!can('VIEW', resource)) return false;

        // PROTEÇÃO: Verificar se dependências estão ativas
        if (!currentUser) return false;

        const tenant = tenants.find(t => t.id === currentUser.tenantId);
        const disabledResources = tenant?.disabledResources || [];

        // Encontrar dependências do recurso
        const dependency = RESOURCE_DEPENDENCIES.find(d => d.resource === resource);
        if (dependency) {
            // Verificar se alguma dependência está desabilitada
            const missingDeps = dependency.dependsOn.filter(dep => disabledResources.includes(dep));
            if (missingDeps.length > 0) {
                console.warn(`Resource ${resource} has missing dependencies:`, missingDeps);
                return false; // Ocultar recurso se dependências estão desabilitadas
            }
        }

        return true;
    };

    const canEdit = (resource: Resource) => can('EDIT', resource);
    const canCreate = (resource: Resource) => can('CREATE', resource);
    const canDelete = (resource: Resource) => can('DELETE', resource);

    return { can, canView, canEdit, canCreate, canDelete };
};

