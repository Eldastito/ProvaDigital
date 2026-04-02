# Registro de Ocorrência — LOG-CB-PTR-ERR-001

**Objetivo:** registrar de forma auditável cada ocorrência de ponteiro inconsistente detectada em campo durante o R4C POA.

- **ID da Ocorrência:** ______
- **Data/Hora:** ______
- **Sala:** ______
- **Tablet:** ______
- **Aluno/Contexto:** ______
- **AttemptId ativo:** ______
- **Responsável pela coleta:** ______

---

## 1. Detecção

- **Evento detectado:** `LOG-CB-PTR-ERR-001`
- **Mensagem registrada:**
> `[LOG-CB-PTR-ERR-001] Ponteiro inconsistente para contexto {contextKey}. Status: {status}`

- **Tipo de inconsistência percebida:**
  - [ ] ponteiro ausente
  - [ ] ponteiro apontando para tentativa stale
  - [ ] divergência de status
  - [ ] outro: ______

---

## 2. Recuperação

- **Dual-Read acionado:** [ ] Sim [ ] Não
- **Reconstrução silenciosa concluída:** [ ] Sim [ ] Não
- **Tempo total de reconstrução:** ___ ms
- **Nova versão criada indevidamente:** [ ] Sim [ ] Não
- **Impacto perceptível ao aluno:** [ ] Sim [ ] Não

---

## 3. Integridade

- **Status anterior esperado:** ______
- **Status encontrado:** ______
- **Status final após correção:** ______
- **Houve regressão proibida?** [ ] Sim [ ] Não
- **Houve duplicidade de sessão?** [ ] Sim [ ] Não

---

## 4. Classificação da Ocorrência

- [ ] Recuperação silenciosa nominal
- [ ] Recuperação com alerta operacional
- [ ] Recuperação parcial
- [ ] Falha crítica

**Causa provável:**
> ______________________________________

**Ação corretiva:**
> ______________________________________

**Fechamento:**
> ______________________________________
