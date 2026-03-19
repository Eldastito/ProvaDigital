
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** ADVERSARIAL
**Timestamp:** 2026-03-19T21:08:25.754Z
**Decision:** ✅ GO - Aprovado por performance e governança.

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WARMUP | 5000 | 0.31ms | **0.74ms** | 1.28ms | 0 | 0.16 | 61MB |
| LEVEL_1 | 38280 | 0.21ms | **0.54ms** | 0.88ms | 0 | 0.30 | 75MB |
| LEVEL_2 | 88000 | 0.18ms | **0.52ms** | 0.87ms | 0 | 0.59 | 109MB |
| LEVEL_3 | 151800 | 0.18ms | **0.51ms** | 0.84ms | 0 | 1.13 | 124MB |
| RECOVERY | 5005 | 0.30ms | **0.73ms** | 1.27ms | 0 | 0.16 | 61MB |

## 🛡️ Integridade de Governança

| Fase | Leak | Escape | Block (RO) | Shadow | Mut. Del. | Legacy M. Allow | Fallback |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| WARMUP | 0 | 0 | 0 | undefined | 0 | 0 | 0 |
| LEVEL_1 | 0 | 0 | 1884 | undefined | 0 | 0 | 0 |
| LEVEL_2 | 0 | 0 | 4360 | undefined | 0 | 0 | 0 |
| LEVEL_3 | 0 | 0 | 7663 | undefined | 0 | 0 | 0 |
| RECOVERY | 0 | 0 | 0 | undefined | 0 | 0 | 0 |

## 🛑 Histograma de Deny (Top 5)
- INSTITUTIONAL_METADATA:VIEW: 14005 denies
- ANALYTICS:VIEW: 13913 denies
- SCHOOL_AGGREGATE_DATA:VIEW: 13840 denies
- SAAS_PLATFORM:CREATE: 4730 denies
- FINANCE:CREATE: 4639 denies

## 🏁 Veredito Final
**Exit Code:** 0
**Justificativa:** Aprovado por performance e governança.
