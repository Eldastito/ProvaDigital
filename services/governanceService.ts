
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

export type ScopeType = 'GLOBAL' | 'ORG' | 'UNIT';

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

export type DivergenceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface DivergenceLog {
    resource: string;
    action: string;
    surface: string;
    context: GovernanceContext;
    legacyDecision: boolean;
    coreDecision: boolean;
    legacyReason: string;
    coreReason: string;
    severity: DivergenceSeverity;
}

class GovernanceService {
    // Cache de auditoria para evitar explosão de logs (Deduplicação)
    private auditCache = new Set<string>();
    // Cache de decisão para performance (Memoização)
    private decisionCache = new Map<string, boolean>();

    /**
     * Motor de Autorização em Shadow Mode (Fase A/B)
     * Memoizado para performance em "hot paths" (Sidebar/ProtectedRoute)
     */
    can(resource: string, action: string, context: GovernanceContext, legacyDecision: boolean, surface: string = 'GENERIC'): boolean {
        const cacheKey = `${context.activeMembershipId}:${resource}:${action}:${context.targetSchoolId || ''}:${context.targetOrganizationId || ''}`;
        
        // 1. Recuperar decisão memoizada se disponível
        let coreDecision = this.decisionCache.get(cacheKey);
        if (coreDecision === undefined) {
            coreDecision = this.evaluateCoreDecision(resource, action, context);
            this.decisionCache.set(cacheKey, coreDecision);
        }
        
        // 2. Auditoria com Deduplicação e Severidade (Gate 1 & 4)
        const severity = this.calculateSeverity(resource, action, context, legacyDecision, coreDecision);

        this.auditShadowDecision({
            resource,
            action,
            surface,
            context,
            legacyDecision,
            coreDecision,
            legacyReason: 'UserRole Legacy Mapping',
            coreReason: this.getCoreReason(resource, action, context, coreDecision),
            severity
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
            [UserRole.STATE_ADMIN]: { roleId: 'state_secretariat_admin', orgType: 'state_secretariat', scope: 'ORG' },
            [UserRole.TENANT_ADMIN]: { roleId: 'municipal_secretariat_admin', orgType: 'municipal_secretariat', scope: 'ORG' },
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
            activeMembershipId: `legacy_membership_${user.id}${user.schoolId ? `_${user.schoolId}` : ''}`,
            activeScopeType: mapping.scope,
            scopeRefId: mapping.scope === 'UNIT' ? user.schoolId : user.tenantId,
            roleId: mapping.roleId,
            organizationType: mapping.orgType,
            availableMembershipIds: [`legacy_membership_${user.id}`]
        };
    }

    private evaluateCoreDecision(resource: string, action: string, context: GovernanceContext): boolean {
        if (context.roleId === 'platform_owner') return true;

        // 1. Bloqueio de Recursos Críticos de Operação/SaaS para MEC (GLOBAL)
        const restrictedResources = ['EXAMEPAD_OPS', 'SAAS_PLATFORM', 'FINANCE', 'LOGISTICS'];
        if (context.roleId === 'mec_superadmin' && restrictedResources.includes(resource)) {
            return false;
        }

        // 2. Restrição Pedagógica GLOBAL (MEC)
        // MEC pode ver agregados, mas nunca dados pedagógicos individuais/sensíveis
        if (context.activeScopeType === 'GLOBAL' && resource === 'STUDENT_PEDAGOGICAL_DATA') {
            return false;
        }

        // 3. Isolamento de Unidade (UNIT) - REFINADO
        // Atores UNIT (Professor/Diretor) só enxergam sua escola.
        // Atores GLOBAL ignoram esta trava para permitir drill-down.
        if (context.activeScopeType === 'UNIT' && context.roleId !== 'mec_superadmin') {
            if (context.targetSchoolId && context.targetSchoolId !== context.activeSchoolId) {
                return false;
            }
        }

        // 4. Lógica GLOBAL (MEC) - REQUISITO Sessão 22
        if (context.activeScopeType === 'GLOBAL' && context.roleId === 'mec_superadmin') {
            // Se o alvo for uma organização, verificamos se é privada e se tem Grant
            if (context.targetOrganizationId) {
                const isPrivate = this.isPrivateOrganizationMock(context.targetOrganizationId);
                if (isPrivate) {
                    const hasSharedVisibility = this.checkPrivateGrantMock(context.targetOrganizationId);
                    if (!hasSharedVisibility) return false;
                }
            }
            return true; // Acesso onisciente à rede pública por padrão
        }

        // 4. Isolamento Organizacional (ORG) - REFINADO p/ Sessão 21
        // Se houver targetOrganizationId diferente da ativa, verificamos subordinação
        if (context.activeScopeType === 'ORG' && context.targetOrganizationId && context.targetOrganizationId !== context.activeOrganizationId) {
            const isSubordinate = this.checkSubordinationMock(context.activeOrganizationId, context.targetOrganizationId);
            if (!isSubordinate) return false;
        }

        return true; 
    }

    /**
     * Helper temporário para identificar organizações privadas no simulador
     */
    private isPrivateOrganizationMock(orgId: string): boolean {
        // No simulador, qualquer org com prefixo 'private_' ou contida na lista é privada
        const privateOrgs = ['private_school_A', 'private_school_B', 'private_group_X'];
        return orgId.startsWith('private_') || privateOrgs.includes(orgId);
    }

    /**
     * Helper temporário para Grant Explícito na Rede Privada (Sessão 22)
     */
    private checkPrivateGrantMock(orgId: string): boolean {
        // Apenas a Escola A liberou visibilidade federal (Grant Ativo)
        const grantedOrgs = ['private_school_A'];
        return grantedOrgs.includes(orgId);
    }

    /**
     * Helper temporário para o simulador de Staging (Hierarchy Mock)
     * Implementa a lógica de "Quem pode ver quem" na árvore pública
     */
    private checkSubordinationMock(activeOrgId: string, targetOrgId: string): boolean {
        // Regras de Hierarquia RS (Exemplo para Sessão 21)
        const hierarchy: Record<string, string[]> = {
            'state_rs_org': ['poa_organization', 'canoas_organization', 'school_poa_1', 'school_canoas_99'],
            'poa_organization': ['school_poa_1'],
            'canoas_organization': ['school_canoas_99']
        };

        return hierarchy[activeOrgId]?.includes(targetOrgId) || false;
    }

    private getCoreReason(resource: string, action: string, context: GovernanceContext, decision: boolean): string {
        if (!decision) return `Scope mismatch: target ${context.targetSchoolId} vs active ${context.activeSchoolId}`;
        return `Role template: ${context.roleId}`;
    }

    private calculateSeverity(
        resource: string, 
        action: string, 
        context: GovernanceContext, 
        legacy: boolean, 
        core: boolean
    ): DivergenceSeverity {
        if (legacy === core) return 'LOW';

        // 1. CRITICAL: Vazamento Cross-tenant ou Cross-school (Core bloqueia, Legado permite)
        const isCrossBoundaryPermitted = legacy && !core && (
            (context.targetOrganizationId && context.targetOrganizationId !== context.activeOrganizationId) ||
            (context.targetSchoolId && context.targetSchoolId !== context.activeSchoolId)
        );
        if (isCrossBoundaryPermitted) return 'CRITICAL';

        // 2. HIGH: Bloqueio de Fluxo Essencial (Core bloqueia indevidamente o que o legado permite)
        const essentialResources = ['EXAM_MGMT', 'USER_DATA', 'SCHOOL_DATA'];
        if (!core && legacy && essentialResources.includes(resource)) return 'HIGH';

        // 3. MEDIUM: Diferença em Analytics ou visualização secundária
        if (resource === 'ANALYTICS') return 'MEDIUM';

        return 'LOW';
    }

    /**
     * Auditoria com Deduplicação e Severidade (Gate 1 & 4)
     */
    private auditShadowDecision(data: DivergenceLog) {
        if (data.legacyDecision === data.coreDecision) return;

        const auditKey = `${data.resource}:${data.action}:${data.legacyDecision}:${data.coreDecision}:${data.surface}`;
        if (this.auditCache.has(auditKey)) return;

        const logType = data.severity === 'CRITICAL' ? 'error' : (data.severity === 'HIGH' ? 'warn' : 'log');
        
        console[logType](`[GOVERNANCE AUDIT][${data.severity}] Divergence in ${data.surface}`, {
            resource: data.resource,
            action: data.action,
            legacy: data.legacyDecision,
            core: data.coreDecision,
            severity: data.severity,
            reason: data.coreReason,
            context: {
                role: data.context.roleId,
                org: data.context.activeOrganizationId,
                targetOrg: data.context.targetOrganizationId,
                targetSchool: data.context.targetSchoolId
            }
        });

        this.auditCache.add(auditKey);
        // Limite de cache para evitar vazamento de memória
        if (this.auditCache.size > 1000) this.auditCache.clear();
    }
}

export const governanceService = new GovernanceService();
