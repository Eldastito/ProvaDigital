# 📝 Checklist de Pré-Observabilidade: Rerun R4C POA
**AVISO**: Este checklist é de execução OBRIGATÓRIA antes do início da **Tentativa Oficial 2 (Rerun)** do Mock Seco em Porto Alegre.

---

## 1. Validação de Escrita (Pré-Voo)
O objetivo é garantir que o coletor de telemetria está operando antes de submeter a carga massiva.

- [ ] **Teste de Pulso**: Realizar uma inserção manual de um evento de teste em `public.exam_events` e verificar se o registro aparece instantaneamente no banco.
- [ ] **Auditoria de Permissões**: Confirmar que o `service_role` ou a role da API tem permissão de `INSERT` na tabela `PilotExecutionLog`.
- [ ] **Sync de Logs**: Verificar se os logs do Postgres/API estão sendo capturados pelo dashboard de monitoramento regional.

---

## 2. Microteste de Campo (Smoke Test)
- [ ] **Carga de 1 Sala**: Submeter apenas 1 sala (máx. 60 tablets) e verificar o fechamento do handshake no console de governança antes de liberar as outras 4 salas.
- [ ] **Validação de Timestamps**: Garantir que o relógio dos tablets, gateways e banco de dados estão sincronizados (desvio máximo aceitável: 2s).

---

## 3. Gestão e Monitoramento em Tempo Real
- [ ] **Responsável Nominal**: Designar 1 engenheiro de observabilidade para monitorar os logs *tail -f* durante o burst de 20s.
- [ ] **Captura de Evidência Imediata**: Exportar o dump da tabela `PilotExecutionLog` em formato CSV/JSON imediatamente após o encerramento da janela de handshake.

---

## 4. Critério de Aborto (Kill Switch)
- [ ] **Abortar Rerun** se o primeiro lote de 60 tablets não gerar telemetria visível em menos de 1 minuto. Não prosseguir para o burst de 300 se a observabilidade estiver cega.

---
**Status de Prontidão**: [ ] Aguardando Execução  
**Data Prevista**: ____/____/2026  
**Responsável**: ______________________
