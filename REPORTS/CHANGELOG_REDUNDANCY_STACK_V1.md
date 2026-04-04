# Changelog: Ciclo de Redundância Operacional (E1+E2+E3)

Histórico técnico do desenvolvimento das camadas de resiliência e integridade para o sistema Prova Digital.

---

## [v1.0.0-redundancy-closure] - 2026-04-03

> [!CAUTION]
> **FECHAMENTO COM RESSALVAS**: Este ciclo está fechado para implementação, mas possui limitações técnicas e riscos de segurança conhecidos. Antes de homologar, consulte: [KNOWN_LIMITATIONS_AND_RISKS.md](./KNOWN_LIMITATIONS_AND_RISKS.md).

### ✅ Fase 1 (E1): BLE Presence Bridge
- **Adição**: Getters públicos `getBleLastSeen()` e `getBleTimeout()` na `RunnerActivity`.
- **Adição**: Método `getBLEPresence` no `NativeOperationsPlugin`.
- **Adição**: Serviço `nativeBridgeService.ts` com cálculo de presença e fail-safe para Web.

### ✅ Fase 2 (E2): Double-Write SQLite
- **Alteração**: Schema SQLite elevado para V2 com suporte a contexto (`exam_id`, `student_id`).
- **Adição**: Colunas `request_id`, `saved_at`, `is_synced` na tabela `student_answers`.
- **Alteração**: Método `saveAnswer` agora utiliza lógica de **UPSERT** com `ON CONFLICT(question_id)`.
- **Adição**: Integração do disparo persistente no hook `useStudentSession.ts`.

### ✅ Fase 3 (E3): UDP/Mesh Redundancy
- **Adição**: Criptografia Autenticada **AES-GCM-256** no `NativeOperationsPlugin` (Kotlin).
- **Adição**: Inclusão de **AAD** (Additional Authenticated Data) para autenticação de metadados críticos (`rid`, `ts`, `src`).
- **Adição**: Provisionamento de **App UUID** (Persistente em SharedPreferences).
- **Adição**: Método `broadcastNativeAnswer` com emissão UDP imediata e protegida (Best-Effort).
- **Adição**: Script de Auditoria [mesh_audit_listener.js](../android/mesh_audit_listener.js).

---
*Fim do Ciclo de Redundância v1.*
