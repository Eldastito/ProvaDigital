
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** OPERATIONAL
**Timestamp:** 2026-03-29T02:33:19.693Z
**Decision:** ✅ GO - Aprovado por performance e governança.

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WARMUP | 4800 | 0.43ms | **1.17ms** | 5.72ms | 0 | 0.26 | 64MB |
| LEVEL_1 | 36260 | 0.32ms | **0.85ms** | 2.94ms | 0 | 0.48 | 75MB |
| LEVEL_2 | 80650 | 0.30ms | **0.70ms** | 1.28ms | 0 | 0.90 | 109MB |
| LEVEL_3 | 126100 | 0.30ms | **0.75ms** | 1.84ms | 0 | 1.43 | 103MB |
| RECOVERY | 4870 | 0.41ms | **0.84ms** | 1.34ms | 0 | 0.19 | 94MB |

## 🛡️ Integridade de Governança

| Fase | Leak | Escape | Block (RO) | Untracked | Mut. Del. | Legacy M. Allow | Fallback |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| WARMUP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LEVEL_1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LEVEL_2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LEVEL_3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RECOVERY | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 🛑 Histograma de Deny (Top 5)


## 🏁 Veredito Final
**Exit Code:** 0
**Justificativa:** Aprovado por performance e governança.
