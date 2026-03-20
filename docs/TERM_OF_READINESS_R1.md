# Termo de Prontidão Operacional Revisado: Rollout R1 — Viamão

## 📋 1. Identificação e Versão Autorizada
- **Unidade**: EMEF Central (Viamão/RS)
- **Escalabilidade R1**: 2 Salas | ~50 Alunos
- **Versão Autorizada (IMMUTABLE)**: SHA `9838aac`
- **Change/Config Freeze**: Ativo. Proibido deploy, hotfix ou alteração de parâmetros de rede/privacidade.

---

## 🛡️ 2. Gates de Execução (Checkpoint de Campo)
- **T-24h (Readiness Check)**: Confirmação de Equipe, Tablets Conferidos, Champion Local e Dashboards ativos.
- **T-1h (Go/No-Go Check)**: Bateria > 85%, Tablets reserva (10%), Pares carregados e Teste de Handshake por sala.
- **T+0 (Liberação)**: Autorização formal do Lead SRE para início da prova.

---

## 🎓 3. Contingência Pedagógica (Abort Criteria)
Em caso de **Aborto Técnico (Rollback)**:
- **Plano B**: Aplicação imediata da contingência pedagógica pré-definida (Material Impresso ou Reaplicação Offline Legada).
- **Responsável**: Coordenador Pedagógico local comunica alunos/professores.
- **Autoridade de Aborto**: Lead Operacional + Direção se falha persistir > 15 min.

---

## 📡 4. Matriz de Comunicação e SLA
| Canal | Ator A -> Ator B | SLA Máximo | Escalonamento |
| :--- | :--- | :--- | :--- |
| **P1: Voz/Rádio** | Professor -> Suporte | 2 min | Champion Local |
| **P2: Chat/Dev** | Suporte -> SRE | 5 min | Lead Técnico |
| **Crítica: P0** | SRE -> DPI (Privacidade) | Imediato | Lead Governança |

---

## ✅ 5. Critérios de Sucesso Objetivos (Aprovação)
O Piloto R1 será considerado **APROVADO** se:
1. Handshake estável em 100% dos tablets em < 5 min.
2. Sincronização de saída concluída com 0 inconsistencies.
3. **Zero** incidentes P0 de Privacidade ou Governança.
4. Nenhuma intervenção manual necessária no motor Outbox.
5. Feedback positivo do Champion Local quanto à fluidez pedagógica.

---

## 📝 6. Registro de Exceções
Qualquer desvio do protocolo (ex: uso de tablet reserva, delay de sync) deve ser registrado no log de exceções da janela, contendo: **Horário | Motivo | Responsável | Decisão**.

---

## 🏁 Veredito de Prontidão: **GO (BLINDAGEM TOTAL R1)**
Assinado em: 20/03/2026 | SHA `9838aac`
