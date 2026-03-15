
import { User, UserRole } from '../types';

export type OrganizationType = 
    | 'saas_platform' 
    | 'exam_pad_operations' 
    | 'mec' 
    | 'federal_secretariat' 
    | 'state_secretariat' 
    | 'municipal_secretariat' 
    | 'private_group' 
    | 'school';

export type ScopeType = 'GLOBAL' | 'REGIONAL' | 'UNIT';

export interface GovernanceContext {
    activeOrganizationId: string;
    activeSchoolId?: string;
    activeMembershipId: string;
    activeScopeType: ScopeType;
    scopeRefId?: string;
    targetOrganizationId?: string;
    targetSchoolId?: string;
    availableMembershipIds?: string[];
    roleId: string;
    organizationType: OrganizationType;
}

interface DivergenceLog {
    resource: string;
    action: string;
    surface: string;
    context: GovernanceContext;
    legacyDecision: boolean;
    coreDecision: boolean;
    legacyReason: string;
    coreReason: string;
}

class GovernanceService {
    // Cache de auditoria para evitar explosão de logs (Deduplicação)
    private auditCache = new Set<string>();
    // Cache de decisão para performance (Memoização)
    private decisionCache = new Map<string, boolean>();

    /**
     * Motor de Autorização em Shadow Mode (Fase A)
     * Memoizado para performance em "hot paths" (Sidebar/ProtectedRoute)
     */
    can(resource: string, action: string, context: GovernanceContext, legacyDecision: boolean, surface: string = 'GENERIC'): boolean {
        const cacheKey = `${context.activeMembershipId}:${resource}:${action}:${context.targetSchoolId || ''}`;
        
        // 1. Recuperar decisão memoizada se disponível
        let coreDecision = this.decisionCache.get(cacheKey);
        if (coreDecision === undefined) {
            coreDecision = this.evaluateCoreDecision(resource, action, context);
            this.decisionCache.set(cacheKey, coreDecision);
        }
        
        // 2. Auditoria com Deduplicação (Gate 2)
        this.auditShadowDecision({
            resource,
            action,
            surface,
            context,
            legacyDecision,
            coreDecision,
            legacyReason: 'UserRole Legacy Mapping',
            coreReason: this.getCoreReason(resource, action, context, coreDecision)
        });

        return legacyDecision;
    }

    /**
     * Limpa o cache de decisões (útil em troca de contexto/logout)
     */
    clearCache() {
        this.decisionCache.clear();
        this.auditCache.clear();
    }

    resolveLegacyContext(user: User): GovernanceContext {
        const roleMapping: Record<UserRole, { roleId: string; orgType: OrganizationType; scope: ScopeType }> = {
            [UserRole.MASTER_SAAS]: { roleId: 'platform_owner', orgType: 'saas_platform', scope: 'GLOBAL' },
            [UserRole.SYSTEM_ADMIN]: { roleId: 'platform_admin', orgType: 'saas_platform', scope: 'GLOBAL' },
            [UserRole.SUPER_ADMIN]: { roleId: 'mec_superadmin', orgType: 'mec', scope: 'GLOBAL' },
            [UserRole.STATE_ADMIN]: { roleId: 'state_secretariat_admin', orgType: 'state_secretariat', scope: 'REGIONAL' },
            [UserRole.TENANT_ADMIN]: { roleId: 'municipal_secretariat_admin', orgType: 'municipal_secretariat', scope: 'REGIONAL' },
            [UserRole.DIRETOR]: { roleId: 'school_manager', orgType: 'school', scope: 'UNIT' },
            [UserRole.SUPERVISOR]: { roleId: 'school_supervisor', orgType: 'school', scope: 'UNIT' },
            [UserRole.PROFESSOR]: { roleId: 'teacher', orgType: 'school', scope: 'UNIT' },
            [UserRole.ALUNO]: { roleId: 'student', orgType: 'school', scope: 'UNIT' },
            [UserRole.PAIS]: { roleId: 'guardian', orgType: 'school', scope: 'UNIT' },
        };

        const mapping = roleMapping[user.role] || roleMapping[UserRole.ALUNO];

        return {
            activeOrganizationId: user.tenantId || 'legacy_default',
            activeSchoolId: user.schoolId || undefined,
            activeMembershipId: `legacy_membership_${user.id}`,
            activeScopeType: mapping.scope,
            scopeRefId: mapping.scope === 'UNIT' ? user.schoolId : user.tenantId,
            roleId: mapping.roleId,
            organizationType: mapping.orgType,
            availableMembershipIds: [`legacy_membership_${user.id}`]
        };
    }

    private evaluateCoreDecision(resource: string, action: string, context: GovernanceContext): boolean {
        if (context.roleId === 'platform_owner') return true;
        if (context.activeScopeType === 'UNIT' && context.targetSchoolId && context.targetSchoolId !== context.activeSchoolId) {
            return false;
        }
        return true; 
    }

    private getCoreReason(resource: string, action: string, context: GovernanceContext, decision: boolean): string {
        if (!decision) return `Scope mismatch: target ${context.targetSchoolId} vs active ${context.activeSchoolId}`;
        return `Role template: ${context.roleId}`;
    }

    /**
     * Auditoria com Deduplicação para evitar avalanche de logs (Gate 2)
     */
    private auditShadowDecision(data: DivergenceLog) {
        if (data.legacyDecision === data.coreDecision) return;

        const auditKey = `${data.resource}:${data.action}:${data.legacyDecision}:${data.coreDecision}:${data.surface}`;
        if (this.auditCache.has(auditKey)) return;

        console.warn(`[GOVERNANCE AUDIT] Divergence in ${data.surface}`, {
            resource: data.resource,
            action: data.action,
            legacy: data.legacyDecision,
            core: data.coreDecision,
            reason: data.coreReason,
            context: {
                role: data.context.roleId,
                org: data.context.activeOrganizationId
            }
        });

        this.auditCache.add(auditKey);
        // Limite de cache para evitar vazamento de memória
        if (this.auditCache.size > 1000) this.auditCache.clear();
    }
}

export const governanceService = new GovernanceService();
