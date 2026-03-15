# FASE 1: Contrato Canônico - Governance & Access Core (REVISÃO FINAL)

Este documento estabelece o contrato técnico definitivo da Fase 1, corrigindo os 4 bloqueios estruturais identificados na revisão anterior.

## 1. Fonte Única da Verdade para Hierarquia (SSOT)

Para evitar inconsistências, a regra de hierarquia é estrita:
- **`organizations.parent_id`**: É a UNICA fonte de verdade para a hierarquia oficial principal.
- **`organization_relations`**: Destina-se EXCLUSIVAMENTE a relações secundárias/laterais (Parcerias, Vendors, Auditoria Externa). Nunca deve ser usada para definir a linha de subordinação direta.

---

## 2. Semântica e Precedência de Autorização

A decisão final (`can`) segue o motor de precedência:
1. **Deny Explícito**: Políticas de bloqueio em qualquer nível vencem tudo.
2. **Membership**: Regra vinculada a um vínculo específico (`membership_id`) vence o papel genérico.
3. **Escopo Mais Específico**: Regras de `UNIT` > `REGIONAL` > `GLOBAL`.
4. **Role (Papel)**: Capacidades herdadas do template do papel.

---

## 3. Contrato Formal de Contexto

```typescript
type ScopeType = 'GLOBAL' | 'REGIONAL' | 'UNIT';

interface GovernanceContext {
    activeOrganizationId: string;    // SSOT da Org
    activeSchoolId?: string;         // SSOT da Unidade (se houver)
    activeMembershipId: string;      // ID do vínculo atual (usado para policies específicas)
    activeScopeType: ScopeType;
    targetOrganizationId?: string;   // Ref para Cross-tenant check
    targetSchoolId?: string;         // Ref para Cross-school check
    availableMembershipIds?: string[]; // Opcional (para troca de contexto)
}
```

---

## 4. Schema Draft Central (Refinado)

```sql
-- 1. Organizations
CREATE TABLE public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES public.organizations(id), -- SSOT da Hierarquia
    name text NOT NULL,
    type organization_type NOT NULL,
    classification text, -- 'PUBLIC', 'PRIVATE', 'NPO'
    external_id text, -- Mapeamento legado (tenant_id)
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED'))
);

-- 2. User Memberships
CREATE TABLE public.user_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    organization_id uuid REFERENCES public.organizations(id),
    role_id text NOT NULL,
    scope_type scope_type NOT NULL,
    scope_ref_id uuid, -- ID da entidade de escopo (Org ou Escola)
    is_active boolean DEFAULT true,
    UNIQUE(user_id, organization_id, role_id, scope_ref_id)
);

-- 3. Permission Policies (Remodelada para Precedência)
CREATE TABLE public.permission_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type text NOT NULL CHECK (subject_type IN ('ROLE', 'MEMBERSHIP', 'ORGANIZATION')),
    subject_id text NOT NULL, -- role_id, membership_id ou organization_id
    resource text NOT NULL,
    action text NOT NULL,
    effect text DEFAULT 'ALLOW' CHECK (effect IN ('ALLOW', 'DENY')),
    priority integer DEFAULT 0,
    conditions jsonb DEFAULT '{}',
    is_active boolean DEFAULT true
);

-- 4. Governance Audit (Shadow Mode Refinado)
CREATE TABLE public.governance_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    membership_id uuid,
    organization_id uuid,
    resource text,
    action text,
    surface text, -- 'API', 'UI', 'HOOK'
    legacy_decision boolean,
    core_decision boolean,
    decision_source text, -- 'ROLE_POLICY', 'MEMBERSHIP_OVERRIDE', etc.
    legacy_reason text,
    core_reason text,
    context jsonb,
    is_divergent boolean GENERATED ALWAYS AS (legacy_decision <> core_decision) STORED,
    created_at timestamp with time zone DEFAULT now()
);

-- Indices essenciais
CREATE INDEX idx_policies_subject ON public.permission_policies(subject_type, subject_id);
CREATE INDEX idx_audit_divergence ON public.governance_audit(is_divergent) WHERE is_divergent = true;
```

---

## 5. Estratégia de Rollout Fazeada

Para mitigar riscos, o rollout é dividido em estágios herméticos:

### Fase A: Shadow Mode Puro (Observação)
- **Autoridade Final**: Legado (`UserRole`, `tenant_id`).
- **Comportamento**: `GovernanceService` é invocado silenciosamente, compara as decisões e grava na `governance_audit`.
- **Duração**: Até que a taxa de divergência não planejada seja < 0.1%.

### Fase B: Pilot Authority (Módulo Controlado)
- **Autoridade Final**: Governance Core.
- **Superfície**: Apenas um módulo (ex: `Analytics`) usa o `can()` como decisão real.
- **Rollback**: Ativável via Feature Flag específica por módulo.

### Fase C: Expansão Gradual
- Migração progressiva de blocos da UI para o novo motor até a desativação do legado.

---
**Pergunta Crítica:** A precedência está fisicamente garantida pela coluna `priority` e pela lógica de resolução que prioriza `MEMBERSHIP` sobre `ROLE`.
