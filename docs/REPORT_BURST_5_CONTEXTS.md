
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** ADVERSARIAL
**Timestamp:** 2026-03-19T19:58:34.934Z
**Decision:** ✅ GO - Aprovado por performance e governança.

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WARMUP | 5030 | 0.30ms | **0.72ms** | 1.25ms | 0 | 0.00 | 61MB |
| LEVEL_1 | 38340 | 0.21ms | **0.53ms** | 0.88ms | 0 | 0.00 | 75MB |
| LEVEL_2 | 83100 | 0.26ms | **0.64ms** | 1.11ms | 0 | 0.00 | 109MB |
| LEVEL_3 | 150000 | 0.19ms | **0.52ms** | 0.83ms | 0 | 0.00 | 126MB |
| RECOVERY | 5040 | 0.25ms | **0.62ms** | 1.16ms | 0 | 0.00 | 113MB |

## 🛡️ Integridade de Governança

| Fase | Leak | Escape | Block (RO) | Shadow | Mutation Del. | Fallback |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| WARMUP | 0 | 0 | 0 | 0 | 0 | 0 |
| LEVEL_1 | 0 | 0 | 1909 | 3775 | 0 | 0 |
| LEVEL_2 | 0 | 0 | 4136 | 8476 | 0 | 0 |
| LEVEL_3 | 0 | 0 | 7474 | 15065 | 0 | 0 |
| RECOVERY | 0 | 0 | 0 | 0 | 0 | 0 |

## 🛑 Histograma de Deny (Top 5)
- ANALYTICS:VIEW: 13598 denies
- INSTITUTIONAL_METADATA:VIEW: 13453 denies
- SCHOOL_AGGREGATE_DATA:VIEW: 13395 denies
- EXAMEPAD_OPS:CREATE: 4568 denies
- SAAS_PLATFORM:CREATE: 4494 denies

## 🏁 Veredito Final
**Exit Code:** 0
**Justificativa:** Aprovado por performance e governança.
