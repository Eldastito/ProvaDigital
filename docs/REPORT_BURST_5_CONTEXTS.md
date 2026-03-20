
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** OPERATIONAL
**Timestamp:** 2026-03-20T00:30:10.319Z
**Decision:** ✅ GO - Aprovado por performance e governança.

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WARMUP | 4970 | 0.34ms | **0.86ms** | 1.56ms | 0 | 0.20 | 64MB |
| LEVEL_1 | 37940 | 0.25ms | **0.60ms** | 1.06ms | 0 | 0.38 | 79MB |
| LEVEL_2 | 86950 | 0.21ms | **0.51ms** | 0.84ms | 0 | 0.63 | 112MB |
| LEVEL_3 | 148900 | 0.19ms | **0.54ms** | 0.91ms | 0 | 1.13 | 119MB |
| RECOVERY | 5020 | 0.32ms | **0.84ms** | 1.50ms | 0 | 0.21 | 64MB |

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
