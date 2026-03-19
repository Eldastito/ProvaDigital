# Checklist Operacional: Burst de Governança (Fase 4)

Este checklist guia a execução do Teste de Burst para validar o Authority Pilot sob pressão.

## 1. Preflight (Higiene)
- [x] Rodar `npx tsx scripts/testGovernance_Session6_Rollback.ts`
- [x] Verificar se o log aponta `Everything up-to-date` no Git.
- [x] Garantir que `governanceService.ts` está com `authority_pilot_analytics_readonly` habilitado.

## 2. Execução: Perfil Operacional
- [x] Comando: `npx tsx scripts/testGovernance_Burst_5Contexts.ts --profile=operational`
- [x] **Critério:** Exit Code 0.
- [x] **Critério:** p95 < 7ms no Level 3.
- [x] **Critério:** Vazamentos (Leak/Escape) = 0.

## 3. Execução: Perfil Adversarial (Pós-Patch)
- [x] Comando: `npx tsx scripts/testGovernance_Burst_5Contexts.ts --profile=adversarial`
- [x] **Critério:** Exit Code 0.
- [x] **Critério:** `Block (RO)` > 0 (Confirmação de bloqueio de mutação).
- [x] **Critério:** `Leak` e `Escape` = 0.
- [x] **Critério:** `Shadow Delegation` em mutações = 0.

## 4. Evidência e Auditoria
- [x] Validar geração de `docs/REPORT_BURST_5_CONTEXTS.md`.
- [x] Salvar JSON bruto em `artifacts/burst/raw_data_[timestamp].json`.

## 5. Critérios de Saída da Fase 4 - Step 1
1. [x] Motor resiliente a picos de 150k+ requests/fase.
2. [x] Isolamento Cross-Org garantido sob carga.
3. [x] Readonly mode aplicado via Patch de Autoridade do Core.
4. [x] Zero fallbacks catastróficos.
