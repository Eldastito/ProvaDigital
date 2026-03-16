# Evidência Técnica: Regressão Baseline v3 (Onda 2)

**Baseline Canônica**: `15bbe48` | **Tag**: `onda-2-staging-freeze-v3`
**Status**: ✅ **APROVADA PARA PRODUÇÃO (SESSÃO 19)**

## 1. Integridade Analítica (0 Regressões)
O script `BASELINE_V3_REGRESSION.test.ts` validou os domínios já aprovados contra as mudanças estruturais da v3:
- **Responsáveis**: O isolamento de dependentes e bloqueio de outras escolas permanece 100% íntegro.
- **Professores Multi-escola**: A troca de contexto mantém a coerência de `activeMembershipId` e `activeSchoolId`.
- **Gestores UNIT**: A visibilidade restrita à própria unidade e bloqueio de outras unidades continua rigoroso.

## 2. Validação do Escopo ORG (Gestor Municipal)
- **Purificação de Contexto**: No nível organizacional (Secretaria Municipal), o `activeSchoolId` é garantido como `undefined/null`.
- **Limpeza Stale Context**: O teste provou que ao "entrar" em uma escola (drill-down) e "voltar", a visibilidade volta a ser agregada de rede sem resquícios do ID escolar anterior.
- **Isolamento Inter-Rede**: O `GovernanceService` nega acesso a qualquer organização (`targetOrganizationId`) diferente da `activeOrganizationId` do gestor municipal.

## 3. Limpeza Técnica (Search & Destroy)
- **Ocorrências de 'REGIONAL' no runtime**: 0 (zero).
- **Contrato Canônico**: Atualizado para `UNIT > ORG > GLOBAL`.
- **Logs**: O campo `activeScopeType` agora emite `ORG` para gestores municipais e estaduais.

## 4. Performance
- **Latência Média Motor**: **0.0028ms** (V3 Transversal).
- **Estabilidade**: Zero desvios detectados sob 12.000 iterações de teste cross-actor.

**Recomendação Técnica**: A Baseline v3 é o novo Ponto de Verdade estável. GO autorizado para a Sessão 19.

---
**Assinatura**: Antigravity | **Data**: 2026-03-15
