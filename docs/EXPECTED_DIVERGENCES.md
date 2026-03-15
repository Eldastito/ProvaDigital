# Registro de Divergências Esperadas (Shadow Mode)

Este documento cataloga as divergências já identificadas e aceitas entre o sistema legado e o novo Core Governance.

| Perfil | Superfície | Recurso | Ação | Decisão Legado | Decisão Core | Motivo | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Professor | Sidebar | analytics | view | DENY | ALLOW | Core permite analytics básico da unidade; legado restringe por role simples | CALIBRANDO |
| Diretor | API | system_mgmt | manage | ALLOW | DENY | Core bloqueia gestão sistêmica para diretor; legado tem permissão solta | ACEITA_CORE_CORRETO |
| Pais | ProtectedRoute | student_data | view | ALLOW | DENY | **CRITICAL**: Legado permite acesso cross-school indevido p/ pais. Core bloqueia. | RISCO_LEGADO_IDENTIFICADO |

---
**Legenda de Status**:
- **CALIBRANDO**: Divergência sob análise de produto.
- **ACEITA_CORE_CORRETO**: O novo Core está certo, o legado expõe risco ou está desatualizado.
- **BUG_MAPEAMENTO**: Erro que precisa de correção técnica no Core.
- **RISCO_LEGADO_IDENTIFICADO**: O legado permite algo perigoso que o Core agora bloqueia.
- **MONITORANDO**: Comportamento esperado e alinhado.
