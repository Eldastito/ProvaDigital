
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** ADVERSARIAL
**Timestamp:** 2026-03-19T20:12:00.926Z
**Decision:** ✅ GO - Aprovado por performance e governança.

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WARMUP | 4960 | 0.30ms | **0.74ms** | 1.32ms | 0 | 0.00 | 60MB |
| LEVEL_1 | 37940 | 0.24ms | **0.57ms** | 0.93ms | 0 | 0.00 | 76MB |
| LEVEL_2 | 88550 | 0.18ms | **0.50ms** | 0.81ms | 0 | 0.00 | 111MB |
| LEVEL_3 | 146500 | 0.21ms | **0.52ms** | 0.83ms | 0 | 0.00 | 124MB |
| RECOVERY | 5030 | 0.28ms | **0.63ms** | 1.04ms | 0 | 0.00 | 61MB |

## 🛡️ Integridade de Governança

| Fase | Leak | Escape | Block (RO) | Shadow | Mut. Del. | Legacy M. Allow | Fallback |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| WARMUP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LEVEL_1 | 0 | 0 | 1837 | 3808 | 0 | 0 | 0 |
| LEVEL_2 | 0 | 0 | 4492 | 8944 | 0 | 0 | 0 |
| LEVEL_3 | 0 | 0 | 7245 | 14562 | 0 | 0 | 0 |
| RECOVERY | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 🛑 Histograma de Deny (Top 5)
- SCHOOL_AGGREGATE_DATA:VIEW: 13645 denies
- INSTITUTIONAL_METADATA:VIEW: 13618 denies
- ANALYTICS:VIEW: 13608 denies
- SAAS_PLATFORM:CREATE: 4600 denies
- EXAMEPAD_OPS:CREATE: 4495 denies

## 🏁 Veredito Final
**Exit Code:** 0
**Justificativa:** Aprovado por performance e governança.
