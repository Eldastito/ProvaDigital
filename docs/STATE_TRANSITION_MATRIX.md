# FORGE Session State Transition Matrix (Phase 2)

Este documento define as regras canônicas de transição de estado para sessões de estudante na plataforma FORGE, servindo como especificação para o `sessionIsolationService.ts` e base para as provas de integridade (`TEST-CB-STATE-001`).

---

## 1. Tabela de Transições Permitidas

| Estado Atual | Evento | Próximo Estado | Autoridade (Fluxo) | Atualiza Ponteiro | Controle de Versão |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `void` (Novo) | `startSession` (Novo) | `ACTIVE` | Início de Avaliação | **Sim** | Inicial (v1) |
| `ACTIVE` | `startSession` (Supersede) | `SUPERSEDED` | Re-alocação/Reentrada | **Sim** | Obrigatório (+1) |
| `ACTIVE` | `finishSession` | `COMPLETED` | Submissão Confirmada | **Limpa/Null** | Obrigatório (+1) |
| `ACTIVE` | `killSwitch` | `ABORTED` | Comando de Segurança (Admin) | **Limpa** | Obrigatório (+1) |
| `ACTIVE` | `fatalOperationalError` | `ABORTED` | Falha Sistêmica Grave | **Limpa** | Obrigatório (+1) |
| `ACTIVE` | `coldBoot` (Idêntico) | `ACTIVE` | Recuperação determinística por ponteiro canônico | Não | Opcional (v=v) |
| `COMPLETED` | `coldBoot` | `COMPLETED` | Visualização de Recibo | Não | N/A |
| `SUPERSEDED` | `coldBoot` | `SUPERSEDED` | Auditoria Histórica | Não | N/A |

---

## 2. Transições Proibidas (Regras de Integridade)

| De | Para | Motivo da Proibição |
| :--- | :--- | :--- |
| `COMPLETED` | `ACTIVE` | Uma tentativa finalizada não pode ser reaberta sem novo `attemptId`. |
| `SUPERSEDED` | `ACTIVE` | Uma tentativa substituída por uma mais nova é considerada "stale". |
| `ABORTED` | `ACTIVE` | Sessões abortadas por segurança exigem novo handshake/requestId. |
| `void` | `COMPLETED` | Não é possível completar uma sessão que nunca foi iniciada como `ACTIVE`. |

---

## 3. Lógica de Autoridade e Ponteiro

### 3.1 Autoridade de Início
Apenas o componente `IdentityVerify` ou o comando central de `StartExam` tem autoridade para disparar o evento que cria um estado `ACTIVE` e atualiza o ponteiro de contexto.

### 3.2 Atualização do Ponteiro (`context:*:active`)
O ponteiro de contexto **DEVE** sempre apontar para a versão `ACTIVE` mais recente. 
- Quando um novo `ACTIVE` é criado para um contexto já ocupado, a sessão anterior **PRECISA** transicionar para `SUPERSEDED` antes do ponteiro ser movido.
- A transição `supersededByAttemptId` deve ser preenchida para manter a cadeia de custódia.

---

## 4. Controle de Idempotência (`requestId`)
Cada transição de `void -> ACTIVE` deve estar vinculada a um `requestId` único gerado no momento do desafio de identidade.
- Repetições do mesmo `requestId` no mesmo ciclo de vida não geram nova versão, apenas retornam a instância `ACTIVE` existente.

---
**Documento de Referência Técnica**: `sessionIsolationService.ts`  
**Data**: 29/03/2026  
**Status**: Canônico (Fase 2)
