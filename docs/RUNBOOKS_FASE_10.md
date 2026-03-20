# Runbooks Operacionais — Authority Pilot (Fase 10)

## 🎯 SLOs (Service Level Objectives)
| Objetivo | SLI (Indicador) | Meta |
| :--- | :--- | :--- |
| **Mesh Availability** | `handshake_success / total` | >= 99% |
| **Sync Integrity** | `sync_failure_count` | < 1% |
| **Privacy Security** | `unauthorized_reveal_attempts` | 0 |
| **Export Delivery** | `items_in_dlq / total_exported` | < 0.5% |

---

## 🚨 Alertas P0 (Ação Imediata)

### [P0] MESH_DOWN_MASSIVE
- **Sintoma**: Taxa de falha de Handshake > 20% em 5 min.
- **Impacto**: Dispositivos não conseguem parear em campo.
- **Ação**: 
  1. Verificar `pilot_mesh_handshake_total` por `peer_id`.
  2. Validar permissões de rádio no Android (Checklist 9.2b).
  3. Checar integridade de chaves públicas no `PilotMeshService`.

### [P0] PRIVACY_BREACH_SUSPECT
- **Sintoma**: Acesso PII por papel não autorizado ou pico súbito.
- **Impacto**: Exposição de dados sensíveis educacionais.
- **Ação**: 
  1. Identificar `user_id` e `tenant_id` no log de telemetria.
  2. Revogar sessão do peer se possível via MDM.
  3. Auditar trilha de `REVEAL_PII` em `governanceService`.

---

## ⚠️ Alertas P1 (Resposta Rápida)

### [P1] DLQ_GROWTH_PERSISTENT
- **Sintoma**: Entrada contínua de itens na DLQ por 10 min.
- **Impacto**: Atraso na interoperabilidade de dados.
- **Ação**: 
  1. Inspecionar erros dominantes no `pilotOutboxService`.
  2. Validar versão de contrato (V1) e adapters.
  3. Executar redrive manual se for falha transitória.
