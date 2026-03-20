# Abertura Formal: Fase 6 — Consolidação de Atributos e Hardening

## 🎯 1. Objetivo
Evoluir a maturidade do Pilot de "Escrita Mínima/Criação" para **"Escrita Evolutiva/Edição"**. O foco é permitir o UPDATE de atributos específicos em entidades funcionais draft, mantendo o isolamento total e o controle de efeitos colaterais.

## 🛡️ 2. Guardrails da Fase 6
1. **Atributo-Nível Whitelist**: A edição só será permitida para campos técnicos/descritivos whitelisted.
2. **Imutabilidade Operacional**: Nenhuma mutação de atributo poderá disparar side-effects no legado (ex: publicação, notificações).
3. **FAIL-CLOSED Cross-Tenant**: O isolamento organizacional continua sendo a regra de ouro em mutações.
4. **Audit Trail Reforçado**: Cada UPDATE deve registrar o valor anterior, o novo valor e o `reason_code`.

## 🏗️ 3. Step 1: UPDATE Controlled (PilotTestSessionDraft)
- **Recurso Alvo**: `PilotTestSessionDraft`
- **Atributos Whitelisted**: `name`, `description`, `intended_date`.
- **Atributo Sensível (Bloqueado)**: `status` (Transição para `active` proibida nesta fase).
- **Ação**: `UPDATE`

## 📊 4. Matriz de Autorização (Proposta)
| Recurso                 | Ação     | Atributo             | Decisão   | Reason Code                        |
| :---------------------- | :------- | :------------------- | :-------- | :--------------------------------- |
| `PilotTestSessionDraft` | `UPDATE` | `name`               | **ALLOW** | `PILOT_ATTRIBUTE_UPDATE_OK`        |
| `PilotTestSessionDraft` | `UPDATE` | `description`        | **ALLOW** | `PILOT_ATTRIBUTE_UPDATE_OK`        |
| `PilotTestSessionDraft` | `UPDATE` | `intended_date`      | **ALLOW** | `PILOT_ATTRIBUTE_UPDATE_OK`        |
| `PilotTestSessionDraft` | `UPDATE` | `status`             | **DENY**  | `PILOT_STATUS_TRANSITION_BLOCKED`  |
| `PilotTestSessionDraft` | `UPDATE` | qualquer outro campo | **DENY**  | `PILOT_ATTRIBUTE_OUT_OF_SCOPE`     |
| qualquer recurso        | `DELETE` | `*`                  | **DENY**  | `PILOT_MUTATION_OUT_OF_SCOPE`      |
| qualquer recurso        | mutação  | cross-tenant         | **BLOCK** | `PILOT_CROSS_ORG_MUTATION_BLOCKED` |

## ✅ 5. Critérios de GO
- Sucesso em UPDATE de atributo whitelisted.
- Bloqueio imediato para tentativa de UPDATE em atributo restrito.
- Zero delegação indevida ao legado (`Mutation Delegation = 0`).
- Audit trail registrando o delta de mudança.
- Rollback por lote revertendo atributos.
