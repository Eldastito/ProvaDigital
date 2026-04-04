# Roteiro Operacional: Onda 3 — Estresse e Carga Máxima

Este roteiro detalha a execução do ensaio de estresse do Ciclo de Redundância, visando validar a robustez do sistema sob carga sincronizada e falhas induzidas.

---

## 📋 Definições de Governança
- **Definição de Evento**: 1 salvamento = 1 Persistência no IndexedDB + 1 Tentativa SQLite + 1 Emissão Mesh (UDP).
- **Escala**: 12 Dispositivos ativos.
- **Volume Total**: 60 Eventos Planejados.
- **Logica de Auditoria**: Registrar separadamente **Eventos Planejados** vs **Eventos Executados**. Caso 3B.3 seja bloqueada pelo gate de 3B.1/2, registrar explicitamente o motivo.
- **Cadência de Burst**:
    - **Intervalo**: 20 segundos entre cada burst.
    - **Sincronização**: Os 12 dispositivos devem disparar o salvamento dentro de uma janela de 3 segundos em cada rodada.

---

## 🌊 Sub-Fases da Onda 3

### Onda 3A: Carga Nominal Sincronizada
**Objetivo**: Validar a concorrência pura sem falhas externas.
- **Execução**: 2 rodadas de salvamento nominal nos 12 dispositivos.
- **Métrica**: Contagem bruta. Meta de recepção Mesh: Alvo observacional (Referência Onda 2: 86,1%).
- **Regra de Aceite Mesh**:
    - **60% ou mais**: 🟢 Elegível a GO, conforme demais critérios.
    - **50% a 60%**: 🟡 GO CONDICIONADO.
    - **Abaixo de 50%**: 🔴 NO-GO.

### Onda 3B: Instabilidade sob Carga (Falhas Induzidas)
**Regra**: Executar 3B.3 apenas se 3B.1 e 3B.2 terminarem com status **🟢 GO**.

- **3B.1 (Falha Local)**: Induzir `E2_SQLITE_LOCKED` em 3 dispositivos aleatórios durante o Burst #1.
- **3B.2 (Falha de Rede)**: Induzir `E3_SOCKET_ERROR` (desligar Wi-Fi) em 3 dispositivos aleatórios durante o Burst #2.
- **3B.3 (Falha Combinada)**: Induzir falha total (E2 + E3) em 2 dispositivos durante o Burst #3.

### Onda 3C: Segurança e Integridade sob Carga
- **Execução**: Injetar Replays e Clock Skews (+90s) durante a rodada de carga de segurança.
- **Sub-testes Obrigatórios**:
    - **3C.1**: Clock Skew inválido (+90s).
    - **3C.2**: Duplicate RID (Mesma janela de 60s).
    - **3C.3**: Replay real (Fora da janela de 60s).
- **Objetivo**: Verificar se o listener isola corretamente cada causa de rejeição E3.

---

## 🛑 Critérios de Parada Imediata (NO-GO)
A prova de estresse será interrompida imediatamente se:
1. **Perda Primária**: Qualquer resposta não for encontrada no **IndexedDB**.
2. **UX Crítica**: Travamento de UI (White Screen) ou congelamento > 500ms.
3. **Integridade**: Ocorrência de `Tag Mismatch` em pacote Mesh válido (Falha criptográfica).
4. **Governança**: Quebra de rastreabilidade ou IDs colididos.

---

## 📊 Insumos para a Fase 4 (UI de Monitoramento)
Ao final da sessão, o operador deve classificar:
- Quais alertas de erro foram estatisticamente irrelevantes (Logs).
- Quais incidentes (Ex: `E2_SQLITE_LOCKED`) exigem notificação visual imediata no dashboard.
- Quais métricas de "Saúde da Malha" (Taxa de recepção bruta) valem a exibição em tempo real.

---
*Assinado: AI Dev Assistant - Detalhamento de Estresse (Onda 3).*
