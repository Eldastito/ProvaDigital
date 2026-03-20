
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** OPERATIONAL
**Timestamp:** 2026-03-20T00:04:23.586Z
**Decision:** ✅ GO - Aprovado por performance e governança.

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WARMUP | 5065 | 0.33ms | **0.83ms** | 1.49ms | 0 | 0.18 | 59MB |
| LEVEL_1 | 36460 | 0.28ms | **0.77ms** | 2.05ms | 0 | 0.40 | 74MB |
| LEVEL_2 | 82750 | 0.25ms | **0.64ms** | 1.15ms | 0 | 0.79 | 107MB |
| LEVEL_3 | 143800 | 0.23ms | **0.56ms** | 0.90ms | 0 | 1.25 | 121MB |
| RECOVERY | 5010 | 0.32ms | **0.74ms** | 1.25ms | 0 | 0.15 | 109MB |

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
