# Plano Estratégico: Fase 20 — R5 (E.E. Júlio de Castilhos)

Este documento define a estratégia de planejamento para a unidade **Julinho**, o ponto de maior densidade e complexidade de Porto Alegre.

> [!CAUTION]
> **STATUS DE BLOQUEIO**: A execução da R5 está terminantemente **BLOQUEADA** até a emissão formal do `VEREDITO_CAMPO_F2_R4C_POA.md` com resultado **GO limpo**, compatível com a promoção da baseline da Fase 2.

---

## 1. Objetivo da Fase
Consolidar a estratégia para a unidade de maior escala (Julinho), tratando-a como uma fase isolada para mitigar riscos de densidade e exposição política.

## 2. Relação com a R4C (Inácio Montanha)
A validade deste planejamento depende da confirmação da baseline `bb64cd4` em campo real. 
- **Critério de Desbloqueio**: emissão formal do `VEREDITO_CAMPO_F2_R4C_POA.md` com resultado **GO limpo**, compatível com a promoção da baseline da Fase 2.
- **Critério de Regressão**: Se a R4C não produzir evidência de promoção ou revelar fragilidade estrutural, esta Fase 20 será reclassificada de **“planejamento estratégico condicionado”** para **“planejamento revisional”**.

## 3. Comparativo Estratégico: Inácio vs Julinho

| Dimensão | Inácio Montanha (R4C) | Júlio de Castilhos (R5) |
| :--- | :--- | :--- |
| **Densidade** | Média (300 tablets) | Alta (Estimativa > 800 tablets) |
| **Complexidade Física** | Unidade Compacta | Unidade Multiblocos / Pavilhões |
| **Sensibilidade Política** | Moderada | **MÁXIMA** (Referência Estadual) |
| **Exposição de Crise** | Local | Regional / Governamental |

## 4. Matriz de Risco

### 4.1 Risco Técnico-Operacional
- **Explosão de Handshake**: Saturação do gateway por volume simultâneo acima do limite testado em lab.
- **Mesh Shadowing**: Estruturas físicas do Julinho gerando zonas de isolamento persistente.
- **Latência de Sync**: Degradação do P95 por concorrência de canal.

### 4.2 Risco Político-Reputacional
- **Impacto Coletivo**: Problema em 1 tablet pode ser amplificado pelo volume de alunos presentes.
- **Sensibilidade de Mídia**: Unidade com histórico de atenção da imprensa e comunidade escolar.
- **Efeito Dominó**: Uma falha sistêmica na R5 pode comprometer a confiança em toda a expansão Capital.

## 5. Protocolo de Crise Nível 1 (Alta Visibilidade)
Em caso de SEV-1 na R5:
- **Ativação**: Imediata por qualquer autoridade de STOP nomeada.
- **Pausa Técnica**: Bloqueio de novas entradas em janela operacional mínima, conforme cadeia de comando do Dia Zero. Meta preliminar de até 2 minutos, pendente de validação operacional.
- **Comunicação**: Fluxo centralizado na Liderança Executiva; proibida manifestação técnica ad-hoc.
- **Registro**: Obrigatoriedade de template individual de ocorrência para 100% dos eventos.

## 6. Decisões Explicitamente NÃO Tomadas
Para evitar desvios durante o planejamento:
- **NÃO** definimos parâmetros finais de fracionamento C1/C2.
- **NÃO** autorizamos mobilização ou transporte de frota.
- **NÃO** redefinimos thresholds de performance da Fase 2.
- **NÃO** abrimos patches técnicos preventivos na baseline `bb64cd4`.

## 7. Premissas e Hipóteses Pendentes
- **Premissa**: A baseline `bb64cd4` é imutável nesta fase de planejamento.
- **Hipótese**: O fracionamento por blocos físicos do Julinho é suficiente para diluir a carga de handshake (pendente de vistoria geométrica).
- **Dependência**: Debrief 24h real da R4C para calibrar buffers de resiliência.

---
**Baseline de Referência**: `bb64cd4`  
**Status**: `[P] PLANEJAMENTO ESTRATÉGICO CONDICIONADO`  
**Fonte de Verdade**: Hipótese Técnica / Revisão Documental  
**Nota**: Não substitui campo real.
