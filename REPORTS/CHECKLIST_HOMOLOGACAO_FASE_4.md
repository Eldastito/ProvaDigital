# Checklist Operacional — Homologação Funcional da Fase 4

## Interface de Monitoramento de Redundância

**Objetivo:** Validar se a interface de monitoramento é clara, útil e não induz interpretação errada para o coordenador de prova.

**Escopo:** Homologação funcional da UI apenas. Sem alterar código, sem reabrir E1/E2/E3, sem criar novos alertas durante a sessão.

---

## Pré-condições

- [ ] Rota `/coordinator/redundancy-monitor` acessível
- [ ] Perfil de acesso: Coordenador com resource `PLATFORM_HEALTH`
- [ ] Feature flag `FEATURE_REDUNDANCY_MONITOR` ativa
- [ ] Ambiente com dados de homologação ou simulação controlada
- [ ] Participantes presentes: 1 coordenador, 1 observador técnico, 1 registrador

**Duração estimada:** 30–45 minutos

---

## Cenário 1 — Leitura Inicial da Tela

**Objetivo:** Coordenador entende a tela sem explicação técnica prévia.

- [ ] Abrir `/coordinator/redundancy-monitor`
- [ ] Pedir ao coordenador que identifique:
  - [ ] Qual camada é a principal
  - [ ] Se há algo degradado
  - [ ] Se existe alerta exigindo ação
- [ ] **Tempo limite:** 60 segundos

| Campo | Valor |
|---|---|
| Horário | |
| Operador | |
| Tempo para entender | |
| Identificou saúde da persistência? | SIM / NÃO |
| Identificou saúde da mesh? | SIM / NÃO |
| Identificou presença BLE? | SIM / NÃO |
| Identificou alerta crítico (ou ausência)? | SIM / NÃO |
| Precisou de explicação técnica? | SIM / NÃO |
| **Status** | 🟢 GO / 🟡 CONDICIONADO / 🔴 NO-GO |
| Ajuste recomendado | |

**Critério de falha:** Coordenador precisa de explicação técnica para entender a tela.

---

## Cenário 2 — Persistência Secundária Degradada

**Objetivo:** Alertas `E2_SQLITE_LOCKED` / `E2_SQLITE_IO_ERROR` chamam atenção correta sem causar pânico.

- [ ] Simular ou reproduzir evento da família E2
- [ ] Verificar se alerta visual aparece imediatamente
- [ ] Perguntar ao coordenador: "O que esse alerta significa?"

| Campo | Valor |
|---|---|
| Horário | |
| Evento simulado | E2_SQLITE_LOCKED / E2_SQLITE_IO_ERROR |
| Alerta visual apareceu? | SIM / NÃO |
| Coordenador entendeu como secundária? | SIM / NÃO |
| Coordenador concluiu perda de prova? | SIM (FALHA) / NÃO (OK) |
| **Status** | 🟢 GO / 🟡 CONDICIONADO / 🔴 NO-GO |
| Ajuste recomendado | |

**Critério de falha:** Coordenador interpreta como perda de resposta primária ou entra em pânico.

---

## Cenário 3 — Logs Técnicos Não Geram Ruído

**Objetivo:** Eventos esperados não viram sirene operacional.

- [ ] Gerar eventos: `E3_DUPLICATE_RID`, `E3_REPLAY_REJECTED`, `E3_CLOCK_SKEW_INVALID`
- [ ] Verificar que aparecem no log técnico (Modo Técnico ligado)
- [ ] Verificar que **NÃO** disparam alerta no AlertOverlay

| Campo | Valor |
|---|---|
| Horário | |
| Eventos gerados | |
| Aparecem no log técnico? | SIM / NÃO |
| Disparam alerta visual? | SIM (FALHA) / NÃO (OK) |
| Coordenador foi interrompido? | SIM (FALHA) / NÃO (OK) |
| **Status** | 🟢 GO / 🟡 CONDICIONADO / 🔴 NO-GO |
| Ajuste recomendado | |

**Critério de falha:** AlertOverlay aciona notificação visual para evento técnico esperado.

---

## Cenário 4 — Presença BLE

**Objetivo:** Throttle visual de 2s mantém a experiência legível.

- [ ] Observar a tela com atividade BLE normal (~2 min)
- [ ] Observar comportamento com pequena oscilação de sinal
- [ ] Verificar se anomalia só aparece quando relevante (≥5 toggles em 60s)

| Campo | Valor |
|---|---|
| Horário | |
| Duração da observação | |
| Flicker visual excessivo? | SIM (FALHA) / NÃO (OK) |
| Presença compreensível? | SIM / NÃO |
| Anomalia refletida corretamente? | SIM / NÃO / NÃO APLICÁVEL |
| **Status** | 🟢 GO / 🟡 CONDICIONADO / 🔴 NO-GO |
| Ajuste recomendado | |

**Critério de falha:** UI "pisca" demais ou parece instável sem motivo prático.

---

## Cenário 5 — Saúde da Mesh

**Objetivo:** Indicadores simples comunicam o estado sem necessidade de gráfico.

- [ ] Pedir ao coordenador que responda:
  - [ ] A malha está saudável, degradada ou crítica?
  - [ ] A taxa atual parece aceitável?
  - [ ] Qual a diferença entre emissão e recepção válida?

| Campo | Valor |
|---|---|
| Horário | |
| Coordenador identificou estado (saudável/degradada/crítica)? | SIM / NÃO |
| Coordenador entendeu taxa bruta? | SIM / NÃO |
| Coordenador diferenciou emissão vs recepção? | SIM / NÃO |
| A informação atual foi suficiente para decidir o estado da mesh? | SIM / NÃO |
| Gráfico histórico agregaria valor operacional real? | SIM / NÃO |
| **Status** | 🟢 GO / 🟡 CONDICIONADO / 🔴 NO-GO |
| Ajuste recomendado | |

**Critério de falha:** Coordenador não consegue avaliar a saúde da mesh sem gráfico.

---

## Cenário 6 — Botão "Limpar Visão"

**Objetivo:** O botão não causa medo nem interpretação errada.

- [ ] Acionar "Limpar Visão"
- [ ] Verificar se a confirmação aparece
- [ ] Perguntar ao coordenador: "O que esse botão fez?"

| Campo | Valor |
|---|---|
| Horário | |
| Confirmação apareceu? | SIM / NÃO |
| Coordenador entendeu que é apenas visual? | SIM / NÃO |
| Coordenador teve insegurança sobre perda de dados? | SIM (FALHA) / NÃO (OK) |
| **Status** | 🟢 GO / 🟡 CONDICIONADO / 🔴 NO-GO |
| Ajuste recomendado | |

**Critério de falha:** Coordenador acredita que o botão apaga dados reais.

---

## Consolidação

### Resultado por cenário

| # | Cenário | Status | Observação |
|---|---|---|---|
| 1 | Leitura Inicial | | |
| 2 | Persistência Degradada | | |
| 3 | Logs Técnicos | | |
| 4 | Presença BLE | | |
| 5 | Saúde da Mesh | | |
| 6 | Limpar Visão | | |

### Veredito final

| Critério | Resultado |
|---|---|
| **🟢 GO** | Nenhum cenário crítico em `NO-GO` e no máximo 1 ajuste leve de UX |
| **🟡 GO CONDICIONADO** | Até 2 ajustes leves documentados, sem erro de interpretação crítica |
| **🔴 NO-GO** | Erro crítico de interpretação (ex: achar que perdeu prova), ruído excessivo ou degradação de fluidez |

### Decisão

- [ ] **GO** — Fase 4 validada para uso operacional
- [ ] **GO CONDICIONADO** — Fase 4 utilizável com ajustes de UX documentados
- [ ] **NO-GO** — Fase 4 requer revisão antes de uso operacional

---

**Assinaturas**

| Papel | Nome | Assinatura | Data |
|---|---|---|---|
| Coordenador | | | |
| Observador Técnico | | | |
| Registrador | | | |

---

> **NOTA:** Esta homologação valida apenas utilidade operacional da UI. A integridade técnica das camadas E1/E2/E3 foi validada nas Ondas 1–3. A Fase 4 não altera, corrige ou interfere no fluxo de persistência.
