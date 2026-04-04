# Checklist Operacional: Onda 2 — Sala Real Pequena (Versão Final)

Este checklist guia a execução técnica da segunda onda de homologação do Ciclo de Redundância (E1+E2+E3) em ambiente de sala real.

---

## 📋 Configuração de Teste
- [ ] **Lote Operacional**: 6 a 12 Tablets.
- [ ] **Listener Auditor**: Ativo e visível na rede local.
- [ ] **App UUIDs**: Previamente anotados para cada dispositivo.
- [ ] **Relógio de Referência**: Sincronizado conforme o monitor.

---

## 🚀 Etapa 1: Fluxo Nominal em Escala
**Objetivo**: Validar persistência tripla com carga leve.
- [ ] **Ação**: Iniciar prova simultânea em 12 dispositivos. Responder 3 questões por dispositivo.
- [ ] **Esperado**:
    - [ ] SQLite: Gravando (Logcat `✅ SQLite Save`).
    - [ ] Mesh: Emitindo (Logcat `📡 Mesh Protected`).
    - [ ] Listener: Decriptando (Audit `✅ [AUDITORIA OK]`).
- [ ] **Fato Operacional**: Latência de salvamento percebida pelo aluno é < 200ms (Observação de UX).

---

## 📡 Etapa 2: Estabilidade BLE
**Objetivo**: Identificar ruído ambiental.
- [ ] **Ação**: Operador caminha entre os tablets com o dispositivo monitor.
- [ ] **Esperado**: `present` permanece `true` enquanto o monitor está na sala.
- [ ] **Registro**: Reportar qualquer `E1_BLE_FALSE_TOGGLE` ocorrido sem motivo físico (Limite de aprovação: 5% de tempo de ruído).

---

## 💥 Etapa 3: Falha e Contenção (E2)
- [ ] **Ação**: Simular `E2_SQLITE_LOCKED` em **apenas 1** dispositivo.
- [ ] **Esperado**: 
    - [ ] Este dispositivo falha silenciosamente e preserva o IndexedDB.
    - [ ] Os outros 11 dispositivos operam/emitem SEM interferência.

---

## 🛡️ Etapa 4: Segurança E3 (Skew & Replay)
- [ ] **Ação E3.1 (Clock Skew)**: Alterar hora de 1 dispositivo para +90s e salvar resposta.
- [ ] **Esperado**: Listener rejeita com código `E3_CLOCK_SKEW_INVALID`.
- [ ] **Ação E3.2 (Replay)**: Capturar um pacote UDP válido no listener e reenviar via ferramenta de rede.
- [ ] **Esperado**: Listener rejeita com `E3_DUPLICATE_RID` (mesma janela) ou `E3_REPLAY_REJECTED` (fora da janela).

---

## 🏁 Critérios de Saída (Onda 2)
- [ ] **GO**: Fluxo estável, RIDs rastreáveis, 0% perda no IndexedDB.
- [ ] **NO-GO**: Travamento, perda de resposta ou falha sistemática de decriptação.

---
*Assinado: AI Dev Assistant - Protocolo Finalizado.*
