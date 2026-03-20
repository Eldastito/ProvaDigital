# Checklist Operacional: Fase 4 / Step 3 — Shadow Load Ampliado

## 1. Objetivo
Validar a estabilidade do motor em uma janela de tempo maior (60-120 min) com carga real simulada estável, buscando identificar tendências de longo prazo e consolidar a baseline operacional definitiva.

## 2. Preflight de Higiene
- [x] Confirmar `origin/main` sincronizado (SHA: `db1a309` ou posterior)
- [x] Confirmar encerramento oficial do Step 2 (GO Parcial)
- [x] Confirmar Authority Pilot em modo `readonly`
- [x] Garantir zero deploys paralelos programados

## 3. Parâmetros da Execução
- **Duração**: 60 a 120 minutos
- **Escopo**: 5 Municípios simultâneos
- **Perfil**: Operational (Shadow Load)
- **Escrita**: Bloqueada (ReadOnly)

## 4. Critérios de Sucesso (GO)
- [ ] `Leak = 0` / `Escape = 0`
- [ ] `Mutation Delegation = 0`
- [ ] `Fallback = 0`
- [ ] `p95 < 5ms` estável durante toda a janela
- [ ] CPU com leitura real coerente (Delta > 0)
- [ ] Memória estável (sem tendência de crescimento sustentado)
- [ ] `untracked_delegation_count` estável e compreendido

## 5. Critérios de Falha (NO-GO)
- [ ] Qualquer write escape ou detecção de mutação delegada
- [ ] Degradação de performance p95 sustentada (> 10ms)
- [ ] Memory Leak evidente (crescimento contínuo do RSS)

## 6. Artefatos de Saída
- [ ] `docs/REPORT_FASE_4_STEP3_SHADOW_LOAD_AMPLIADO.md`
- [ ] JSON Bruto de 60-120 min em `artifacts/`
- [ ] Veredito de maturidade para próxima fase
