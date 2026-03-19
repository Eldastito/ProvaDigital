# Checklist Operacional: Ativação Gravataí (Fase 3B.1)

## ID da Operação: EXP-GRA-2026-03-19

---

## 🛡️ PASSO 1: Sanidade e Verificação de Flag (PRONTIDÃO)

| Item | Descrição | Status / Evidência |
| :--- | :--- | :---: |
| **1.1** | Verificar flag por contexto: POA, Canoas, Alvorada, Viamão (ENABLED) | [x] |
| **1.2** | Verificar flag por contexto: Gravataí (DISABLED) | [x] |
| **1.3** | Confirmar baseline funcional inalterada (Commit `28eea1f63c4`) | [x] |
| **1.4** | Executar Teste de Sanidade Multi-Org (Rollback Seguro) | [x] |
| **1.5** | Registrar baseline de Deny Category (Isolamento vs Whitelist) | [x] |
| **1.6** | Registrar baseline de acessos sensíveis (`STUDENT_PEDAGOGICAL_DATA`) | [x] |

**Resultado Passo 1:** [x] APTO PARA INÍCIO DA ATIVAÇÃO CONTROLADA

---

## 🕒 PASSO 2: Habilitação Contextual e Observação (EXECUÇÃO)

| Item | Descrição | Status / Evidência |
| :--- | :--- | :---: |
| **2.1** | Habilitar exclusivamente `gravatai_organization` no motor Core | [x] |
| **2.2** | Registrar snapshot APÓS ativação (Confirmar Preservação dos 4 anteriores) | [x] |
| **2.3** | Iniciar janela de observação controlada (30 minutos) | [x] |
| **2.4** | Monitorar p95 E2E (Meta < 5.0ms) e Deltas de performance | [x] |
| **2.5** | Monitorar histograma de Deny vs Baseline do Passo 1 | [x] |
| **2.6** | Verificar isolamento cross-org total | [x] |

**Resultado Passo 2:** [x] GO / [ ] NO-GO

---
**Equipe de Operação:**
- **Executor:** Antigravity AI Engineering
- **Revisor/Aprovador:** Governança Core
