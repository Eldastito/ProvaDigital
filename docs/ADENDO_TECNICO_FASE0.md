# FASE 0: Adendo Técnico de Diagnóstico (Granularidade Operacional)

Este adendo complementa o diagnóstico inicial da Fase 0 com o inventário técnico detalhado necessário para a migração segura da plataforma FORGE.

## 1. Inventário de Arquivos e Pontos de Acoplamento

Abaixo estão os locais onde o sistema depende diretamente de campos de governança legados:

### Acoplamento com `UserRole`
- **`types.ts`:** Enum central `UserRole`.
- **`store/slices/authSlice.ts`:** Tipagem do `currentUser` e inicialização de perfil.
- **`hooks/usePermissions.ts`:** Lógica de `can()` baseada na role.
- **`components/ProtectedRoute.tsx`:** Bloqueio de rotas.
- **`modules/school-management/hooks/useSchoolManagement.ts`:** Filtros condicionais pesados (ex: `isTenantAdmin`).
- **`modules/admin/components/CapabilitiesView.tsx`:** Tabela de matriz de permissões.
- **`modules/admin/module.tsx` / `modules/school-management/module.tsx`:** Definição de `allowedRoles` para acesso a módulos.

### Acoplamento com `tenant_id` / `tenantId`
- **Backend (Tabelas c/ FK):** `public.users`, `public.tenants`, `public.exams`, `public.items`, `public.schools`, `public.classes`, `public.institutional_events`.
- **`store/slices/authSlice.ts`:** Mapeamento `profile.tenant_id` -> `user.tenantId`.
- **`hooks/usePermissions.ts`:** Filtro de flags de tenant (`tenants.find(t => t.id === currentUser.tenantId)`).
- **`modules/analytics/NetworkDashboardView.tsx`:** Lógica de visualização de rede federada.

### Acoplamento com `school_id` / `schoolId`
- **`modules/school-management/ManagementView.tsx`:** Filtro principal de turmas e usuários da escola.
- **`modules/coordinator/ExamScheduler.tsx`:** Filtro de professores e aplicação por unidade escolar.
- **`modules/analytics/PedagogicalTrackingView.tsx`:** Métricas agregadas por escola.

### Acoplamento com `class_ids` / `classIds`
- **`modules/student-portal/hooks/useStudentDashboard.ts`:** Carregamento de provas vinculadas às classes do aluno.
- **`modules/analytics/GlobalRankingView.tsx`:** Filtro de ranking por turma.
- **`modules/coordinator/ClassCouncilView.tsx`:** Análise de IA focada no contexto de classe.

---

## 2. Matriz Atual de Roles e Permissões Legadas

| Role Atual | Recursos Acedidos (Exemplos) | Origem da Permissão | Exceções/Hardcodes |
| :--- | :--- | :--- | :--- |
| `MASTER_SAAS` | Todos os recursos + Logs Master | `DEFAULT_PERMISSIONS` | Override total no `usePermissions` |
| `SYSTEM_ADMIN` | Gestão de Tenants, Financeiro, Itens | `DEFAULT_PERMISSIONS` | Override total no `usePermissions` |
| `SUPER_ADMIN` | Redes Federadas, NeuroScreening, Itens | `DEFAULT_PERMISSIONS` | - |
| `STATE_ADMIN` | Analytics de Estado, Escolas Estaduais | `DEFAULT_PERMISSIONS` | Checagem de `TenantType` no Dashboard |
| `TENANT_ADMIN` | Gestão Completa de Rede Municipal | `DEFAULT_PERMISSIONS` | Frequentemente tratado como "isTenantAdmin" |
| `DIRETOR` | Gestão Escolar, Usuários da Unidade | `DEFAULT_PERMISSIONS` | Hardcode em `UserProfileView` |
| `PROFESSOR` | Banco de Itens, Turmas, Criação de Provas | `DEFAULT_PERMISSIONS` | - |
| `ALUNO` | Realização de Prova, Gamificação, Tutor | `DEFAULT_PERMISSIONS` | Restrição pesada em `StudyPlansView` |

---

## 3. Inventário de RLS (Supabase)

### Tabelas com RLS Ativo e Políticas:
1. **`public.users`**: 
   - Policy: "Read users" -> `id = auth.uid() OR tenant_id = get_current_tenant_id()`
2. **`public.students`**: 
   - Policy: "Read students" -> `school_id = get_current_tenant_id()`
3. **`public.exams`**: 
   - Policy: "Read exams" -> `tenant_id = get_current_tenant_id() OR school_id = get_current_tenant_id()`
4. **`public.schools`**: 
   - Policy: "Read schools" -> `id = get_current_tenant_id() OR tenant_id = get_current_tenant_id()`
5. **`public.items`**: 
   - Policy: "auth_access_items" -> `auth.role() = 'authenticated'` (Ainda permissiva em itens, risco moderado).

### Claims e Funções SQL:
- `auth.uid()`: Identifica o usuário logado.
- `get_current_tenant_id()`: Resolve o `tenant_id` ou `school_id` buscando na tabela `users` ou `students` a cada query.
- `get_current_user_role()`: Função customizada que lê `users.role` para políticas diferenciadas.

---

## 4. Fluxo Atual de Autenticação/Autorização

1. **Auth Trigger:** O usuário faz login via Supabase Auth.
2. **Identity Init:** `authSlice.ts` chama `supabase.auth.getUser()`, seguido de um select em `public.users`.
3. **Profile hydration:** Os campos `role`, `tenant_id` e `school_id` são lidos e injetados no objeto `currentUser` do Zustand.
4. **Route Access:** O `routes.tsx` usa `ProtectedRoute` que invoca o hook `usePermissions`.
5. **Permissive Check:** O `can()` consulta a matriz estática em `store/constants.ts` cruzando com a role do usuário.

---

## 5. Classificação de Risco por Tela/Fluxo

| Classificação | Componente/Fluxo | Motivo do Risco |
| :--- | :--- | :--- |
| **ALTO** | `authSlice / identityInit` | Se a inicialização de identidade falhar ou ler a organização errada, o app quebra por inteiro. |
| **ALTO** | `ManagementView / useSchoolManagement` | Contém a maioria dos filtros manuais baseados em role legada. |
| **ALTO** | `RLS Policies` | Mudanças de governança podem expor dados de uma escola para outra (cross-tenant). |
| **MÉDIO** | `ExamScheduler / AllocationView` | Regras de negócio podem impedir o agendamento de provas se o escopo não for detectado. |
| **MÉDIO** | `sidebar / managementModule` | Impacto visual e de navegação se as roles não forem mapeadas corretamente. |
| **BAIXO** | `UserProfileView` | Apenas exibição de dados estáticos; fácil de ajustar. |

---

## 6. Sequência Recomendada de Migração

1. **Governance Core (Camada de Compatibilidade):** Criar o `GovernanceService` que traduz roles legadas em contexto dinâmico (Fase 2 do plano original).
2. **Desacoplamento de UI:** Migrar os checks de `role === 'DIRETOR'` nas telas para `useGovernance().canManageSchool()`.
3. **Migração de Sidebar:** Substituir `allowedRoles` estáticos nas definições de módulo por `requiredCapabilities` ou `enabledModules`.
4. **Implementação de Memberships:** Começar a gravar dados na nova tabela `user_memberships` em paralelo ao campo `role` legado.
5. **Atualização de RLS:** Alterar as políticas do banco para consultar a tabela de `memberships` em vez do campo `role` fixo no `users`.

---

## 🔎 Risco Crítico: Coexistência de Students e Users
A migração **SSOT (Single Source of Truth)** que está movendo `students` para `users` é um ponto de conflito. A nova governança deve tratar `students` como um Membership em uma organização do tipo `school`, evitando que regras de governança global (MEC) interfiram na estrutura de matrícula já em curso.

---
**Entregável:** Adendo Técnico de Diagnóstico - Fase 0.
**Data:** 15/03/2026
