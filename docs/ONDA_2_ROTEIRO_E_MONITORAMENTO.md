# Roteiro e Monitoramento — Onda 2 (Usuários Reais Acompanhados)

Este documento estabelece o protocolo de execução para a Onda 2 da Fase 2B, garantindo a segurança operacional enquanto coletamos dados de divergência com usuários reais em ambiente de Staging.

## 1. Público Reais Selecionado (Grupo de Controle)
- **Responsáveis (10)**: Escolhidos por possuírem múltiplos filhos ou estarem em contexto multi-escola.
- **Professores (5)**: Atuantes em turmas com alta densidade de lançamentos.
- **Gestores (2)**: Focados em relatórios de desempenho e monitoramento de rede.

## 2. Roteiro de Jornada (Testes Acompanhados)
Para cada perfil, seguiremos o roteiro:
1. **Acesso Inicial**: Login e verificação de permissões básicas.
2. **Visualização de Aluno (Responsáveis)**: Troca de contexto entre dependentes e validação de isolamento cross-school.
3. **Relatórios Analíticos**: Acesso aos serviços protegidos (`AnalyticsService`, `growthService`).
4. **Interação com Core**: Observação silenciosa (Shadow Mode) de cada decisão tomada pelo Governance Core.

## 3. Protocolo de Monitoramento
Monitoraremos os seguintes eventos em tempo real:
- **`[SECURITY_AUTHORITY_FAILURE]`**: Qualquer negação autoritativa disparada nos serviços.
- **`[DIVERGENCE_DETECTED]`**: Divergências entre a decisão do Legado e do Core.
- **Volume de Logs**: Garantir que a instrumentação não degrade a performance (p95 < 200ms).
- **Taxa de Deduplicação**: Eficiência do cache de decisões do Shadow Mode.

## 4. Critérios de Stop-the-Line (Pausa Imediata)
A Onda 2 será interrompida se qualquer um destes eventos ocorrer:
1. **Vazamento de Dados**: Qualquer evidência de cross-tenant ou cross-school leak.
2. **Privilégio Indevido**: Core/Legado permitindo acesso a quem não possui vínculo legítimo.
3. **Instabilidade**: Degradação severa de performance que afete a experiência de uso no Staging.
4. **Divergência Crítica Não Classificada**: Comportamento inesperado em fluxos prioritários.

---
**Responsável**: IA Dev (Antigravity) | **Modo**: Shadow Mode (Observação Total)
