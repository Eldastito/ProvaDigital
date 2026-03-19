# Checklist Operacional: Ativação Alvorada (Fase 3B.1)

**Município:** Alvorada  
**Data Alvo:** 18/03/2026  
**Baseline:** `docs/BASELINE_CONGELADA_FASE_3B_1.md`

## 1. Pré-Voo (Prontidão)
- [ ] Confirmar o estado atual da Feature Flag `authority_pilot_analytics_readonly` por contexto, registrando explicitamente:
  - Contextos já autorizados (POA, Canoas).
  - Contextos desabilitados.
  - Contexto alvo da ativação (`alvorada_organization`).
- [ ] Garantir que a ativação de Alvorada não altere indevidamente os contextos já aprovados.
- [ ] Confirmar que a baseline funcional é a `GLOBAL v4 Remediada`.
- [ ] Registrar ambiente da execução (ex: produção controlada / staging / shadow).
- [ ] Executar script de sanidade multi-org:
  ```bash
  npx tsx scripts/testGovernance_Session6_Rollback.ts
  ```
- [ ] Confirmar Exit Code 0 e "Rollback Seguro: SIM".

## 2. Início da Execução
- [ ] Habilitar piloto para o contexto de `alvorada_organization`.
- [ ] Iniciar cronômetro de observação (Mínimo de 30 minutos).
- [ ] Registrar duração real da observação.
- [ ] Monitorar logs em busca de:
  - `Divergence in ProtectedRoute` (não deve ocorrer).
  - Tentativas de `WRITE` (devem ser bloqueadas).

## 3. Coleta de Métricas
- [ ] Extrair latência p95 End-to-End durante a janela.
- [ ] Validar se p95 < 5.0ms.
- [ ] Executar cenário de teste de isolamento (Tentar acessar POA/Canoas a partir de Alvorada).

## 4. Finalização
- [ ] Preencher o `docs/TEMPLATE_EVIDENCIA_GO_NOGO.md` com os dados coletados.
- [ ] Não prosseguir para parecer final se a janela observada for inferior a 30 minutos.
- [ ] Emitir Parecer Final (Aprovado / Rejeitado).
- [ ] Bloquear ativação de Viamão até a aprovação formal (GO) deste checklist.

---
**Equipe de Operação:**
- **Executor:** [Nome / ID]
- **Revisor/Aprovador:** [Nome / ID]
- **Data/Hora da Aprovação:** [YYYY-MM-DD HH:MM]
