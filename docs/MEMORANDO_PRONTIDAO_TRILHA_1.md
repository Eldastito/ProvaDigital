# Memorando de Prontidão: Trilha 1 — Evolução Pré-Campo (FORGE)

Este memorando estabelece a bússola de disciplina para o avanço da plataforma enquanto aguardamos o campo real da R4C.

---

## 1. Diretrizes de Continuidade (Trilha 1 Autorizada)
Estão autorizadas apenas melhorias que reduzam incerteza real sem alterar a baseline `bb64cd4` e sem invadir as validações exclusivas de campo.

### A. Observabilidade para Debrief
- Melhorias em logs, correlação de eventos (`attemptId`, sala, contexto).
- Refinamento de timestamps e padronização de mensagens de erro.
- Preparação de exportações legíveis para o Debrief 24h.

### B. Hardening Lógico Periférico
- Validações defensivas e guardrails em artefatos auxiliares.
- Consistência documental e mensagens de erro internas.
- Instrumentação lateral que não altere o fluxo canônico da Fase 2.

### C. UX e Apoio Operacional
- Checklists operacionais para responsáveis por sala.
- Guias de severidade (SEV-1/2/3) e fluxos de conferência.
- Ferramentas de apoio à disciplina de coleta de evidência.

---

## 2. Proibições Absolutas (Território do Campo)
Permanecem terminantemente proibidas as seguintes frentes:

- **Alterações Estruturais**: Mudanças em `sessionIsolation`, `coldBoot`, matriz de estados ou lógica central da baseline congelada.
- **Validação Física por Teoria**: Concluir geometria de handshake, zonas de mesh ou prontidão de pavilhão sem vistoria in-loco.
- **Trabalho Ornamental**: Produção de novas narrativas estratégicas ou aprofundamento de hipóteses já saturadas sem redução objetiva de incerteza.

---

## 3. Regra de Decisão
Antes de iniciar qualquer tarefa de Trilha 1, a equipe deve responder:
> **"Isso reduz uma incerteza real sem tocar no que só o campo pode validar?"**

Se a resposta for "Não" ou se a melhoria tentar substituir o campo, a tarefa deve ser **bloqueada**.

---
**Status**: VIGENTE  
**Referência**: [POLITICA_CONTINUIDADE_PRE_CAMPO.md](docs/POLITICA_CONTINUIDADE_PRE_CAMPO.md)  
**Data**: 01/04/2026
