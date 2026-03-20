
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
    // Contador de fallback por sessão (Authority Pilot)
    private fallbackCount = 0;

    /**
     * Configuração do Authority Pilot (Fase 3)
     * Nome canônico único: authority_pilot_analytics_readonly
     */
     private authorityPilotConfig = {
        flagName: 'authority_pilot_analytics_readonly' as const,
        enabled: false,
        /**
         * Fase 5: Escrita Controlada (Step 1 - CREATE apenas)
         * Flag granular para evitar gatilho de escrita ampla indesejada.
         */
        authority_pilot_writes_controlled_create_enabled: false,
        /**
         * Fase 5: Escrita Controlada (Step 2 - UserPreferences)
         */
        authority_pilot_writes_user_prefs_controlled_enabled: false,
        user_prefs_whitelist: ['pilot_ui_hint_enabled'],
        /**
         * Fase 5: Escrita Funcional Controlada (Step 3 - Drafts funcionais)
         */
        authority_pilot_writes_functional_draft_enabled: false,
        // Sessão 1: Somente UNIT. NETWORK_ANALYTICS removido para conter blast radius.
        allowedResources: ['ANALYTICS', 'SCHOOL_AGGREGATE_DATA', 'INSTITUTIONAL_METADATA', 'PilotExecutionLog', 'UserPreferences', 'PilotTestSessionDraft'],
        allowedActions: ['VIEW', 'CREATE', 'UPSERT'],
        allowedScopes: ['UNIT', 'ORG'] as ScopeType[],
        allowedOrganizations: ['poa_organization', 'canoas_organization', 'alvorada_organization', 'viamao_organization', 'gravatai_organization'] as string[], // Baseline aprovada
        deniedResources: ['STUDENT_PEDAGOGICAL_DATA', 'USER_MANAGEMENT', 'EXAMEPAD_OPS', 'SAAS_PLATFORM', 'FINANCE', 'LOGISTICS', 'NETWORK_ANALYTICS'],
        maxFallbacksPerSession: 3,
        // Telemetria (Fase 4 Patch F4.1 + Fase 5 Step 1 & 2)
        untracked_delegation_count: 0, 
        readonly_block_count: 0,
        mutation_delegation_count: 0, // DELEGAÇÃO REAL (Não deve ocorrer em modo controlado)
        cross_tenant_mutation_block_count: 0, // Bloqueios Cross-tenant (Saneamento F5.1-Fix)
        legacy_allow_count_for_mutations: 0,
        pilot_controlled_create_success_count: 0,
        pilot_controlled_user_prefs_success_count: 0,
        pilot_controlled_functional_draft_success_count: 0,
    };

    /**
     * Motor de Autorização — Shadow Mode + Authority Pilot (Fase 3)
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

        // 3. Bloqueio de Mutação / Autoridade Positiva (Fase 5 Patch F5.2)
        const isMutation = ['CREATE', 'EDIT', 'DELETE', 'UPSERT'].includes(action);
        if (this.authorityPilotConfig.enabled && isMutation) {
             const isPilotContext = this.authorityPilotConfig.allowedOrganizations.includes(context.activeOrganizationId) && 
                                   this.authorityPilotConfig.allowedScopes.includes(context.activeScopeType);

             if (isPilotContext) {
                 // Bloqueio Cross-tenant em escrita (FAIL-CLOSED) - Saneamento de Semântica
                 const isLocalTenant = !context.targetOrganizationId || context.targetOrganizationId === context.activeOrganizationId;
                 if (!isLocalTenant) {
                     this.authorityPilotConfig.cross_tenant_mutation_block_count++;
                     console.error(`[AUTHORITY_PILOT][MUTATION_BLOCKED] Cross-tenant ${action} blocked for ${resource}. Reason: PILOT_CROSS_ORG_MUTATION_BLOCKED`);
                     return false;
                 }

                 // GATILHO DE ESCRITA CONTROLADA (Step 1: CREATE PilotExecutionLog)
                 const isControlledCreate = resource === 'PilotExecutionLog' && 
                                          action === 'CREATE' && 
                                          this.authorityPilotConfig.authority_pilot_writes_controlled_create_enabled;

                 if (isControlledCreate) {
                     this.authorityPilotConfig.pilot_controlled_create_success_count++;
                     console.log(`[AUTHORITY_PILOT][WRITE_ALLOWED] Controlled CREATE allowed for ${resource}. Reason: PILOT_CONTROLLED_CREATE_OK`);
                     return true;
                 }

                 // GATILHO DE ESCRITA CONTROLADA (Step 2: UPSERT UserPreferences - Whitelist)
                 const isUserPrefsControlled = resource === 'UserPreferences' && 
                                             (action === 'UPSERT' || action === 'CREATE') && 
                                             this.authorityPilotConfig.authority_pilot_writes_user_prefs_controlled_enabled;
                 
                 if (isUserPrefsControlled) {
                     // Nota: A validação da chave da whitelist ocorre na camada de serviço, 
                     // mas o Core concede autoridade se o contexto for local.
                     this.authorityPilotConfig.pilot_controlled_user_prefs_success_count++;
                     console.log(`[AUTHORITY_PILOT][WRITE_ALLOWED] Controlled ${action} allowed for ${resource}. Reason: PILOT_CONTROLLED_USERPREF_OK`);
                     return true;
                 }

                 // GATILHO DE ESCRITA CONTROLADA (Step 3: CREATE PilotTestSessionDraft)
                 const isFunctionalDraftControlled = resource === 'PilotTestSessionDraft' && 
                                                   action === 'CREATE' && 
                                                   this.authorityPilotConfig.authority_pilot_writes_functional_draft_enabled;
                 
                 if (isFunctionalDraftControlled) {
                     this.authorityPilotConfig.pilot_controlled_functional_draft_success_count++;
                     console.log(`[AUTHORITY_PILOT][WRITE_ALLOWED] Controlled CREATE allowed for ${resource}. Reason: PILOT_CONTROLLED_FUNCTIONAL_DRAFT_OK`);
                     return true;
                 }

                 // Bloqueio padrão para todas as outras mutações (Fail-Closed)
                 this.authorityPilotConfig.readonly_block_count++;
                 console.warn(`[AUTHORITY_PILOT][READONLY_BLOCK] Mutation blocked: ${resource}:${action}. Reason: PILOT_READONLY_MUTATION_BLOCKED`);
                 return false; 
             }
        }

        // 4. Authority Pilot: Core decide SE a flag estiver ativa e o recurso for whitelisted
        if (this.isAuthorityPilotActive(resource, action, context)) {
            try {
                console.log(`[AUTHORITY_PILOT] Core deciding: ${resource}:${action} => ${coreDecision}`);
                return coreDecision;
            } catch (error) {
                // Fallback imediato para legado na mesma requisição
                this.fallbackCount++;
                console.error(`[AUTHORITY_PILOT_FALLBACK] Core error, falling back to legacy. Count: ${this.fallbackCount}`, error);
                    
                if (this.fallbackCount >= this.authorityPilotConfig.maxFallbacksPerSession) {
                    this.authorityPilotConfig.enabled = false;
                    console.error(`[AUTHORITY_PILOT_AUTO_DISABLED] Fallback limit reached (${this.fallbackCount}). Flag disabled.`);
                }
                return legacyDecision;
            }
        }

        // 5. Untracked Delegation (Shadow Mode Legítimo): Legado continua decidindo
        if (this.authorityPilotConfig.enabled) {
            this.authorityPilotConfig.untracked_delegation_count++;
            if (isMutation) {
                this.authorityPilotConfig.mutation_delegation_count++;
                if (legacyDecision) this.authorityPilotConfig.legacy_allow_count_for_mutations++;
            }
        }
        return legacyDecision;
    }

    /**
     * Verifica se o Authority Pilot está ativo para este recurso/ação/escopo
     */
    private isAuthorityPilotActive(resource: string, action: string, context: GovernanceContext): boolean {
        const config = this.authorityPilotConfig;
        if (!config.enabled) return false;
        if (config.deniedResources.includes(resource)) return false;
        if (!config.allowedResources.includes(resource)) return false;
        
        // Na Fase 5, a ação CREATE é permitida se a flag de escrita estiver ativa
        const isActionAllowed = config.allowedActions.includes(action);
        if (!isActionAllowed) return false;

        if (!config.allowedScopes.includes(context.activeScopeType)) return false;
        // Validação Contextual (Fase 3B.1)
        if (!config.allowedOrganizations.includes(context.activeOrganizationId)) return false;
        return true;
    }

    /**
     * Ativa/desativa o Authority Pilot (Kill Switch)
     */
    setAuthorityPilot(enabled: boolean) {
        this.authorityPilotConfig.enabled = enabled;
        this.fallbackCount = 0;
        console.log(`[AUTHORITY_PILOT] Flag ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /** Retorna o estado atual do Authority Pilot */
    getAuthorityPilotStatus() {
        return {
            enabled: this.authorityPilotConfig.enabled,
            writes_enabled: this.authorityPilotConfig.authority_pilot_writes_controlled_create_enabled,
            functional_draft_enabled: this.authorityPilotConfig.authority_pilot_writes_functional_draft_enabled,
            allowedOrganizations: [...this.authorityPilotConfig.allowedOrganizations],
            fallbackCount: this.fallbackCount,
            flagName: this.authorityPilotConfig.flagName,
            telemetry: {
                untracked_delegation_count: this.authorityPilotConfig.untracked_delegation_count,
                readonly_block_count: this.authorityPilotConfig.readonly_block_count,
                mutation_delegation_count: this.authorityPilotConfig.mutation_delegation_count,
                cross_tenant_mutation_block_count: this.authorityPilotConfig.cross_tenant_mutation_block_count,
                legacy_allow_count_for_mutations: this.authorityPilotConfig.legacy_allow_count_for_mutations,
                pilot_controlled_create_success_count: this.authorityPilotConfig.pilot_controlled_create_success_count,
                pilot_controlled_user_prefs_success_count: this.authorityPilotConfig.pilot_controlled_user_prefs_success_count,
                pilot_controlled_functional_draft_success_count: this.authorityPilotConfig.pilot_controlled_functional_draft_success_count
            }
        };
    }

    /** Habilita piloto para uma organização específica */
    enablePilotForOrganization(orgId: string) {
        if (!this.authorityPilotConfig.allowedOrganizations.includes(orgId)) {
            this.authorityPilotConfig.allowedOrganizations.push(orgId);
            console.log(`[AUTHORITY_PILOT] Context ENABLED for: ${orgId}`);
        }
    }

    /** Desabilita piloto para uma organização específica */
    disablePilotForOrganization(orgId: string) {
        this.authorityPilotConfig.allowedOrganizations = 
            this.authorityPilotConfig.allowedOrganizations.filter(id => id !== orgId);
        console.log(`[AUTHORITY_PILOT] Context DISABLED for: ${orgId}`);
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

        // 3. Isolamento de Alvo Escolar (UNIT e ORG) - REQUISITO Sessão 3A Remediação
        // Se houver targetSchoolId, validamos o acesso baseado no escopo ativo.
        if (context.targetSchoolId && context.roleId !== 'mec_superadmin') {
            // Se for UNIT, só pode ver a própria escola
            if (context.activeScopeType === 'UNIT') {
                if (context.targetSchoolId !== context.activeSchoolId) return false;
            } 
            // Se for ORG, a escola deve ser subordinada à organização ativa
            else if (context.activeScopeType === 'ORG') {
                const isSubordinate = this.checkSubordinationMock(context.activeOrganizationId, context.targetSchoolId);
                if (!isSubordinate) return false;
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
            'state_rs_org': [
                'poa_organization', 'canoas_organization', 'alvorada_organization', 
                'viamao_organization', 'gravatai_organization',
                'school_poa_1', 'school_canoas_99', 'school_alvorada_1', 
                'school_viamao_2', 'school_gravatai_3'
            ],
            'poa_organization': ['school_poa_1'],
            'canoas_organization': ['school_canoas_99'],
            'alvorada_organization': ['school_alvorada_1'],
            'viamao_organization': ['school_viamao_2'],
            'gravatai_organization': ['school_gravatai_3']
        };

        return hierarchy[activeOrgId]?.includes(targetOrgId) || false;
    }

    private getCoreReason(resource: string, action: string, context: GovernanceContext, decision: boolean): string {
        if (resource === 'PilotExecutionLog' && action === 'CREATE' && decision) {
            return 'PILOT_CONTROLLED_CREATE_OK';
        }
        if (resource === 'PilotTestSessionDraft' && action === 'CREATE' && decision) {
            return 'PILOT_CONTROLLED_FUNCTIONAL_DRAFT_OK';
        }
        if (resource === 'UserPreferences' && (action === 'CREATE' || action === 'UPSERT') && decision) {
            return 'PILOT_CONTROLLED_USERPREF_OK';
        }
        if (['CREATE', 'EDIT', 'DELETE'].includes(action) && !decision) {
            // Se for PilotContext mas não for o caso de escrita autorizada
            const isPilotOrg = this.authorityPilotConfig.allowedOrganizations.includes(context.activeOrganizationId);
            if (isPilotOrg) {
                 const isMutationOutScope = !['CREATE'].includes(action) || resource !== 'PilotExecutionLog';
                 if (isMutationOutScope) return 'PILOT_MUTATION_OUT_OF_SCOPE';
                 
                 const isWriteDisabled = !this.authorityPilotConfig.authority_pilot_writes_controlled_create_enabled;
                 if (isWriteDisabled) return 'PILOT_WRITES_DISABLED_FOR_RESOURCE';

                 const isCrossOrg = context.targetOrganizationId && context.targetOrganizationId !== context.activeOrganizationId;
                 if (isCrossOrg) return 'PILOT_CROSS_ORG_MUTATION_BLOCKED';
            }
            return 'PILOT_READONLY_MUTATION_BLOCKED';
        }
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
