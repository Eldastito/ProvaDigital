# Roteiro: Sessão Piloto 19 (Gestor Municipal - ORG)

**Perfil**: Gestor de Rede (Secretário Municipal/Equipe Técnica)
**Escopo**: `ORG` (Prefeitura de Exemplo A)
**Baseline Canônica**: `15bbe48` | **Tag**: `onda-2-staging-freeze-v3`
**Status**: 🟡 **AGUARDANDO GO PARA EXECUÇÃO**

## 1. Escopo Autorizado (Sessão 19)
A sessão será estritamente de **leitura e navegação** para auditar a visibilidade de rede:
- [x] Dashboard Agregado da Rede (Total de Alunos, Escolas, Desempenho).
- [x] Listagem de Unidades Escolares subordinadas à organização.
- [x] Drill-down para relatórios de uma unidade específica (Leitura).
- [x] Retorno ao contexto de rede (Limpeza de Contexto).

## 2. Escopo Proibido (Bloqueio Auditado)
- [ ] Edição de configurações da organização ou usuários.
- [ ] Acesso a dados de outra Prefeitura/Tenant.
- [ ] Acesso a dados de Redes Estaduais ou Privadas.
- [ ] Qualquer operação de escrita (Create/Edit/Delete).

## 3. Validações Críticas de Governança
| Campo | Expectativa no Nível ORG | Expectativa no Drill-down (UNIT) |
| :--- | :--- | :--- |
| `activeOrganizationId` | ID da Prefeitura A | ID da Prefeitura A (Persistente) |
| `activeMembershipId` | Vínculo de Gestor Municipal | Vínculo de Gestor Municipal |
| `activeSchoolId` | **Nulo/Vazio** | ID da Unidade Acedida |
| `activeScopeType` | `ORG` | `UNIT` (Temporário p/ visualização) |

## 4. Critérios de Stop-the-Line (Interceptação Imediata)
1. **Vazamento Inter-Rede**: Visualização de qualquer dado de outra prefeitura.
2. **Contexto Persistente (Stale)**: `activeSchoolId` continuar preenchido após retornar ao Dashboard Municipal.
3. **Escalada de Privilégio**: Acesso a menus de nível Estadual ou Federal.
4. **Instabilidade de Contexto**: Divergência crítica entre as decisões do Legado e do Core sobre propriedade da organização.

---
**Responsável Técnico**: Antigravity | **Data**: 2026-03-15
