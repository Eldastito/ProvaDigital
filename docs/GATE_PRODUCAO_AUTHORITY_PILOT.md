# Checkpoint de Governança: Gate de Produção — Authority Pilot

## 📋 1. Veredito Geral
- **Status**: 🟨 **EM AVALIAÇÃO** (Aprovação condicionada a este Checkpoint)
- **Data**: 20/03/2026
- **Escopo**: Rollout R1 (Assistido)

---

## 🛡️ 2. Gates de Prontidão (Checklist Binário)

### A. GO Técnico
- [ ] **Segurança**: Zero vulnerabilidades críticas conhecidas em Handshake/Mesh.
- [ ] **Contract Integrity**: Versionamento V1 travado e retrocompatível.
- [ ] **Rollback**: Script de reversão local testado e funcional.
- [ ] **Observabilidade**: Telemetria global emitindo sinais (RED/USE).

### B. GO Operacional
- [ ] **Runbooks**: Documentados para todos os alertas P0/P1.
- [ ] **Owners**: Pessoas nomeadas para Resposta a Incidente e Suporte.
- [ ] **Dashboards**: Acesso garantido à torre de controle (Executivo/Operacional).
- [ ] **Escalonamento**: Canal de crise definido.

### C. GO de Privacidade (LGPD)
- [ ] **Reveals**: Motor de trilha auditável e restrição de papéis validado.
- [ ] **Retention**: Purge atômico funcional e purge_baseline estabelecido.
- [ ] **Compliance**: Relatórios de evidência gerados para as fases 6-10.

---

## 📉 3. Guardrails do Rollout R1 (Piloto Assistido)
- **Tenant Piloto**: [A DEFINIR - Sugestão: 1 Município com Unidade Controlada]
- **Janela de Execução**: Máximo 4h de operação assistida.
- **Change Freeze**: Bloqueio total de deploys no core do Pilot durante a janela.
- **Critério de Aborto (Rollback)**: 
  - Falha de Handshake > 30% por mais de 10 min.
  - Alerta P0 de Privacidade disparado.
  - Inconsistência de dados detectada no sync de retorno.

---

## 👤 4. Matriz de Responsabilidade (RIPD/SRE)
- **Lead Operacional**: [Nome]
- **Security/Privacy Lead**: [Nome]
- **SRE/Monitoring**: [Nome]
- **Stakeholder Pedagógico**: [Nome]

---

## 🏁 5. Riscos Abertos & Decisões
1. **Risco**: Dependência de conectividade local rádio (BLE/Wi-Fi).
   - *Mitigação*: Equipe técnica local com dispositivos de redundância.
2. **Decisão**: Limite de Reveal PII durante a prova.
   - *Ação*: Permitido apenas sob incidente pedagógico e supervisor presente.
