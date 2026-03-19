## 🧱 1. Baseline de Entrada para a Próxima Fase

A próxima fase deve usar como **baseline funcional** o commit/tag `d0d4edc` (`fase-3b1-encerrada`) e como **referência documental corrente** a branch `main` a partir de `85dccb5` (que inclui este documento de transição sem alterar o motor operacional).

| Item | Valor |
| :--- | :--- |
| **Âncora Funcional (Fase 3B.1)** | `d0d4edc82789a9e918287ef7068578e622c8b9d6` |
| **HEAD Documental (Atual)** | `85dccb5` |
| **Tag de Encerramento** | `fase-3b1-encerrada` |
| **Municípios Ativos** | POA, Canoas, Alvorada, Viamão, Gravataí |
| **Baseline normativa** | `docs/BASELINE_CONGELADA_FASE_3B_1.md` (Commit `28eea1f63c4`) |
| **Métrica mestre** | p95 End-to-End < 5.0ms |
| **Referência de p95** | POA 0.865ms / Canoas 2.037ms / Alvorada 1.315ms / Viamão 1.352ms / Gravataí 1.412ms |

---

## ⚠️ 2. Riscos Herdados

| Risco | Natureza | Mitigação Ativa |
| :--- | :--- | :--- |
| **Deny por automação** | 12% dos denies são tentativas pre-visíveis em `STUDENT_PEDAGOGICAL_DATA` | Monitorar histograma de deny por categoria desde o Passo 1 de novos municípios |
| **Ambiente simulado** | Toda a fase foi validada em `DevMachine / Simulation of PROD_CONTROLADO` | Qualquer novo município ou extensão de escopo deve ser tratado com o mesmo nível de escrutínio |
| **Crescimento de carga** | 5 contextos geram pressão crescente. O overhead marginal (+~0.05ms/contexto) não mostrou saturação, mas o risco existe | Manter comparativo horário de p95 nos soaks seguintes |
| **Sem teste sob pico real** | A fase não testou cenário de burst real simultâneo em 5 contextos | Incluir bateria curta de burst nos próximos checkpoints |

---

## 📏 3. Critérios de Entrada da Próxima Fase

Qualquer ação que expanda o escopo deve respeitar as seguintes condições:

- O commit `d0d4edc` deve estar sincronizado em `origin/main`
- A tag `fase-3b1-encerrada` deve estar presente no remoto
- Nenhum município já ativo (POA, Canoas, Alvorada, Viamão, Gravataí) pode estar com p95 > 5ms antes do início
- O histograma de deny deve continuar aderente ao padrão 88/12 (±5%)

---

## 🚫 4. Critérios de Rollback Herdados

Os gatilhos de stop-the-line permanecem ativos para a próxima fase:

- p95 sustentado >= 10ms em qualquer contexto ativo
- Qualquer write attempt que escape o bloqueio
- Qualquer cross-org leak
- Drift de contexto ou flag
- Auto-disable event
- Crescimento anômalo do deny de whitelist fora da faixa esperada

---

## 🎯 5. Metas da Próxima Fase

> A serem definidas na abertura formal da próxima fase.

Sugestões de foco com base na 3B.1:

- Validar comportamento do motor Core com carga real (não simulada)
- Testar burst simultâneo em N contextos ativos
- Estabelecer critério de "maturidade para PROD completo"

---
*Responsável Técnico: Governança Core — 2026-03-19 15:35 UTC-3*
