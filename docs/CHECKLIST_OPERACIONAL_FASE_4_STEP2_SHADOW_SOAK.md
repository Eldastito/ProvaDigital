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
- [ ] `Leak = 0`
- [ ] `Escape = 0`
- [ ] `Mutation Delegation = 0`
- [ ] `Legacy Mutation Allowance = 0`
- [ ] `Fallback = 0`
- [ ] `p95 < 5ms` por município
- [ ] `untracked_delegation_count` estável
- [ ] CPU com leitura real confiável
- [ ] Memória sem crescimento anômalo sustentado

## 5. Critérios NO-GO
- [ ] Qualquer write escape ou cross-tenant leak
- [ ] CPU inválida/zerada
- [ ] Degradação sustentada de performance

## 6. Artefatos Obrigatórios
- [ ] `docs/REPORT_FASE_4_STEP2_SHADOW_SOAK.md`
- [ ] JSON bruto em `artifacts/`
- [ ] Snapshot de métricas por município
- [ ] Resumo executivo com decisão GO/NO-GO
