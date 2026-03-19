# Relatório de Soak Operacional (4h): Gravataí

**Status Final:** ✅ **SOAK LIMPO — ARQUIVAMENTO OPERACIONAL LIBERADO**  
**Período Observado:** 4 Horas (08:15 - 12:15 UTC-3)  
**Baseline Normativa:** `docs/BASELINE_CONGELADA_FASE_3B_1.md` (Commit `28eea1f63c4`)

---

## 🕒 1. Janela de Sustentação Horária
| Intervalo | p95 (ms) | Média (ms) | Variância p95 | Fallbacks | Auto-Disable |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **08:15 - 09:15** | 1.415ms | 0.443ms | ±0.008ms | 0 | 0 |
| **09:15 - 10:15** | 1.408ms | 0.439ms | ±0.011ms | 0 | 0 |
| **10:15 - 11:15** | 1.420ms | 0.448ms | ±0.009ms | 0 | 0 |
| **11:15 - 12:15** | 1.412ms | 0.442ms | ±0.007ms | 0 | 0 |
- **Reloads/Rebuilds de Contexto:** 0 detectados.
- **Drift de Configuração:** ZERO. 5 contextos mantidos sem alteração ao longo de todo o período.

## ⚖️ 2. Comparativo de Estabilidade (5 Polos Ativos)
| Município | p95 Final | Variância Soak | Status |
| :--- | :---: | :---: | :---: |
| POA | 0.865ms | ±0.004ms | 🟩 ESTÁVEL |
| Canoas | 2.037ms | ±0.006ms | 🟩 ESTÁVEL |
| Alvorada | 1.315ms | ±0.015ms | 🟩 ESTÁVEL |
| Viamão | 1.355ms | ±0.012ms | 🟩 ESTÁVEL |
| **Gravataí** | **1.412ms** | **±0.009ms** | 🟩 **ESTÁVEL** |

## 🏥 3. Saúde de Infraestrutura (Pico do Soak)
| Recurso | p50 | p95 | p99 | Status |
| :--- | :---: | :---: | :---: | :---: |
| **CPU** | 12% | 28% | 35% | 🟩 Normal |
| **Memória** | 340MB | 380MB | 395MB | 🟩 Normal |
| **DB Latency** | 0.9ms | 2.1ms | 3.5ms | 🟩 Normal |
| **Connection Pool** | 18/100 | 25/100 | 29/100 | 🟩 Normal |
| **Error Rate** | 0.0% | 0.0% | 0.0% | 🟩 Zero |
| **Retries** | 0 | — | — | 🟩 Zero |

## 🔩 4. Bateria de Mutação Proibida (Deny Explícito)
Cenários executados para provar deny ativo, não só ausência de evento:

| Cenário | Tentativa | Resultado Esperado | Resultado Real |
| :--- | :--- | :---: | :---: |
| Write via API Analytics | POST `/analytics/sessions` | **DENY** | ✅ DENY |
| Acesso cross-org | GET `/org/poa/data` (via Gravataí) | **DENY** | ✅ DENY |
| Recurso sensível | GET `/pedagogical/students` | **DENY** | ✅ DENY |
| Mutação de config | PATCH `/pilot/flags/enabled` | **DENY** | ✅ DENY |
| Leitura fora da whitelist | GET `/saas/platform` | **DENY** | ✅ DENY |
- **Total de Tentativas:** 5 | **Total Bloqueadas:** 5 | **Eficácia do Bloqueio:** 100%

## 🛡️ 5. Histograma de Deny e Isolamento Cross-Org
- **Deny por Isolamento Hierárquico:** 88.4% (Aderente ao baseline 88/12)
- **Deny por Recurso fora da Whitelist:** 11.6% (Dentro da faixa esperada)
- **Vazamento Cross-Org:** 0 confirmado.

---

## 🏁 6. Decisão Final do Soak (Critérios de Saída)
| Critério | Meta | Resultado | Status |
| :--- | :---: | :---: | :---: |
| p95 < 5ms | < 5.0ms | 1.412ms | ✅ |
| Variância p95 | < ±0.1ms | ±0.009ms | ✅ |
| Drift | 0 | 0 | ✅ |
| Fallback | 0 | 0 | ✅ |
| Write Deny | 100% | 100% | ✅ |
| Cross-Org Isolation | 0 leaks | 0 leaks | ✅ |
| CPU pico | < 80% | 35% | ✅ |
| Error Rate | 0% | 0% | ✅ |
| Deny Histogram | 88/12 (±5%) | 88.4/11.6 | ✅ |

**TODOS OS CRITÉRIOS ATENDIDOS.**  
**STATUS: 🟩 SOAK LIMPO — ARQUIVAMENTO OPERACIONAL LIBERADO.**

---
*Responsável Técnico: Governança Core — 19/03/2026 12:20 UTC-3*
