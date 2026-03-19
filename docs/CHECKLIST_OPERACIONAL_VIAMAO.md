# Checklist Operacional: Ativação Viamão (Fase 3B.1)

**Município:** Viamão  
**Versão:** 1.0 (Preparação Baseada em Alvorada)  
**Baseline Normativa:** `docs/BASELINE_CONGELADA_FASE_3B_1.md`

## 1. Pré-Voo (Prontidão de Viamão)
- [ ] Registrar Snapshot de estado por contexto ANTES (Início do Passo 1):
  - `poa_organization`: **ENABLED**
  - `canoas_organization`: **ENABLED**
  - `alvorada_organization`: **ENABLED**
  - `viamao_organization`: **DISABLED**
- [ ] Confirmar que a ativação de Viamão não altere indevidamente os contextos já autorizados.
- [ ] Confirmar baseline funcional `GLOBAL v4 Remediada` íntegra.
- [ ] Registrar ambiente da execução.
- [ ] Executar script de sanidade multi-org:
  ```bash
  npx tsx scripts/testGovernance_Session6_Rollback.ts
  ```
- [ ] Confirmar Exit Code 0 e "Rollback Seguro: SIM".

## 2. Início da Execução (SOMENTE APÓS GO FORMAL)
- [ ] Habilitar piloto para o contexto de `viamao_organization`.
- [ ] Iniciar cronômetro de observação (Mínimo de 30 minutos).
- [ ] Registrar duração real da observação e tipo de tráfego.
- [ ] Monitorar p95 E2E, WRITEs e Isolamento.

## 3. Coleta de Evidências
- [ ] Preencher template GO/NO-GO de Viamão.
- [ ] Validar se p95 Viamão < 5.0ms.
- [ ] Realizar comparação de performance/fallbacks contra Alvorada (Detectar desvios anômalos).
- [ ] Provar isolamento contra POA/Canoas/Alvorada.

## 4. Finalização
- [ ] Parecer Final e Registro de Auditoria.
- [ ] Bloquear Gravataí até aprovação formal de Viamão.

---
**Equipe de Operação:**
- **Executor:** [Nome / ID]
- **Revisor/Aprovador:** [Nome / ID]
- **Status:** ⏳ **AGUARDANDO START FORMAL**
