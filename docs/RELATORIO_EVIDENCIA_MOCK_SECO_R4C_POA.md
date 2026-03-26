# Relatório de Evidência: Mock Seco R4C — Porto Alegre (POA)

**Status do Gate**: [ ] EM AVALIAÇÃO | [ ] APROVADO | [ ] REPROVADO  
**Data do Ensaio**: 26/03/2026  
**Lote Previsto**: 300 tablets (Inácio Montanha)  
**Mínimo Válido**: 285 identificados e telemetrizados nominalmente

---

## 1. Resultado Consolidado (Leitura Executiva)
Consolidação dos principais indicadores de performance e disponibilidade do ensaio.

| Métrica | Resultado | Status (Pass/Fail) |
| :--- | :---: | :---: |
| **P50 Global** | | |
| **P95 Global** | | |
| **P99 Global** | | |
| **Máximo Absoluto** | | |
| **Total >3m25s** | | |
| **Total >3m28s** | | |
| **Exceções Nominais** | | |
| **Watchdog Recovery (T2-T0)** | | |
| **Veredito Técnico Preliminar** | | |

---

## 2. Registro de Resultados (Gates de Governança)
O resultado dos Gates registrados abaixo segue a **Matriz de Decisão Oficial** definida no [VEREDITO_ESTRATEGICO_R4C_POA.md](./VEREDITO_ESTRATEGICO_R4C_POA.md) e no [RUNBOOK_MOCK_SECO_R4C_POA.md](./RUNBOOK_MOCK_SECO_R4C_POA.md).

| Gate | Status | Critério Mandatório | Evidência Técnica |
| :--- | :--- | :--- | :--- |
| **Gate 1** | [ ] | **P95** Global < 3m15s | [Link Telemetria] |
| **Gate 2** | [ ] | Recuperação Watchdog < 15s | [ID Sala / Log / Captura / Impacto] |

---

## 3. Indicadores Estáveis por Sala (Obrigatório)
O **P95** por sala é o indicador de estabilidade local da rede e do handshake.

| Sala | Total Tablets | Máximo Handshake | **P95** Sala | Cauda >3m25s | Cauda >3m28s | Geometria Padrão? | Observações |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| Sala 1 | | | | | | [ ] Sim / [ ] Não | |
| Sala 2 | | | | | | [ ] Sim / [ ] Não | |
| Sala 3 | | | | | | [ ] Sim / [ ] Não | |
| Sala 4 | | | | | | [ ] Sim / [ ] Não | |
| Sala 5 | | | | | | [ ] Sim / [ ] Não | |

---

## 4. Gestão de Exceções Nominais (Blindagem)
Conforme a regra de **vedação de descarte silencioso**:

> Dispositivos sem telemetria, com handshake incompleto ou perda de rastreabilidade permanecem incluídos na base oficial de análise do ensaio como **exceção nominal**, impactando a métrica de disponibilidade e validade do lote. Quando inexistir medição íntegra de handshake, tais dispositivos não compõem a amostra válida dos percentis de latência.

| ID Tablet | Nome Aluno/Ref | Falha Observada | Categoria |
| :--- | :--- | :--- | :--- |
| | | | ( ) Exceção Operacional |
| | | | ( ) Exceção Operacional |

---

## 5. Conclusão Operacional
-   **Validade**: O lote atingiu o mínimo de 285 tablets (95%)? [ ] Sim / [ ] Não.
-   **Tentativa Oficial**: Este ensaio é uma: [ ] 1ª Tentativa Oficial | [ ] 2ª Tentativa Oficial (Reexecução).
    -   *Se reexecução, anexar registro de causa e comparação integral com o ensaio anterior.*

---
**Responsável**: Engenharia de Pilotagem | Porto Alegre
