# Veredito Estratégico R4C — Porto Alegre (POA)

**Status**: 🟩 APROVADO PARA EXECUÇÃO DE MOCK SECO  
**Data da Decisão**: 26/03/2026  
**Escopo Regional**: Porto Alegre (Cluster Inácio Montanha)  
**Cluster Julinho**: Migrado para R5 (não integra o escopo operacional do R4C)

---

## 1. Objetivo Estratégico
O R4C (Release 4, Versão C) em Porto Alegre visa validar o **Authority Pilot** e a resiliência do sistema em um cenário realista de alta concorrência: **5 salas simultâneas / 20 segundos de pressão de handshake**.

## 2. Matriz de Decisão dos Gates (Oficial)

Esta matriz define o critério de **GO / NO-GO** para a promoção do piloto para operação real pós-ensaio.

| Resultado Gate 1 | Resultado Gate 2 | Veredito Final | Ação Imediata |
| :--- | :--- | :--- | :--- |
| **FALHA** | Qualquer | ❌ **NO-GO** | Aborto imediato e análise de causa raiz. |
| **SUCESSO** | **SUCESSO** | ✅ **GO** | Autorização para expansão Regional POA. |
| **SUCESSO** | **FALHA** | ⚠️ **GO CONDICIONADO** ou ❌ **NO-GO** | Decisão executiva formal baseada no parecer técnico, severidade do impacto, risco residual e possibilidade de mitigação operacional sem improviso. |

*   **Gate 1 (Capacidade & Cauda)**: Eliminatório. Foco em performance **P95** e estabilidade de Handshake.
*   **Gate 2 (Resiliência & Watchdog)**: Complementar. Foco em robustez operacional e recuperação automática.

---

## 3. Validade do Ensaio e Unidades
O ensaio será realizado no Colégio Inácio Montanha. A unidade **Julinho** foi removida da base operacional deste ciclo e oficialmente migrada para o planejamento do **R5**, preservando a integridade do baseline técnico do R4C.

---

## 4. Política de Reexecução
Para garantir a auditabilidade e evitar a tentação de múltiplas tentativas informais:

-   **Toda mobilização formal de mock registrada em agenda, equipe e lote constitui uma tentativa oficial.**
-   Apenas **uma (1) nova tentativa oficial** é permitida após a primeira, independentemente de o ensaio anterior ter sido validado ou invalidado.
-   **Exceção**: Abortamento pré-gate formalmente registrado antes do início do handshake coordenado.
-   O resultado do ensaio original **não pode ser descartado**; ele deve constar no relatório final para fins de auditoria comparativa.

---

## 5. Próximos Passos
1. Execução do Mock conforme o [RUNBOOK_MOCK_SECO_R4C_POA.md](./RUNBOOK_MOCK_SECO_R4C_POA.md).
2. Consolidação das evidências no [RELATORIO_EVIDENCIA_MOCK_SECO_R4C_POA.md](./RELATORIO_EVIDENCIA_MOCK_SECO_R4C_POA.md).
3. Reunião de Gate Executivo após análise do **P95** global e **P95** por sala.

---
**Assinatura**: Governança Authority Pilot | Porto Alegre
