# Plano de Monitoramento Controlado: Rerun R4C POA (Fase 2)

**Objetivo Operacional**: Validar em campo real se o baseline `bb64cd4` (FORGE Phase 2) mantém a integridade de sessão, retomada determinística e autocorreção silenciosa sob condições de carga e instabilidade em Porto Alegre.

## 1. Eventos Críticos a Observar (Watchlist)

### 🚨 Evento Principal: `LOG-CB-PTR-ERR-001`
- **Natureza**: Ponteiro de contexto inconsistente detectado durante o Cold Boot.
- **Ação Automática**: Disparo de Dual-Read (Varredura de Legado) e reconstrução silenciosa do ponteiro.
- **Métrica de Sucesso**: Correção concluída em < 200ms (impacto zero para o aluno).

### 📊 Eventos de Integridade:
- **`coldBoot` Identificado**: Frequência de retomadas por sala.
- **`requestId` Bloqueio**: Casos de duplicidade de ativação impedidos pelo controle de idempotência.
- **`SUPERSEDED` Transição**: Correta invalidação de sessões anteriores em casos de reentrada.

## 2. Métricas de Observabilidade (KPIs)
| Métrica | Target | Alerta |
| :--- | :---: | :---: |
| **Taxa de `LOG-CB-PTR-ERR-001`** | < 0.5% | > 1.0% |
| **Tempo Reconstrução (Avg)** | < 150ms | > 300ms |
| **P95 Tempo de Reconstrução** | < 200ms | > 350ms |
| **Máximo Reconstrução** | < 400ms | > 600ms |
| **Incidente Perceptível ao Aluno** | **ZERO** | **QUALQUER** |
| **Regressão de Status (`COMPLETED` -> `ACTIVE`)** | **ZERO** | **QUALQUER** |
| **Duplicidade de Sessão Ativa** | **ZERO** | **QUALQUER** |

## 3. Protocolo de Diagnóstico por Etapa

### 🟢 Início da Prova (Explosão de Handshake)
- Monitorar `requestId` no log de orquestração para garantir que o fracionamento C1/C2 não gera concorrência de sessão no mesmo contexto.

### 🟡 Meio da Prova (Simulação de Interrupção)
- Em caso de falha de tablet (troca), validar se o novo dispositivo assume o contexto via `context:*:active` sem gerar nova versão `v1`.

### 🔴 Encerramento (Sincronização de Recibo)
- Garantir que o status `COMPLETED` imobiliza o ponteiro de contexto para aquele aluno.

## 4. Critérios de GO/NO-GO Pós-Rerun
- **GO (Consolidado)**: Sucesso nominal + Zero regressão de status + Zero duplicidade.
- **GO CONDICIONADO**: Ocorrência isolada de `LOG-CB-PTR-ERR-001` com recuperação silenciosa bem-sucedida.
- **NO-GO (Revisão)**: Falha na recuperação silenciosa ou inconsistência de Matriz de Transição em campo.

---
**Baseline de Referência**: `bb64cd4` (Phase 2 Hardened)  
**Time Responsável**: Engenharia de Resiliência | Operação POA  
**Data do Plano**: 30/03/2026
