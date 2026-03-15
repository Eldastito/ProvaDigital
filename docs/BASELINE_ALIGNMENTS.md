# Alinhamentos Monitorados (Baseline de Governança)

Este documento registra recursos onde o sistema legado e o novo Core estão em total conformidade. Monitoramos estes pontos para garantir que mudanças no Core não introduzam regressões em fluxos que já funcionam bem.

| Perfil | Superfície | Recurso | Ação | Status |
| :--- | :--- | :--- | :--- | :--- |
| Aluno | ProtectedRoute | item_bank | view | MONITORANDO |
| Professor | ProtectedRoute | turmas | view | MONITORANDO |
| Gestor | Sidebar | dash_pedagogico | view | MONITORANDO |

---
**Legenda**:
- **MONITORANDO**: Comportamento alinhado e estável.
- **ALERTA**: Caso ocorra uma divergência súbita em um ponto de baseline, deve ser tratada como **BUG_MAPEAMENTO**.
