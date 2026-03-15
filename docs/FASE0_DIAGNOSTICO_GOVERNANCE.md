# FASE 0: Diagnóstico de Governança e Acesso - Plataforma FORGE

Este documento apresenta o diagnóstico detalhado da arquitetura atual de governança, permissões e acesso da plataforma FORGE, servindo como base para a transição arquitetural faseada.

## 1. Diagnóstico do Legado
Atualmente, a FORGE utiliza um modelo de **Multi-tenancy simples**, onde cada usuário está vinculado a um único `tenantId` e um único `schoolId` (opcional). As permissões são resolvidas através de uma matriz estática (`DEFAULT_PERMISSIONS`) e verificadas via hook `usePermissions` no frontend. 

O sistema depende fortemente de verificações diretas de `UserRole` no código da interface, o que dificulta a expansão para modelos de governança complexos (MEC, Secretarias, etc.).

## 2. Mapa de Telas e Fluxos Afetados

### Telas Críticas:
- **ManagementView.tsx:** Gestão de rede (escolas/usuários). Altamente acoplada a roles administrativas.
- **DashboardView.tsx:** Renderização condicional de cards baseada no perfil.
- **StudentDashboardView.tsx:** Contexto fixo de aluno/pais.
- **LogisticsManagementView.tsx / CustodianOperationsView.tsx:** Permissões específicas de operação logística.
- **ExamScheduler.tsx:** Fluxo de agendamento que filtra professores por `schoolId`.
- **UserProfileView.tsx:** Exibição de dados de perfil e escopo.

### Fluxos Afetados:
- **Autenticação & Init:** Inicialização do `currentUser` no `authSlice`.
- **Navegação Lateral:** Sidebar filtrada por `allowedRoles` no `managementModule`.
- **Troca de Contexto:** Inexistente de forma formal para usuários com multi-escopo (ex: gestor de rede).

## 3. Tabelas e Entidades Relacionadas
- **public.users:** Armazena `role`, `tenant_id`, `school_id`, `class_ids`. Centraliza a identidade atual.
- **tenants:** Define configurações de nível alto e recursos desabilitados (feature flags rudimentares).
- **schools:** Entidade legada vinculada a um tenant.
- **students:** (Em processo de migração SSOT para `users`).

## 4. Regras Escondidas (Pontos de Atenção)

### Frontend:
- **Hardcoded Checks:** Verificações como `role === UserRole.SYSTEM_ADMIN || role === UserRole.MASTER_SAAS` em múltiplos hooks e componentes.
- **Filtros no Cliente:** Hooks como `useSchoolManagement.ts` realizam filtros de usuários/classes diretamente no estado do frontend após carregar dados globais do tenant.
- **Dependência Estática:** `RESOURCE_DEPENDENCIES` define relações entre módulos de forma estática, sem considerar o contrato da organização.

### Backend:
- **RLS (Supabase):** Políticas de Row Level Security baseadas na coluna `tenant_id` e claims de `role` no JWT (via triggers em `public.users`).
- **Trigger de Auditoria:** Grava ações baseadas no `auth.uid()`, mas sem o contexto de "Organização Ativa" ou "Sessão de Governança".

## 5. Riscos de Regressão
- **Quebra de Permissões Existentes:** A transição pode bloquear usuários legítimos se os mapeadores de legados falharem.
- **Performance:** A resolução dinâmica de permissões por organização pode aumentar a latência na renderização se não for otimizada (memoização).
- **Inconsistência de Dados:** Risco de desincronização entre a nova tabela `organizations` e o campo `tenant_id` legado durante a fase de convivência.

## 6. Dependências Entre Atores
- **Atores Administrativos:** Dependência direta de `tenant_id`. Se o `tenantId` muda para `organizationId`, todas as queries RLS precisam de atualização.
- **Atores Pedagógicos:** Dependência de `class_ids`. Atualmente um usuário só "vê" o que está no seu array fixo de classes.

## 7. Proposta de Fronteira: Governance & Access Core
A nova camada (Core) deve ser o único ponto da verdade para:
- **Contexto Ativo:** Qual a `Organization` e `Scope` que o usuário está operando no momento.
- **Efetivação de Permissão:** `can(action, resource)` deve consultar o `Membership` do usuário na organização ativa.
- **Habilitação de Módulos:** Os itens da sidebar e rotas devem ser resolvidos via `activeOrganization.enabledModules`.

## 8. Sugestão Inicial de Feature Flags
- `feat_new_governance_enabled`: Alterna entre o hook `usePermissions` legado e o novo serviço de Core.
- `feat_multi_organization_support`: Habilita a interface de troca de contexto para usuários com múltiplos memberships.

## 9. Estratégia de Rollback
1. **Shadow Mode:** O novo core roda em paralelo, logando discrepâncias entre o resultado dele e o do legado, sem bloquear o usuário.
2. **Proxy Service:** O serviço central de permissões manterá suporte ao `DEFAULT_PERMISSIONS` como fallback caso o usuário não tenha um `Membership` formalizado na nova estrutura.
3. **Toggle Global:** Flag de emergência no `useAppStore` para forçar o retorno ao modelo de `UserRole` estático.

---
**Entregável:** Fase 0 - Diagnóstico Concluído.
**Data:** 15/03/2026
