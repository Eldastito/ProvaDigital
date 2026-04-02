# Matriz de Seleção Técnica: R5 (E.E. Júlio de Castilhos)

**Objetivo**: Analisar a viabilidade técnica e topológica do Julinho para sustentar o baseline de resiliência da Fase 2.

> [!WARNING]
> **HIPÓTESE TÉCNICA**: Este documento contém suposições teóricas que devem ser validadas por vistoria física e logs reais da R4C.

---

## 1. Mapeamento Preliminar de Densidade
- **Volume Estimado**: > 800 dispositivos nominais.
- **Distribuição**: Múltiplos pavilhões com salas de aula heterogêneas.
- **Pontos Críticos**: Pátio central e corredores de acesso simultâneo (Gargalos de Handshake).

## 2. Hipóteses de Handshake (C1/C2)
- **C1 (Início)**: Risco de "explosão concorrente" durante o disparo em massa.
- **C2 (Retomada)**: Necessidade de fracionamento por localização física para evitar saturação de Gateway.
- **Dependência**: Os thresholds finais de handshake dependem do comportamento observado no Inácio Montanha.

## 3. Hipóteses de Resiliência Mesh
- **Zonas de Sombra**: Hipótese de que a geometria física da unidade exija reforço de cobertura e reposicionamento de nós de malha, pendente de vistoria técnica.
- **Saturação de Canal**: Risco de colisão de pacotes em áreas de alta concentração de salas.

## 4. Decisões Explicitamente NÃO Tomadas
- **NÃO** validamos a geometria de handshake sem vistoria técnica real.
- **NÃO** definimos a quantidade final de gateways por pavilhão.
- **NÃO** estabelecemos horários de disparo fracionado.
- **NÃO** alteramos a lógica de `sessionIsolation` para atender a escala do Julinho.

## 5. Critérios de Aceitação e Validação
Para destravar a transição de "Planejamento" para "Mobilização":
1. **Veredito R4C**: Emissão de `VEREDITO_CAMPO_F2_R4C_POA.md` com resultado GO limpo, compatível com a promoção da baseline da Fase 2.
2. **Vistoria Geométrica**: Validação in-loco das hipóteses de zona de sombra.
3. **Teste Sintético Escalado**: Simulação sintética indicando plausibilidade de que o fracionamento proposto atenda ao buffer de cauda aceitável, sujeita à validação real.

---
**Baseline**: `bb64cd4`  
**Status**: `[P] HIPÓTESE TÉCNICA (PRÉ-CAMPO)`  
**Fonte de Verdade**: Simulação Sintética / Estresse Teórico  
**Nota**: Não substitui campo real.
