# Abertura Formal: Fase 5 — Mutações Controladas (Escrita Autorizada)

## 🎯 1. Objetivo
Provar que o **Authority Pilot** possui autoridade positiva para permitir escritas (mutações) de forma segura, mantendo o isolamento cross-tenant e garantindo auditabilidade total e reversibilidade.

## 🛡️ 2. Guardrails Iniciais (Regras de Ouro)
1. **Diferenciação Semântica**: Criar flag dedicada `authority_pilot_writes_enabled` (apartada do RO).
2. **Escopo Mínimo**: Apenas `CREATE` em recursos não críticos.
3. **Audit Trail**: Gravação obrigatória de `reason_code` e `correlation_id` para cada mutação autorizada.
4. **Rollback Nativo**: Toda escrita de teste deve ser reversível via soft-delete ou expurgo controlado.

## 🏗️ 3. Primeiro Recurso Alvo: `PilotExecutionLog`
Para evitar riscos a dados pedagógicos ou institucionais, a Fase 5 iniciará com um novo recurso técnico:
- **Nome**: `PilotExecutionLog`
- **Ações**: `CREATE`
- **Características**: Append-only, tenant-scoped, sem impacto acadêmico.

## 📊 4. Matriz de Autorização (Step 1)
| Recurso | Ação | Contexto | Decisão Pilot | Audit Code |
| :--- | :--- | :--- | :--- | :--- |
| `PilotExecutionLog` | `CREATE` | Local Tenant | **ALLOW** | `PILOT_CONTROLLED_CREATE_OK` |
| `InstitutionalMetadata` | `EDIT` | Any | **DENY** | `PILOT_WRITES_DISABLED_FOR_RESOURCE` |
| Any | `CREATE` | Cross-Tenant | **BLOCK** | `PILOT_CROSS_ORG_MUTATION_BLOCKED` |

## 🏁 5. Critérios de GO/NO-GO
- **GO**: Sucesso em 100% dos `CREATE` autorizados; integridade de isolamento cross-tenant mantida.
- **NO-GO**: Qualquer escrita não autorizada ou escape de mutação em recursos críticos.
