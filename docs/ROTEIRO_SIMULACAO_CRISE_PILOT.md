# Roteiro de Simulação de Crise (War Game) — Authority Pilot

## 🎯 Objetivo
Validar a capacidade de resposta da equipe operacional (DPI, SRE, Ops) diante de incidentes críticos em campo, utilizando exclusivamente a Torre de Controle e os Runbooks.

---

## 🎭 Cenário 1: "Apagão na Escola" (Queda de Mesh P0)
**Contexto**: Início da aplicação da prova. Múltiplos tablets de alunos não conseguem parear com o dispositivo do Professor.
- **Trigger**: Injeção de > 30% `pilot_mesh_handshake_total{status="failure"}`.
- **Alerta Esperado**: `[P0] MESH_DOWN_MASSIVE`.
- **Objetivo do Operador**:
  1. Identificar se a falha é em uma sala ou em toda a escola (Drill-down).
  2. Consultar Runbook P0 Mesh.
  3. Decidir: Reiniciar Malha ou Abortar Operação (Rollback).

## 🎭 Cenário 2: "Infiltração Suspeita" (Quebra de Privacidade P0)
**Contexto**: Prova em andamento. Alertas indicam revelação de nomes de alunos em volume anormal.
- **Trigger**: Injeção de pico em `pilot_pii_reveal_total`.
- **Alerta Esperado**: `[P0] PRIVACY_BREACH_SUSPECT`.
- **Objetivo do Operador**:
  1. Localizar o `user_id` e o `peer_role` do autor.
  2. Verificar se existe justificativa pedagógica no log.
  3. Acionar o DPI para bloqueio imediato ou investigação forense.

## 🎭 Cenário 3: "Atraso Fantasma" (Stall de Outbox P1)
**Contexto**: Final da prova. Os dados das salas chegam à malha, mas não saem para o sistema central.
- **Trigger**: Incrementar backlog de outbox sem drenagem.
- **Alerta Esperado**: `[P1] DLQ_GROWTH_PERSISTENT`.
- **Objetivo do Operador**:
  1. Identificar o item "Oldest Pending".
  2. Verificar erro dominante (Contract vs Transport).
  3. Executar o protocolo de Redrive ou Reprocessamento.

---

## ⏱️ Métricas de Sucesso
- **MTTD (Detect)**: < 2 minutos para alertas P0.
- **Clareza de Decisão**: Sem hesitação sobre quem tem autoridade para Rollback.
- **Fidelidade ao Runbook**: 100% dos passos seguidos sem improviso crítico.
