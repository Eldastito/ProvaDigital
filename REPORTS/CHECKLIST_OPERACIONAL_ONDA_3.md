# Checklist Operacional: Onda 3 — Estresse e Carga Máxima (E1+E2+E3)

Este checklist guia a execução técnica da terceira onda de homologação, com foco em auditabilidade bruta e resiliência sob carga máxima.

---

## 📋 Configuração de Teste (Célula de Estresse)
- [ ] **Lote Operacional**: 12 Tablets sincronizados.
- [ ] **Monitoramento**: Android Studio Profiler (Diagnóstico Complementar).
- [ ] **Scripts**: Listener Auditor Mesh pronto para rajada.
- [ ] **Cadência**: 5 Bursts com intervalo de 20 segundos entre cada.

---

## 📊 Tabela Bruta de Auditoria (Obrigatória)

| Camada | Métrica | Valor Planejado | Valor Executado | Resultado (Confirmado) |
| :--- | :--- | :--- | :--- | :--- |
| **Pura** | Total de Eventos | 60 | | | [Motivo se < 60] |
| **E1** | Presença BLE | Perene | | | |
| **E2** | Tentativas SQLite | 60 | | | |
| **E2** | Falhas `LOCKED` | Injetadas (3B.1)| | | |
| **E3** | Emissões Mesh | 60 | | | |
| **E3** | Recepções Válidas| Alvo Obs. | | | (Ref: 86,1%) |
| **E3** | `E3_CLOCK_SKEW` | Injetadas (3C.1) | | |
| **E3** | `E3_DUPLICATE_RID`| Injetadas (3C.2) | | |
| **E3** | `E3_REPLAY_REJ` | Injetadas (3C.3) | | |
| **UX** | Respostas IDB | 60 | | |

---

## 🚀 Checklist de Rodadas (3A / 3B / 3C)

- [ ] **Etapa 1 (3A - Carga Pura)**: 24 salvamentos em 2 rodadas sincronizadas.
- [ ] **Etapa 2 (3B.1 - Falha E2)**: Injetar `E2_SQLITE_LOCKED` em 3 dispositivos (12 eventos totais da rodada).
- [ ] **Etapa 3 (3B.2 - Falha E3)**: Injetar `E3_SOCKET_ERROR` em 3 dispositivos (12 eventos totais da rodada).
- [ ] **Etapa 4 (3B.3 - Falha Combinada)**: Injetar E2+E3 em 2 dispositivos (6 eventos totais da rodada).
- [ ] **Etapa 5 (3C.1 - Clock Skew)**: Inverter hora de dispositivo (+90s).
- [ ] **Etapa 6 (3C.2 - Duplicate RID)**: Reenviar mesmo pacote na janela válida.
- [ ] **Etapa 7 (3C.3 - Replay)**: Reenviar pacote fora da janela de 60s.

---

## 🏁 Veredito Final da Onda 3

### 🟢 GO
- 60 respostas salvas no IndexedDB (Zero Perda).
- Zero travamentos ou White Screens de UI.
- 100% de rastreabilidade (RID) em todos os logs.
- Taxa de recepção Mesh em estresse **≥ 60%**.
- Falhas locais (E2 e E3) isoladas sem contaminação do grupo.

### 🟡 GO CONDICIONADO
- Resiliência principal (IDB) mantida.
- Taxa de recepção Mesh em estresse entre **50% e 60%**.
- Incidentes não críticos documentados e isolados.

### 🔴 NO-GO
- **BLOQUEIO IMEDIATO**: Perda no IndexedDB, Travamento de UI, Tag Mismatch ou incapacidade de diagnóstico.
- Taxa de recepção Mesh **abaixo de 50%** (Salvo justificativa operacional aprovada).

---
*Assinado: AI Dev Assistant - Auditoria de Estresse (Oonda 3).*
