# Runbook Operacional: Mock Seco R4C — Porto Alegre (POA)

**Escopo**: Inácio Montanha
**Tipo de Teste**: Mock Seco (Dry Run) - Carga Máxima Coordenada

---

## 1. Cenário de Execução: 5 Salas / 20 Segundos
Para o R4C, o nível de estresse foi ajustado para representar o pico real de uma unidade de grande porte:

-   **Volume**: 5 salas simultâneas.
-   **Pressão**: Handshake distribuído em janela de 20 segundos por sala.
-   **Objetivo**: Garantir que o `p95` global e o `P95 por sala` estejam dentro da margem de segurança.

## 2. Validade do Ensaio e Regras de Telemetria (Blindagem)

O ensaio só será considerado válido se atender rigorosamente às métricas de volume e rastreabilidade:

### A. Lote de Dispositivos
-   **Lote previsto nominal**: 300 tablets.
-   **Mínimo para validade**: **285 tablets ativos, identificados nominalmente e telemetrizados**.

### B. Tratamento de Exceções Operacionais
-   Dispositivos sem telemetria, com handshake incompleto ou perda de rastreabilidade: **Devem constar nominalmente no relatório como exceção operacional**.
-   **Veda-se qualquer descarte silencioso** da base de análise. Os dispositivos que falharem em reportar telemetria permanecem incluídos na estatística e compõem a métrica de indisponibilidade oficial do dia do ensaio.

## 3. Passo a Passo do Mock

1.  **Warm-up**: Ativar telemetria em 100% do lote (mínimo 285 identificados).
2.  **Preparação das Salas**: 5 salas de 60 tablets cada (ou conforme proporção do local).
3.  **Janela de Handshake**: Disparo coordenado para que os 60 handshakes de cada sala ocorram em no máximo 20 segundos.
4.  **Monitoramento Regional**: Acompanhar o painel de telemetria em tempo real para detectar cauda de latência.
5.  **Checkpoint Final**: Validar se houve perda de identificação nominal em algum dispositivo.

## 4. Indicadores Obrigatórios
O resultado deste runbook deve ser alimentado no Relatório de Evidência, contendo:
-   **P95 global < 3m15s**.
-   **P95 por sala** (alinhado aos guardrails regionais).
-   **Zero latências acima de 3m28s**.
-   **Máximo 1 latência acima de 3m25s por sala**.

---
**Execução**: Equipe Regional POA | Coordenação Authority Pilot
