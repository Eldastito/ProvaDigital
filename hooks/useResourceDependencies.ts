
import { useAppStore } from '../store/useAppStore';
import { Resource, RESOURCE_DEPENDENCIES } from '../types';

/**
 * Hook para gerenciar dependências entre recursos/funcionalidades
 * Garante que ao desabilitar um recurso, dependências sejam respeitadas
 */
export const useResourceDependencies = () => {
    const { tenants, currentUser } = useAppStore();

    /**
     * Retorna lista de recursos desabilitados para um tenant
     */
    const getDisabledResources = (tenantId: string): Resource[] => {
        const tenant = tenants.find(t => t.id === tenantId);
        return tenant?.disabledResources || [];
    };

    /**
     * Retorna recursos que DEPENDEM do recurso fornecido
     * Ex: getDependents('COMMUNICATION') => ['GAMIFIED_EVENTS']
     */
    const getDependents = (resource: Resource): Resource[] => {
        return RESOURCE_DEPENDENCIES
            .filter(dep => dep.dependsOn.includes(resource))
            .map(dep => dep.resource);
    };

    /**
     * Retorna dependências FALTANTES (desabilitadas) para um recurso
     * Ex: Se ANALYTICS está desabilitado, getMissingDependencies('GAMIFIED_EVENTS') => ['ANALYTICS']
     */
    const getMissingDependencies = (resource: Resource, tenantId: string): Resource[] => {
        const dep = RESOURCE_DEPENDENCIES.find(d => d.resource === resource);
        if (!dep) return [];

        const disabled = getDisabledResources(tenantId);
        return dep.dependsOn.filter(r => disabled.includes(r));
    };

    /**
     * Verifica se um recurso PODE ser habilitado (todas dependências ativas)
     */
    const canEnableResource = (resource: Resource, tenantId: string): boolean => {
        return getMissingDependencies(resource, tenantId).length === 0;
    };

    /**
     * Retorna todos os recursos que serão afetados ao desabilitar um recurso
     * Inclui o próprio recurso + todos os dependentes ativos
     */
    const getDisableCascade = (resource: Resource, tenantId: string): Resource[] => {
        const disabled = getDisabledResources(tenantId);
        const dependents = getDependents(resource);
        const activeDependents = dependents.filter(d => !disabled.includes(d));

        return [resource, ...activeDependents];
    };

    /**
     * Retorna informações de dependência para um recurso
     */
    const getDependencyInfo = (resource: Resource) => {
        return RESOURCE_DEPENDENCIES.find(d => d.resource === resource);
    };

    /**
     * Verifica se um recurso está funcional (habilitado + dependências ativas)
     */
    const isResourceFunctional = (resource: Resource, tenantId: string): boolean => {
        const disabled = getDisabledResources(tenantId);

        // Se o próprio recurso está desabilitado
        if (disabled.includes(resource)) return false;

        // Se alguma dependência está desabilitada
        const missing = getMissingDependencies(resource, tenantId);
        return missing.length === 0;
    };

    return {
        getDependents,
        getMissingDependencies,
        canEnableResource,
        getDisabledResources,
        getDisableCascade,
        getDependencyInfo,
        isResourceFunctional
    };
};
