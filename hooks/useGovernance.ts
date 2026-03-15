
import { useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { governanceService, GovernanceContext } from '../services/governanceService';
import { Action, Resource, UserRole } from '../types';

/**
 * Hook de Governança (Fase A - Shadow Mode Progressivo)
 */
export const useGovernance = (surface: string = 'GENERIC') => {
    const { currentUser, globalPermissions, tenants } = useAppStore();

    // Contexto Canônico Memoizado
    const context = useMemo(() => {
        if (!currentUser) return null;
        return governanceService.resolveLegacyContext(currentUser);
    }, [currentUser]);

    /**
     * Motor de Autorização Intercalado (Shadow Mode)
     */
    const can = useCallback((resource: Resource, action: Action, customContext?: Partial<GovernanceContext>): boolean => {
        if (!currentUser || !context) return false;

        // --- LÓGICA LEGADA (Replicando usePermissions) ---
        let legacyDecision = false;
        
        // 1. Super Admin Overrides
        if (currentUser.role === UserRole.SYSTEM_ADMIN || currentUser.role === UserRole.MASTER_SAAS) {
            legacyDecision = true;
        } else {
            // 2. Tenant Restrictions
            const tenant = tenants.find(t => t.id === currentUser.tenantId);
            const isRestricted = tenant?.disabledResources?.includes(resource);

            if (!isRestricted) {
                // 3. Role Matrix
                const rolePerms = globalPermissions[currentUser.role];
                if (rolePerms) {
                    const allowedActions = rolePerms[resource];
                    legacyDecision = allowedActions?.includes(action) || false;
                }
            }
        }

        // --- LÓGICA CORE (Shadow Audit) ---
        const mergedContext = { ...context, ...customContext };
        // Mapeamos Resource/Action string para o service
        governanceService.can(resource, action, mergedContext, legacyDecision, surface);

        return legacyDecision; 
    }, [currentUser, context, globalPermissions, tenants, surface]);

    return {
        context,
        can,
        isShadowMode: true
    };
};
