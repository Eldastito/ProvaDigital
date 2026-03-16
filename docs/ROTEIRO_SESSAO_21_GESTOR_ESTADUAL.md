# Roteiro: Sessão Piloto 21 (Gestor Estadual - ORG)

**Perfil**: Gestor Estadual (Secretário de Estado / Coord. Regional RS)
**Tipo de Organização**: `state_secretariat`
**Escopo**: `ORG` (Conforme Contrato v3)
**Baseline Canônica**: `5421371` | **Tag**: `onda-2-staging-freeze-v3`
**Status**: 🟡 **EM PLANEJAMENTO**

## 1. Definição do Escopo ORG Estadual
Nesta sessão, o Gestor Estadual será modelado como um escopo `ORG` operando sobre a Secretaria de Estado. 
- **Hierarquia**: Deve enxergar os municípios (`municipal_secretariat`) subordinados e suas escolas.
- **Isolamento**: Não deve enxergar dados de outros Estados ou da Secretaria Federal (MEC).

## 2. Jornada do Piloto (Somente Leitura)
1. **Login e Dashboard Estadual**:
   - Validar `activeOrganizationId = state_rs_org`.
   - Validar `activeSchoolId = null`.
   - Validar `activeScopeType = ORG`.
2. **Listagem de Municípios/Redes Amparadas**:
   - Confirmar visibilidade dos municípios subordinados (ex: POA, Canoas).
3. **Drill-down Organizacional (ORG -> ORG)**:
   - Navegar para o dashboard de um município específico.
   - Validar se o motor mantém o `activeOrganizationId` do Estado como autoridade superior, mas foca no subordinado.
4. **Drill-down Unidade (UNIT)**:
   - Acessar relatório de uma escola específica dentro do estado.
   - Validar `activeSchoolId = school_id_alvo`.
5. **Retorno ao Dashboard Estadual**:
   - **Check Crítico**: Garantir limpeza total de `activeSchoolId`.

## 3. Critérios de Segurança e Stop-the-Line
- **Inter-Estado**: Bloqueio sumário se houver visibilidade de "Prefeitura de Florianópolis" (SC) ou outro Estado.
- **Federal**: Bloqueio se houver visibilidade aggregate do MEC.
- **Privado**: Bloqueio de redes privadas fora do escopo público.
- **Divergência**: Qualquer divergência crítica entre Legado/Core sobre a árvore subordinada.

## 4. Métricas Observadas
- `activeOrganizationId` persistente.
- `activeSchoolId` purificado nos níveis de rede.
- Performance de superfície (drill-down hierárquico intenso).

---
**Responsável**: Antigravity | **Data**: 2026-03-15
