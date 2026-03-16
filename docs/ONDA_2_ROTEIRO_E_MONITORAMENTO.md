# Roteiro e Monitoramento — Onda 2 (Usuários Reais Acompanhados)

Este documento estabelece o protocolo de execução para a Onda 2 da Fase 2B, garantindo a segurança operacional enquanto coletamos dados de divergência com usuários reais em ambiente de Staging.

## 1. Janela Operacional e Critérios de Encerramento
- **Duração**: 5 dias úteis de coleta ativa.
- **Volume Mínimo**:
    - **Responsáveis**: 10 sessões completas (mínimo 2 casos multi-escola/multi-dependente).
    - **Professores**: 5 sessões completas (focando em Analytics de aluno).
    - **Gestores**: 2 sessões completas (visibilidade de rede).
- **Critério de Sucesso**: Zero incidentes críticos, 100% das divergências classificadas e performance dentro das metas.
- **Encerramento Antecipado**: Caso os critérios de Stop-the-line sejam atingidos ou se a massa crítica de dados for atingida antes do prazo com 0% de erro de mapeamento novo.

## 2. Público de Controle
- **Responsáveis (10)**: Escolhidos por possuírem múltiplos filhos ou estarem em contexto multi-escola.
- **Professores (5)**: Atuantes em turmas com alta densidade de lançamentos.
- **Gestores (2)**: Focados em relatórios de desempenho e monitoramento de rede.

## 3. Roteiro de Jornada (Testes Acompanhados)
Para cada perfil, validaremos a autoridade via contrato canônico:
1. **Acesso Inicial**: Login e verificação via `can(resource, action, context?)`.
2. **Visualização de Aluno (Responsáveis)**: Troca de contexto entre dependentes com validação de `context` (ID do aluno).
3. **Relatórios Analíticos**: Chamadas aos serviços protegidos que executam o Shadow Mode do Core.
4. **Interação com Core**: Observação silenciosa (Shadow Mode) de cada decisão tomada pelo Governance Core.

## 4. Metas de Performance
- **Métrica A (Motor)**: `governanceService.can()` p95 **< 2ms**.
- **Métrica B (Superfície)**: Impacto visual/percebido (Sidebar, ProtectedRoute, Services) p95 **< 200ms**.

## 5. Protocolo de Monitoramento e Classificação
Monitoraremos os eventos em tempo real com categorização imediata:
- **`[SECURITY_AUTHORITY_FAILURE]`**: Negação autoritativa nos serviços.
- **`[DIVERGENCE_DETECTED]`**: Divergência Legado vs Core, classificada como:
    - **Baseline Esperada**: Divergência já conhecida e documentada.
    - **Bug de Mapeamento**: Erro na tradução Legado -> Core.
    - **Risco Legado**: Vulnerabilidade real no código antigo detectada pelo Core.
    - **Incidente Crítico**: Comportamento que viola o isolamento de dados.

## 6. Critérios de Stop-the-Line (Ações Automáticas)
A Onda 2 será interrompida automaticamente (pausa na coleta e notificação imediata) se ocorrer:
1. **Vazamento de Dados**: Qualquer evidência de cross-tenant ou cross-school leak.
2. **Privilégio Indevido**: Acesso permitido a dados sem vínculo legítimo comprovado.
3. **Instabilidade Severa**: Performance de superfície (Métrica B) excedendo 500ms consistentemente.
4. **Divergência Crítica Não Classificada**: Qualquer incidente sem causa imediata identificada.

## 7. Regras Operacionais e Governança
- **Freeze Formal**: Nenhum mapeamento ou regra pode ser alterado durante a janela, exceto em Stop-the-line.
- **Sessões Acompanhadas**:
    - **Suporte**: Canal de Slack/Chat dedicado para suporte imediato aos usuários.
    - **Reversibilidade**: Capacidade de interromper a coleta ou desativar o Shadow Mode instantaneamente via Feature Flag.
    - **Registro**: Log obrigatório do horário e contexto (ID da escola/aluno) de cada sessão.
- **Divergência Zero Crítica**: O encerramento da onda exige 0 divergências críticas e 0 vazamentos comprovados.
- **Checkpoint Intermediário**: Reunião de alinhamento técnico após o 3º dia de coleta.

## 8. Baselines e Congelamento (Changelog Canônico)
- **Freeze Oficial v1**: Commit `onda-2-staging-freeze` (Janela Inicial).
- **Baseline v2 (Baseline Canônica)**: Commit `38ee4a5` | Tag `onda-2-staging-freeze-v2`.
  - **Histórico**: Inclui ajuste no `governanceService.ts` (id de membership) e mini-regressão validada.
  - **Status**: Congelado para início do Ponto de Controle de Gestores.

---
**Responsável Técnico**: Antigravity | **Data**: 2026-03-15
