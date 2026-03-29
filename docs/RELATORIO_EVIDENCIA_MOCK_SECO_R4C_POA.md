# Relatório de Evidência: Mock Seco R4C — Porto Alegre (POA)

**Status do Gate**: **[X] EM BLOQUEIO / INCONCLUSIVO POR AUSÊNCIA DE TELEMETRIA OFICIAL**  
**Data do Ensaio**: 26/03/2026  
**Lote Previsto**: 300 tablets (Inácio Montanha)  
**Mínimo Válido**: 285 identificados e telemetrizados nominalmente

---

## 1. Resultado Consolidado (Leitura Executiva)
Consolidação dos principais indicadores de performance e disponibilidade do ensaio.

| Métrica | Resultado | Status (Pass/Fail) |
| :--- | :---: | :---: |
| **P50 Global** | **N/A** | **N/A** |
| **P95 Global** | **N/A** | **N/A** |
| **P99 Global** | **N/A** | **N/A** |
| **Máximo Absoluto** | **N/A** | **N/A** |
| **Total >3m25s** | **N/A** | **N/A** |
| **Total >3m28s** | **N/A** | **N/A** |
| **Exceções Nominais** | **N/A** | **N/A** |
| **Watchdog Recovery (T2-T0)**\* | **N/A** | **N/A** |
| **Veredito Técnico Preliminar** | **BLOQUEIO OPERACIONAL** | **FAIL (GOVERNANCE)** |

*\*Se Gate 2 for NÃO EXECUTADO, preencher como: **N/A — bloqueado por falha eliminatória do Gate 1**.*

---

## 2. Registro de Resultados (Gates de Governança)
O resultado dos Gates registrados abaixo segue a **Matriz de Decisão Oficial** definida no [VEREDITO_ESTRATEGICO_R4C_POA.md](./VEREDITO_ESTRATEGICO_R4C_POA.md) e no [RUNBOOK_MOCK_SECO_R4C_POA.md](./RUNBOOK_MOCK_SECO_R4C_POA.md).

| Gate | Status | Critério Mandatório | Evidência Técnica |
| :--- | :--- | :--- | :--- |
| **Gate 1** | **[X] NÃO AVALIÁVEL** | **P95** Global < 3m15s | [Sem Telemetria Regional] |
| **Gate 2** | **[X] NÃO EXECUTADO / NÃO AVALIÁVEL** | **Recuperação Watchdog < 15s** | [N/A] |

*\*Bloqueado por falha eliminatória do Gate 1.*

---

## 3. Auditoria Detalhada: Gate 2 (Resiliência & Watchdog)
Estatísticas do teste de queda controlada para validação da robustez do sistema.

-   **Gate 2 Executado?** [ ] Sim / [ ] Não
-   *Se não, justificar: ____________________________________*

-   **Sala Testada**: ____________
-   **T0 (Queda Gateway)**: ____________
-   **T1 (Início Recuperação)**: ____________
-   **T2 (Recuperação Plena)**: ____________
-   **Tempo de Recuperação (T2 - T0)**: **______ segundos**

**Diagnóstico Operacional**:
-   Houve perda de rastreabilidade? [ ] Sim / [ ] Não
-   Houve necessidade de intervenção manual? [ ] Sim / [ ] Não
-   Observação de impacto operacional no lote: _____________________________________

**Evidências Mandatórias**:
-   [ ] Log de eventos do sistema anexado.
-   [ ] Captura do painel regional pós-queda anexada.

---

## 4. Indicadores Estáveis por Sala (Obrigatório)
O **P95** por sala é o indicador de estabilidade local da rede e do handshake.

| Sala | Total Tablets | Máximo Handshake | **P95** Sala | Cauda >3m25s | Cauda >3m28s | Geometria Padrão? | Observações |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| Sala 1 | N/A | N/A | N/A | N/A | N/A | [ ] Sim / [ ] Não | |
| Sala 2 | N/A | N/A | N/A | N/A | N/A | [ ] Sim / [ ] Não | |
| Sala 3 | N/A | N/A | N/A | N/A | N/A | [ ] Sim / [ ] Não | |
| Sala 4 | N/A | N/A | N/A | N/A | N/A | [ ] Sim / [ ] Não | |
| Sala 5 | N/A | N/A | N/A | N/A | N/A | [ ] Sim / [ ] Não | |

---

## 5. Gestão de Exceções Nominais (Blindagem)
Conforme a regra de **vedação de descarte silencioso**:

> Dispositivos sem telemetria, com handshake incompleto ou perda de rastreabilidade permanecem incluídos na base oficial de análise do ensaio como **exceção nominal**, impactando a métrica de disponibilidade e validade do lote. Quando inexistir medição íntegra de handshake, tais dispositivos não compõem a amostra válida dos percentis de latência.

| ID Tablet | Nome Aluno/Ref | Falha Observada | Categoria |
| :--- | :--- | :--- | :--- |
| | | | ( ) Exceção Operacional |
| | | | ( ) Exceção Operacional |

---

## 6. Conclusão Operacional
-   **Validade**: O lote atingiu o mínimo de 285 tablets (95%)? [ ] Sim / **[X] Não (Telemetria Inexistente)**.
-   **Tentativa Oficial**: Este ensaio é uma: **[X] 1ª Tentativa Oficial** | [ ] 2ª Tentativa Oficial (Reexecução).
    -   *Observação: Gate bloqueado por falha na extração de logs do Mock Seco de 26/03/2026. Qualquer simulação sintética subsequente servirá apenas para calibração de rerun e não substitui evidência de campo.*

---
**Responsável**: Engenharia de Pilotagem | Porto Alegre
