# Relatório de Evidência: Mock Seco R4C — Porto Alegre (POA)

**Status do Gate**: [ ] EM AVALIAÇÃO | [ ] APROVADO | [ ] REPROVADO  
**Data do Ensaio**: 26/03/2026  
**Lote Previsto**: 300 tablets (Inácio Montanha)  
**Mínimo Válido**: 285 identificados e telemetrizados nominalmente

---

## 1. Registro de Resultados (Gates de Governança)
O resultado dos Gates registrados abaixo segue a **Matriz de Decisão Oficial** definida no [VEREDITO_ESTRATEGICO_R4C_POA.md](file:///c:/Users/miche/Downloads/examepad-saas-prova-digital/docs/VEREDITO_ESTRATEGICO_R4C_POA.md) e no [RUNBOOK_MOCK_SECO_R4C_POA.md](file:///c:/Users/miche/Downloads/examepad-saas-prova-digital/docs/RUNBOOK_MOCK_SECO_R4C_POA.md).

| Gate | Status | Critério Mandatório | Evidência Técnica |
| :--- | :--- | :--- | :--- |
| **Gate 1** | [ ] | p95 Global < 3m15s | [Link Telemetria] |
| **Gate 2** | [ ] | Recuperação Watchdog < 15s | [Log Eventos] |

## 2. Indicadores Estáveis por Sala (Obrigatório)
O P95 por sala é o indicador de estabilidade local da rede e do handshake.

| Sala | Total Tablets | Máximo Handshake | P95 Sala | Cauda >3m25s | Cauda >3m28s | Geometria Padrão? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Sala 1 | | | | | | [ ] Sim |
| Sala 2 | | | | | | [ ] Sim |
| Sala 3 | | | | | | [ ] Sim |
| Sala 4 | | | | | | [ ] Sim |
| Sala 5 | | | | | | [ ] Sim |

## 3. Gestão de Exceções Nominais
Conforme a regra de **vedação de descarte silencioso**, abaixo constam os dispositivos que apresentaram falha de telemetria ou handshake incompleto durante o ensaio:

| ID Tablet | Nome Aluno/Ref | Falha Observada | Impacto no Lote |
| :--- | :--- | :--- | :--- |
| | | | ( ) Exceção |
| | | | ( ) Exceção |

*   **Nota**: Dispositivos marcados como exceção nominal **não foram descartados** do cálculo de latência e compõem a métrica de indisponibilidade oficial do dia do ensaio.

## 4. Conclusão Operacional
-   **Validade**: O lote atingiu o mínimo de 285 tablets (95%)? [ ] Sim / [ ] Não.
-   **Reexecução**: Este ensaio é uma reexecução? [ ] Sim / [ ] Não.
    -   *Se sim, anexar registro de causa e comparação com ensaio anterior.*

---
**Responsável**: Engenharia de Pilotagem | Porto Alegre
