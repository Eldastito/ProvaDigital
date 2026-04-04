# Checklist Operacional: Onda 1 — Laboratório Realista

Este checklist guia a execução técnica da primeira onda de homologação do Ciclo de Redundância (E1+E2+E3).

---

## 📋 Configuração de Teste (Lote Mínimo)
- **Dispositivos Aluno**: 2 a 4 Tablets.
- **Dispositivo Monitor**: 1 Notebook/Tablet com `node mesh_audit_listener.js`.
- **Ambiente**: Rede Local (Wi-Fi) sem acesso externo (Simulação de contingência).

---

## 🛠️ Etapa 0: Pré-Flight
- [ ] Build `redundancy-stack-v1-closure` instalado.
- [ ] SQLite V2 inicializado (Verificar logs de migração).
- [ ] Feature Flags: `BLE_BRIDGE=true`, `SQL_DOUBLE_WRITE=true`, `UDP_MESH=true`.
- [ ] Listener `mesh_audit_listener.js` ativo na porta 8888.
- [ ] Horários sincronizados (Skew < 5s).

---

## 🏃 Etapa 1: Fluxo Nominal
**Cenário**: Responder 3 questões normalmente.
- [ ] **Ação**: Aluno seleciona resposta e avança.
- [ ] **Esperado**: 
    1. IndexedDB atualizado.
    2. SQLite: Registro inserido/atualizado (Logcat `✅ SQLite Save`).
    3. UDP: Pacote emitido (Logcat `📡 Mesh Protected Broadcast`).
    4. Listener: Decriptação OK (`✅ [AUDITORIA OK]`).
- [ ] **UX**: Transição de tela instantânea.

---

## 💥 Etapa 2: Falha Induzida E2 (SQLite)
**Cenário**: Simular base de dados travada ou erro de escrita.
- [ ] **Ação**: Injetar `throw` no `ExamDatabaseHelper.saveAnswer` (Simulado via interrupção de processo ou lock manual se possível).
- [ ] **Esperado**:
    1. Logcat exibe `⚠️ Double-Write failed: SQLITE_ERROR`.
    2. Aluno **NÃO** percebe lentidão.
    3. IndexedDB **SALVA** com sucesso.
    4. Prova prossegue normalmente.

---

## 📶 Etapa 3: Falha Induzida E3 (UDP/Rede)
**Cenário**: Simular Wi-Fi desligado ou porta bloqueada.
- [ ] **Ação**: Desativar Wi-Fi do tablet.
- [ ] **Esperado**:
    1. Logcat exibe `⚠️ Mesh Broadcast failed` ou erro de socket.
    2. SQLite **CONTINUA** salvando localmente.
    3. Prova prossegue sem "engasgos" na UI.

---

## 🛡️ Etapa 4: Segurança e Integridade E3
**Cenário**: Teste de integridade do protocolo AEAD.
- [ ] **Ação (Adulteração)**: Modificar 1 caractere do campo `ct` no listener interceptado (Simulado).
- [ ] **Esperado**: Listener exibe `❌ [REJEIÇÃO CRÍTICA] Tag Mismatch`.
- [ ] **Ação (Replay)**: Reenviar pacote com `rid` já processado.
- [ ] **Esperado**: Listener exibe `Deduplicando RID`.
- [ ] **Ação (Expiração)**: Enviar pacote com `ts` > 60s de atraso.
- [ ] **Esperado**: Listener exibe `Timestamp Expirado`.

---

## 📡 Etapa 5: BLE Realista
**Cenário**: Afastamento do sinal BLE do monitor.
- [ ] **Ação**: Desligar Beacon BLE ou afastar dispositivo.
- [ ] **Esperado**: `getBLEPresence` retorna `present: false` após o timeout configurado (~30s).

---

## 🏁 Critério de Encerramento (Onda 1)
- **Status GO**: 100% dos fluxos nominais ok E falhas induzidas isoladas com sucesso.
- **Status NO-GO**: Qualquer perda de resposta no IndexedDB ou travamento de UI (White Screen).
