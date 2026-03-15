# Plano de Testes de Isolamento - Governance & Access Core

Este documento descreve os casos de teste obrigatórios para validar o isolamento de escopo e evitar vazamento de dados (Cross-tenant) durante e após a migração.

## 1. Testes de Isolamento Horizontal (Cross-Tenant/School)

### [T01] School-to-School Isolation
- **Ator**: Professor da Escola A.
- **Ação**: Listar turmas via `activeSchoolId`.
- **Cenário**: Tenta passar manualmente o UUID da Escola B.
- **Resultado Esperado**: Bloqueio total. O `governanceService` deve detectar que o `activeMembership` não contempla a Escola B.

### [T02] Municipal-to-Municipal Isolation
- **Ator**: Secretário Municipal de Educação da Cidade X.
- **Ação**: Consultar ranking de desempenho.
- **Cenario**: Tenta acessar dados de uma escola da Cidade Y.
- **Resultado Esperado**: Bloqueio. O `activeOrganizationId` deve isolar completamente os subordinados.

## 2. Testes de Isolamento Vertical (Hierarquia e Papéis)

### [T03] Teacher vs School Manager
- **Ator**: Professor.
- **Ação**: Editar dados de outro professor na mesma escola.
- **Resultado Esperado**: Bloqueio. A capability `user_data:edit` para o papel `teacher` deve ser restrita ao próprio `uid` ou negada para membros do mesmo nível.

### [T04] Operations vs Pedagogical
- **Ator**: `operations_admin` (Logística/Tablet).
- **Ação**: Acessar `SkillsHeatmapWidget` (Notas BNCC).
- **Resultado Esperado**: Bloqueio. O papel de operações não deve possuir a capability `pedagogical_data:view`.

## 3. Testes de Segurança de Escopo

### [T05] State Scope Boundary
- **Ator**: Admin Estadual do Estado 1.
- **Ação**: Listar municípios vinculados.
- **Cenário**: Tenta listar municípios do Estado 2.
- **Resultado Esperado**: Bloqueio. O `scope_value` deve ser validado contra o `activeOrganizationId`.

### [T06] Student/Guardian Isolation
- **Ator**: Aluno/Pais.
- **Ação**: Acessar `ExamResults` de outro aluno.
- **Cenário**: Tenta alterar o `student_id` na query.
- **Resultado Esperado**: Bloqueio por RLS (legada) e rejeição pelo `governanceService` (novo) ao validar que o `student_id` não pertence ao `activeMembership` de família.

## 4. Testes de Multi-Membership (Novo Coração do Core)

### [T07] Role Switching Validation
- **Ator**: Usuário com dois memberships: `Teacher` na Escola A e `Coordinator` na Escola B.
- **Ação**: Criar exame na Escola A.
- **Contexto**: `activeMembershipId` aponta para a Escola B (Coordinator).
- **Resultado Esperado**: Bloqueio. Embora o usuário *seja* professor em algum lugar, no contexto ativo (Escola B) ele não deve poder agir como professor da Escola A.

### [T08] Membership Hierarchy Conflict
- **Ator**: Gestor de Rede que também é Diretor de uma escola específica.
- **Ação**: Editar configurações da Rede.
- **Cenário**: O usuário está operando com o membership de `DIRETOR`.
- **Resultado Esperado**: Bloqueio. O core deve respeitar apenas as capabilities do `activeMembershipId`, ignorando privilégios de outros vínculos inativos.

## 5. Testes de Shadow Mode (Divergência e Auditoria)

### [T09] Forensic Audit Trace
- **Cenário**: O Core diverge do legado.
- **Verificação**: Validar se a tabela `governance_audit` gravou: `actor_role_legacy`, `actor_role_core`, `legacy_reason` e `core_reason`.
- **Objetivo**: Garantir que temos rastro técnico para corrigir o mapeador.

---
**Data de Criação:** 15/03/2026
**Status:** Pendente de Execução (Fase 2/3)
