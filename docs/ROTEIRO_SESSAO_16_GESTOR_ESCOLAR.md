# Roteiro: Sessão Piloto 16 (Gestor Escolar)

**Perfil**: Gestor de Unidade (Diretor/Coordenador)
**Escopo**: `UNIT` (Escola 1)
**Data/Hora Planejada**: 2026-03-15 (Pós-Unificação Baseline)
**Status**: 🟡 **AGUARDANDO GO PARA EXECUÇÃO**

## 1. Perfil do Usuário
- **Nome**: Gestor-Escolar-016
- **Escola**: `school_1`
- **Tenant**: `tenant_A`
- **Poderes**: Visão administrativa total da unidade, relatórios de desempenho de alunos e professores da escola.

## 2. Jornada de Validação
O gestor executará as seguintes etapas sob monitoramento do Shadow Mode:

| Passo | Ação | Objetivo de Governança |
| :--- | :--- | :--- |
| **01** | Login e Dashboard | Validar `activeSchoolId` e `activeMembershipId`. |
| **02** | Listagem de Professores | Confirmar visibilidade restrita à `school_1`. |
| **03** | Relatório de Desempenho | Validar acesso pedagógico de unidade (Mapeador `school_manager`). |
| **04** | Tentativa Cross-School | Acesso a `school_2` via URL/Parâmetro forjado (Bloqueio Auditado). |
| **05** | Analytics de Rede | Tentar acessar dados agregados da rede (Bloqueio Auditado - Escopo UNIT). |

## 3. Critérios de Sucesso (GO/NO-GO)
- **Segurança**: Zero acessos a dados da `school_2` ou aggregados municipais.
- **Coerência**: Contexto ativo deve ser `UNIT` e refletir sempre a `school_1`.
- **Performance**: P95 do motor `can()` < 2ms.
- **Divergência**: Zero divergências críticas detectadas pelo Shadow Mode.

---
**Baseline Canônica**: `38ee4a5` | **Freeze v2**: Ativo
