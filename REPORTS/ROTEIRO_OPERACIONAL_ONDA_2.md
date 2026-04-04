# Roteiro Operacional: Onda 2 — Sala Real Pequena

Este roteiro define a execução técnica da segunda onda de homologação, focando em ruído ambiental, concorrência mesh e rastreabilidade em escala reduzida (6-12 dispositivos).

---

## 📋 Configuração de Teste
- **Dispositivos Aluno**: 6 a 12 Tablets.
- **Dispositivo Monitor**: 1 Notebook/Tablet (Listener Auditor).
- **Ambiente**: Sala de aula real (com obstáculos e movimentação).
- **Rede**: Wi-Fi Local (Simulação de contingência).

---

## 🚦 Critérios de Avanço (Onda 2)

O avanço para a Onda 3 (Estresse) depende do cumprimento integral destes critérios:

### 🟢 GO
- 100% de persistência no IndexedDB em todos os dispositivos.
- Taxa de recepção Mesh > 80% (Amostragem auditável).
- Nenhuma falha crítica de decriptação (`E3_DECRYPTION_ERROR`).
- Rastreabilidade total via RID completo em 100% dos incidentes registrados.
- Ruído BLE (`E1_BLE_FALSE_TOGGLE`) inferior a 5% do tempo de sessão (Critério de aprovação).
- Observação: Ruído entre 5% e 10% é aceitável apenas como faixa de observação.

### 🟡 GO CONDICIONADO
- Sistema estável, mas com perdas Mesh > 20% devido a interferência física.
- Incidentes não críticos documentados e rastreados por RID.
- UX fluida, apesar de atrasos pontuais no double-write nativo.

### 🔴 NO-GO
- Qualquer perda de resposta ou travamento de UI.
- Falha sistemática de emissão ou recepção protegida.
- Impossibilidade de correlacionar eventos via Logs/RID.

---

## 🏃 Cenários de Execução

### Cenário A: Fluxo Nominal Multi-Device
**Objetivo**: Validar a concorrência de escrita e emissão.
- **Ação**: Iniciar prova em 12 dispositivos simultaneamente.
- **Métrica**: Coletar observação de UX e logs de conclusão de salvamento (P95 não auditável via Logcat nesta versão).

### Cenário B: BLE com Interferência Física
**Objetivo**: Medir falsos positivos em ambiente com movimento.
- **Ação**: Operador se movimenta entre os candidatos.
- **Métrica**: Contagem de eventos `E1_BLE_FALSE_TOGGLE`.

### Cenário C: Concorrência Mesh (UDP)
**Objetivo**: Verificar colisão e perda de pacotes em rajada.
- **Ação**: Todos os alunos salvam respostas ao mesmo tempo (Sincronizado).
- **Métrica**: Taxa de pacotes recebidos vs. emitidos (Via Listener).

### Cenário D: Falha Isolada (Contenção)
**Objetivo**: Provar que erro em 1 nó não contamina a rede.
- **Ação**: Forçar `E2_SQLITE_LOCKED` em apenas 1 tablet.
- **Métrica**: Verificar se os outros 11 continuam operando e emitindo normalmente.

### Cenário E1: Clock Skew Controlado
**Objetivo**: Validar a rejeição de pacotes com data/hora incompatíveis (Skew).
- **Ação**: Alterar relógio de 1 tablet para +90s.
- **Métrica**: Confirmar rejeição por `E3_CLOCK_SKEW_INVALID` no Listener.

### Cenário E2: Replay e Deduplicação
**Objetivo**: Validar o descarte de pacotes repetidos ou vencidos por reenvio.
- **Ação**: Capturar um RID válido e reenviar o mesmo pacote via ferramenta de rede.
- **Métrica**: Confirmar descarte por `E3_REPLAY_REJECTED` ou `E3_DUPLICATE_RID`.

---

## 📝 Coleta de Evidências (Template de Sala)

Para cada incidente ou amostragem, use:
- **RID**: [Full-UUID]
- **UUID**: [Device-App-UUID]
- **Código**: [Ex: E3_SOCKET_ERROR]
- **Latência Observada**: [Tempo percebido / Não auditada via Logcat]
- **Status**: [GO / NO-GO]

---
*Assinado: AI Dev Assistant - Planejamento de Campo (Onda 2).*
