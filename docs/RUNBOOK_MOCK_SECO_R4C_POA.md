# Runbook Operacional: Mock Seco R4C — Porto Alegre (POA)

**Escopo**: Inácio Montanha
**Tipo de Teste**: Mock Seco (Dry Run) - Carga Máxima Coordenada

---

## 1. Cenário de Execução: 5 Salas / 20 Segundos
Para o R4C, o nível de estresse foi ajustado para representar o pico real de uma unidade de grande porte:

-   **Volume**: 5 salas simultâneas.
-   **Pressão**: Handshake distribuído em janela de 20 segundos por sala.
-   **Objetivo**: Garantir que o **P95** global e o **P95** por sala estejam dentro da margem de segurança.

## 2. Validade do Ensaio e Regras de Telemetria (Blindagem)

O ensaio só será considerado válido se atender rigorosamente às métricas de volume e rastreabilidade:

### A. Lote de Dispositivos (Mínimo Nominal)
-   **Lote previsto nominal**: 300 tablets.
-   **Mínimo para validade**: **285 tablets ativos, identificados nominalmente e telemetrizados**.

### B. Tratamento de Exceções Operacionais
-   Dispositivos sem telemetria, com handshake incompleto ou perda de rastreabilidade: **Devem constar nominalmente no relatório como exceção operacional**.
-   **Veda-se qualquer descarte silencioso** da base de análise. Os dispositivos que falharem em reportar telemetria permanecem incluídos na estatística e compõem a métrica de indisponibilidade oficial do dia do ensaio.

## 3. Passo a Passo do Mock (Gate 1 — Capacidade & Cauda)

1.  **Warm-up**: Confirmar a telemetria ativa do lote. A validade do ensaio exige no mínimo **285 tablets ativos, identificados nominalmente e telemetrizados**.
2.  **Preparação das Salas**: 5 salas de 60 tablets cada (ou conforme proporção do local).
3.  **Janela de Handshake**: Disparo coordenado para que os 60 handshakes de cada sala ocorram em no máximo 20 segundos.
4.  **Monitoramento Regional**: Acompanhar o painel de telemetria em tempo real para detectar cauda de latência (**P95**).
5.  **Checkpoint Final**: Validar se houve perda de identificação nominal em algum dispositivo.

## 4. Gate 2 — Resiliência & Watchdog (Execução Auditável)

Este teste valida a robustez do sistema em falhas críticas de infraestrutura.

1.  **Seleção da Sala**: Selecionar previamente a sala de maior densidade prevista ou de maior risco geométrico estimado, conforme registro pré-ensaio.
2.  **Queda Controlada**: Após a estabilização e registro do Gate 1, forçar a interrupção controlada de 1 gateway primário da sala selecionada.
3.  **Registro de Timestamps**:
    -   `T0`: Timestamp da queda do gateway.
    -   `T1`: Timestamp do início de recuperação (Watchdog disparado).
    -   `T2`: Timestamp da recuperação funcional plena.
4.  **Evidência Obrigatória**:
    -   ID da sala testada.
    -   Log de eventos do sistema.
    -   Captura de tela do painel regional (Pós-queda).
    -   Observação nominal de impacto operacional no lote da sala.
5.  **Critério**: **Recovery (T2 - T0) < 15s**, sem perda de rastreabilidade ou necessidade de intervenção manual.

## 5. Indicadores Obrigatórios
O resultado deste runbook deve ser alimentado no Relatório de Evidência, contendo:
-   **P95** global < 3m15s.
-   **P95** por sala.
-   **Zero latências acima de 3m28s**.
-   **Máximo 1 latência acima de 3m25s por sala**.

## 6. Referências
-   [VEREDITO_ESTRATEGICO_R4C_POA.md](./VEREDITO_ESTRATEGICO_R4C_POA.md)
-   [RELATORIO_EVIDENCIA_MOCK_SECO_R4C_POA.md](./RELATORIO_EVIDENCIA_MOCK_SECO_R4C_POA.md)

---
**Execução**: Equipe Regional POA | Coordenação Authority Pilot
