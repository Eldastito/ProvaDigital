# Índice de Evidências de Validação: Ciclo de Redundância Operacional (E1+E2+E3)

Este documento centraliza os pontos de prova técnica gerados durante o desenvolvimento e auditoria das fases de redundância.

---

## 📡 Evidências de Emissão e Redundância (E1, E2, E3)

### 1. Presença BLE (Fase 1)
- **Local**: `RunnerActivity.kt` -> Métodos `getBleLastSeen()` e `getBleTimeout()`.
- **Prova**: O serviço `nativeBridgeService.ts` consome estes valores e retorna `present: boolean` baseado no skew tolerado.

### 2. Double-Write SQLite (Fase 2)
- **Caminho**: `ExamDatabaseHelper.kt` -> Método `saveAnswer`.
- **Evidência de Schema**: Tabela `student_answers` possui colunas `exam_id`, `student_id`, `request_id`, `saved_at`.
- **Prova de UX**: O log `⚠️ Double-Write failed` foi validado em cenário de bloqueio de DB. A UI não travou.

### 3. UDP Mesh Protected (Fase 3)
- **Padrão**: AES-GCM-256 (Criptografia Autenticada).
- **Prova de Emissão**: O envelope JSON externo não possui PII. O logcat confirma `📡 Mesh Protected Broadcast`.
- **Prova de Recepção**: O script [mesh_audit_listener.js](../android/mesh_audit_listener.js) decifra e valida o AAD (`pv|rid|ts|src`) com sucesso.

---

## 🛠️ Matriz de Testes de Segurança (Fase 3)

| Cenário | Resultado Esperado | Validação |
| :--- | :--- | :--- |
| **Integridade de Tag** | Rejeição em caso de alteração no `ct`. | **SUCESSO** (Tag Mismatch). |
| **Proteção contra Replay** | Rejeição por `ts` vencido (> 60s). | **SUCESSO** (Timestamp Expirado). |
| **Deduplicação de RID** | Ignorar duplicados no mesmo ciclo. | **SUCESSO** (ID Já Processado). |
| **Isolamento de Erro** | Falha de socket não afeta UX. | **SUCESSO** (Catch no TS). |

---
*Assinado: Auditoria Técnica de Resiliência.*
