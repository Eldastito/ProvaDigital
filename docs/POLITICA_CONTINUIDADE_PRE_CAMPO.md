# Política de Continuidade Pré-Campo: Governança de Evolução FORGE

Esta política define as regras para a continuidade do desenvolvimento e planejamento da plataforma FORGE durante janelas de espera por evidências reais de campo, garantindo a separação entre avanço técnico e validação operacional.

---

## 1. Objetivo
Estabelecer uma governança defensiva que permita a evolução da engenharia sem comprometer a integridade dos vereditos de campo ou induzir a equipe a falsas conclusões de prontidão operacional.

## 2. Princípio Central
> [!IMPORTANT]
> **A IA Dev reduz incerteza; o campo encerra incerteza.**

## 3. Regra de Ouro (Golden Rule)
> [!CAUTION]
> Nenhum artefato produzido antes de campo real pode, isoladamente, promover baseline, autorizar mobilização física, declarar prontidão definitiva ou encerrar risco dependente de ambiente físico-operacional.

---

## 4. Trilhas Paralelas de Trabalho

### Trilha 1 — Continuidade Técnica Permitida
Trabalhos que podem evoluir baseados em simulações, lógica e revisão:
- Simulações sintéticas, estresse teórico e revisão de UX/Observabilidade.
- Validação em Lab (Hardware controlado).
- Hardening lógico (Idempotência, Isolamento, Concorrência).
- Planejamento estratégico condicionado de futuras fases.

### Trilha 2 — Itens Bloqueados (Dependência de Campo)
Trabalhos que **não podem** ser encerrados ou validados sem evidência real:
- Promoção de baseline para `OBSERVADO EM CAMPO`.
- Prontidão física real de unidades e impacto de geometria (Handshake).
- Validação de impacto perceptível ao aluno.
- Mobilização de fases sensíveis (ex: R5 - Julinho).
- Fechamento de riscos logísticos e comportamentais de operação.

---

## 5. Taxonomia Obrigatória de Status e Validade (Roadmap)
Todo novo artefato ou Step de tarefa deve ser rotulado conforme a legenda abaixo:
- **`[P]` Produzido / Pré-campo**: Concluído tecnicamente/teoricamente.
- **`[B]` Bloqueado até campo**: Depende de validação física-operacional.
- **`[G]` Aguardando gatilho**: Depende de evento anterior (ex: Veredito R4C).
- **`[V]` Validado em campo**: Prova real confirmada por debrief/logs.
- **`[x]` Concluído** / **`[/]` Em progresso**

### Regra do Rótulo Mais Conservador
> [!TIP]
> Em caso de ambiguidade ou dúvida entre dois rótulos de validade, prevalece sempre o **mais conservador**.

---

## 6. Governança de Baseline e Saturação

### Regra sobre Baseline Congelada
A baseline `bb64cd4` é imutável no escopo da Fase 2. Qualquer alteração estrutural exige rito formal de reabertura, aditivo específico ou início de nova fase.

### Critério de Saturação Útil da Teoria
Uma fase deve ser interrompida em meta-planejamento quando os riscos principais já estiverem mapeados, as hipóteses explicitadas e a próxima resposta útil depender exclusivamente de dados de campo.

---

## 7. Regras de Classificação e Promoção
- **Autoridade**: A classificação inicial deve ser ratificada pela Liderança Técnica responsável pela fase.
- **Promoção de Natureza**: Nenhum artefato muda de `[P]` para `[V]` sem a anexação explícita da "Fonte de Verdade" (ex: logs de produção, reconciliação nominal ou debrief 24h).

## 8. Gate Final de Realidade
A validação final de qualquer item bloqueado exige:
1. Operação ou vistoria real in-loco.
2. Análise de logs reais de telemetria.
3. Reconciliação nominal (Dispositivos vs Alunos).
4. Emissão de Veredito Formal compatível com promoção.

---
**Status da Política**: ATIVA E BLINDADA  
**Escopo**: Global (Plataforma FORGE)  
**Data**: 01/04/2026
