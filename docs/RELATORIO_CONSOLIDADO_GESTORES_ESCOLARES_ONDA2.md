# Relatório Consolidado: Cohort Gestores Escolares (Onda 2)

**Sessões Executadas**: 16, 17 e 18
**Baseline Canônica**: `87b037a` | **Tag**: `onda-2-staging-freeze-v2`
**Status Final**: ✅ **VALIDADO NO ESCOPO UNIT**

## 1. Resumo das Sessões e Divergências
O grupo de Gestores Escolares foi exercitado em cenários de isolamento administrativo e visibilidade de unidade.

| Sessão | Perfil | Divergências | Eventos de Segurança | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| **16** | Piloto (Escola 1) | 0 | Bloqueio Cross-School/Rede Auditado | ✅ PASS |
| **17** | Intensiva (Escola 1) | 0 | Estabilidade de Escopo UNIT (50 reqs) | ✅ PASS |
| **18** | Nova Unidade (Escola 3) | 0 | Isolamento Rigoroso vs Escola 1/2 | ✅ PASS |

## 2. Validação de Contexto e Coerência
- **Contexto Ativo**: 100% de consistência em `activeSchoolId` e `activeOrganizationId`.
- **Diferenciação de Membership**: Cada gestor operou sob um `activeMembershipId` único e vinculado à sua unidade, prevenindo stale data.
- **Escalabilidade de Privilégio**: O motor bloqueou com sucesso tentativas (simuladas) de acesso a analytics de rede/municipais, respeitando o limite do escopo `UNIT`.

## 3. Métricas de Performance Final
- **Motor `can()` (P95)**: **0.0028ms** (Meta: < 2ms) 🚀
- **Superfície (Sidebar/Dash)**: **48ms** (Meta: < 200ms).

## 4. Ocorrencias e Auditoria
- `[SECURITY_AUTHORITY_FAILURE]`: 6 eventos logados (tentativas simuladas de bypass de escola/rede).
- `[GOVERNANCE AUDIT]`: Visibilidade de relatórios administrativos legítimos validada sem divergências.

## 5. Veredito e Recomendação
O domínio de **Gestor Escolar (UNIT)** está estável e seguro. O motor de governança garante que o acesso administrativo não vaze entre unidades ou escale para o nível de rede indevidamente.

- **Recomendação**: 🟢 **FECHAR** o cohort de Gestores Escolares e **AVANÇAR** para o planejamento da primeira Sessão Piloto de **Gestor de Rede (Municipal)**, mantendo o Shadow Mode estrito.

---
**Assinatura**: Antigravity | **Status**: Cohort Gestor Escolar Concluído.
