# Checklist Operacional: Fase 4 / Step 2 — Shadow Soak

## 1. Preflight de Higiene
- [x] Confirmar `origin/main` sincronizado (SHA: `bab1303`)
- [x] Confirmar commit de referência do Step 1 aprovado (`a9796c5`)
- [x] Confirmar `authority_pilot_analytics_readonly` ativo
- [x] Rodar `npx tsx scripts/testGovernance_Session6_Rollback.ts`
- [x] Validar que os artefatos do Step 1 estão unificados (Total: 13.907 RO Blocks)
- [x] Confirmar telemetria de CPU com fonte real e valor não nulo (V: 1.63% em burst)

## 2. Preflight de Observabilidade
- [x] Definir semanticamente `untracked_delegation_count`: Requests de leitura legítimos fora do gate atual.
- [x] Confirmar captura de: CPU, Memória, DB latency (unav), Pool (unav), Fallback, blocks_ro, mut_del, legacy_mut_allow.
- [x] Confirmar que `mutation_delegation_count = 0` em readonly via Patch F4.1.
- [x] Confirmar que o relatório explicita unidades (ms, %, MB) e método (Delta process.cpuUsage).

## 3. Execução do Shadow Soak
- **Duração**: 30 min
- **Escopo**: 5 municípios ativos
- **Modo**: Readonly (Sem escrita liberada)
- **Carga**: Perfil Operacional

## 4. Critérios GO
- [x] `Leak = 0`
- [x] `Escape = 0`
- [x] `Mutation Delegation = 0`
- [x] `Legacy Mutation Allowance = 0`
- [x] `Fallback = 0`
- [x] `p95 < 5ms` por município
- [x] `untracked_delegation_count` estável
- [x] CPU com leitura real confiável
- [x] Memória sem crescimento anômalo sustentado

## 5. Critérios NO-GO
- [x] Qualquer write escape ou cross-tenant leak (ZERO)
- [x] CPU inválida/zerada (RESOLVIDO)
- [x] Degradação sustentada de performance (NORMAL)

## 6. Artefatos Obrigatórios
- [x] `docs/REPORT_FASE_4_STEP2_SHADOW_SOAK.md`
- [x] JSON bruto em `artifacts/`
- [x] Snapshot de métricas por município
- [x] Resumo executivo com decisão GO/NO-GO
