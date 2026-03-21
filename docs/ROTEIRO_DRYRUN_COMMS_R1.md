# Roteiro: Dry-run de Comunicação — Rollout R1 Viamão

## 🎯 Objetivo
Validar a cadeia de comando, SLA de resposta e a ponte entre canais P1 (Voz) e P2 (Slack/Discord) em 20 minutos.

---

## 🕒 Cronograma (20 min)

### 00:00 - 00:05 | Ping Nominal & Disponibilidade
- **Ação**: SRE envia ping para Titulares e Substitutos em seus respectivos canais.
- **Sucesso**: Todos respondem "Ativo para R1" dentro de 2 min.

### 05:00 - 08:00 | Cenário 1: Falha de Campo (P1 -> P2)
- **Simulação**: Marcos (Champion) informa no canal de Voz: "Sala 05: 5 tablets com erro de pareamento persistente".
- **Teste**: SRE (Lucas ou Carla) deve confirmar o recebimento no canal de Voz e transcrever o incidente para o canal técnico (P2) em <1 min.

### 08:00 - 12:00 | Cenário 2: Escalonamento P0 (Privacidade)
- **Simulação**: Lucas (SRE) detecta vazamento de log com PII e aciona Roberto (DPI).
- **Teste**: Roberto (DPI) deve responder com "PII Contained" ou "Abort Recommended" em <3 min.

### 12:00 - 15:00 | Cenário 3: Falha de Titular (Handover)
- **Simulação**: Lucas (SRE) sai do canal ("Indisponível").
- **Teste**: Carla (Substituto) deve enviar: "Assumindo Lead SRE — Ready for Decisions".

### 15:00 - 20:00 | Cenário 4: Autoridade Institucional
- **Simulação**: SRE e DPI recomendam Aborto.
- **Teste**: Sandra (Diretora) recebe o resumo institucional e responde: "Janela Suspensa - Autorizado Contingência Pedagógica".

---

## 📝 Registro de Resultados
| Cenário | Tempo Resp | Sucesso? | Observação |
| :--- | :--- | :--- | :--- |
| Ping Nominal | - | - | - |
| Ponte P1-P2 | - | - | - |
| Escalonamento P0| - | - | - |
| Handover Substituto| - | - | - |
| Validação Sandra| - | - | - |

---
**GO WITH GUARDRAILS: Comunicação validada é operação segura.**
