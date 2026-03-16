# Roteiro: Sessão Piloto 20 (Gestor Municipal - Simetria ORG)

**Perfil**: Gestor de Rede (Secretário Municipal/Equipe Técnica)
**Município**: **Canoas** (Diferente da Sessão 19 - POA)
**Escopo**: `ORG`
**Baseline Canônica**: `15bbe48` | **Tag**: `onda-2-staging-freeze-v3`
**Status**: 🟡 **AGUARDANDO EXECUÇÃO**

## 1. Objetivo de Simetria
Validar que o motor de governança aplica as mesmas regras de isolamento e purificação de contexto para uma organização diferente, garantindo que não há hardcoding ou comportamentos específicos por tenant.

## 2. Jornada do Piloto (Execução em Staging)
1. **Login e Dashboard Municipal (Canoas)**:
   - Validar `activeOrganizationId = canoas_org`.
   - Validar `activeSchoolId = null`.
2. **Listagem de Escolas**:
   - Confirmar visibilidade apenas das escolas subordinadas a Canoas.
3. **Drill-down (UNIT)**:
   - Acessar relatório de uma escola de Canoas.
   - Validar `activeSchoolId = school_canoas_1`.
4. **Retorno ao Nível ORG**:
   - Voltar ao Dashboard de Rede.
   - **Check Crítico**: Garantir que `activeSchoolId` voltou a ser `null`.
5. **Tentativa de Acesso Inter-Rede (POA)**:
   - Tentar acessar Dashboard da Prefeitura de POA.
   - **Check Crítico**: Bloqueio Autoritativo (Motivo: Organization mismatch).
6. **Tentativa de Escala Regional (Estado/RS)**:
   - Tentar acessar visão da Secretaria Estadual.
   - **Check Crítico**: Bloqueio de Escopo (ORG não escala para GLOBAL/REGIONAL legado).

## 3. Critérios de Sucesso
- Sucesso em todas as etapas de navegação legítima.
- Bloqueio imediato em todas as etapas de acesso indevido.
- Zero divergência crítica no Shadow Mode.
- Performance de motor ~0.003ms.

---
**Responsável**: Antigravity | **Data**: 2026-03-15
