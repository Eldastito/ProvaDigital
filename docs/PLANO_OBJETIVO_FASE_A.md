# Plano Objetivo: Fase A - Shadow Mode Progressivo (Auditoria Silenciosa)

Este documento detalha a operação da Fase A da transição de governança, focando na ativação progressiva e monitorada.

## 1. Prontidão Técnica
- **Status**: A infraestrutura está pronta para ativação progressiva, começando pelas superfícies de autorização de maior cobertura e menor risco operacional.
- **Validação de Tipagem**: Garantir que todos os componentes da UI consigam resolver o `GovernanceContext` através do `useGovernance`.
- **Preenchimento de Audit**: Popular a tabela `governance_audit` para análise estatística de acessos.

## 2. Configuração de Autoridade
- **AUTORIDADE REAL**: Legado (`UserRole`, `tenant_id`, `school_id`).
- **AUTORIDADE SHADOW**: Governance Core (`membership_id`, `resource_policies`).
- **COMPORTAMENTO**: `useGovernance.can()` sempre retornará o valor do legado. O Core apenas executa sua lógica e loga se o resultado for diferente.

## 3. Monitoramento e Métricas
- **KPI de Sucesso**: Taxa de divergência não mapeada < 0.1% em ambiente de teste/staging.
- **Log de Erro**: Divergências críticas (ex: Core nega o que o Legado permitiu) devem ser tratadas como bugs de mapeamento.

## 4. Ordem de Integração (Auditoria)
A auditoria silenciosa deve ser habilitada gradualmente nos seguintes pontos:
1.  **Módulos de Gestão Admin**: Testar cross-tenant checks em larga escala.
2.  **Módulos Pedagógicos**: Validar isolamento de escola e professor.
3.  **App de Simulado**: Validar acesso de estudantes sob a nova ótica de membership.

## 5. Critério de Saída (Ready for Fase B)
- 100% dos papéis legados mapeados corretamente no `GovernanceService`.
- Tabela `roles` populada e consistente.
- Auditoria rodando sem erros de execução em 100% da superfície da aplicação.

---
**Status**: INICIALIZADO (Fase de Implementação Técnica Concluída)
**Data**: 15/03/2026
