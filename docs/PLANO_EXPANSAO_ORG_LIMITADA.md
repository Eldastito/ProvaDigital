# Plano Operacional: Expansão Municipal Controlada (Fase 3B.1)

## 1. Objetivo da Fase 3B.1
O objetivo desta fase é realizar uma expansão municipal limitada e monitorada do Authority Pilot, garantindo que o motor Core mantenha a integridade de isolamento e performance em um cenário de multi-organização real. O escopo é restrito aos municípios autorizados e apenas para operações de leitura (**Read-only / Analytics / Metadata only**).

## 2. Baseline Normativa
- **Versão do Motor:** GLOBAL v4 Remediada.
- **Configuração:** Authority Pilot Habilitado (Analytics/Metadata Read-Only).
- **Rollback:** Mecanismo de Kill Switch validado e operante.

## 3. Municípios Autorizados e Ordem de Ativação
A ativação deve ser estritamente sequencial, respeitando os checkpoints de cada etapa:

1. **Alvorada** (Primeira ativação)
2. **Viamão** (Após aprovação do checkpoint Alvorada)
3. **Gravataí** (Após aprovação do checkpoint Viamão)

## 4. Metodologia de Medição
O acompanhamento de performance deve seguir o padrão oficial estabelecido nos relatórios de gate:
- **Métrica Mestre:** **p95 End-to-End**.
- **Target:** < 5.0ms (P95) e < 1.0ms (Média).
- **Consistência:** Todas as comparações e reports desta fase devem usar a mesma metodologia de leitura final (End-to-End). Métricas *per decision* podem ser usadas apenas como apoio diagnóstico.

## 5. Checkpoint de Ativação por Município
Cada transição entre municípios exige um ritual formal de aprovação:
- **Janela de Observação:** Mínimo de 30 minutos de tráfego simulado ou real monitorado.
- **Coleta de Evidências:** Registro das métricas p95 E2E.
- **Validação de Isolamento:** Testes de bloqueio cross-municipality.
- **Registro GO/NO-GO:** Documentação formal do resultado.
- **Bloqueio de Progressão:** A ativação do município seguinte é vedada sem o registro de aprovação formal do anterior.

## 6. Critérios de Avanço (GO / NO-GO)
- **Ausência de Regressão**: Não houve aumento injustificado de latência ou falhas de decisão no município anterior.
- **Estabilidade de Isolamento**: Testes confirmam que o novo município não acessa dados de POA/Canoas e vice-versa.
- **Drill-down Íntegra**: Autoridade municipal sobre escolas funciona sem vazamento intermunicipal.

## 7. Regras de Rollback
- **Disparo**: Rollback imediato se detectada anomalia crítica (ex: vazamento de dados, falha de autoridade, latência > 10ms sustentada).
- **Mecanismo**: Uso do **Kill Switch** centralizado via Feature Flag.
- **Comportamento**: Cessação imediata da decisão pelo Core, devolvendo controle total ao Legado.

## 8. Stop-the-line (Gatilhos de Interrupção)
A expansão deve ser suspensa imediatamente se ocorrer:
- **Divergência Documental**: Inconsistência entre dados reais e registros de governança.
- **Falha de Isolamento**: Acesso a recurso fora da árvore hierárquica.
- **Regressão Crítica**: Falha em testes de sanidade ou regressão automatizada.
- **Violação de Escopo**: Qualquer tentativa de escrita (Write) detectada pelo Core.
- **Acesso Fora da Whitelist**: Tentativa de acesso a módulos não autorizados (ex: `STUDENT_PEDAGOGICAL_DATA`).

## 9. Evidências Obrigatórias por Ativação
Cada ativação deve ser acompanhada de um registro auditável contendo:
- **Metadados**: Data/Hora da execução, Comando utilizado e Exit Code.
- **Performance**: Métrica p95 End-to-End observada (deve ser < 5.0ms).
- **Sanidade**: Referência do script/suíte executada e resultado resumido.
- **Isolamento**: Evidência explícita de bloqueio de isolamento validado.
- **Decisão**: Registro formal do GO / NO-GO assinado.

---
**Restrição Operacional:** Esta fase veda qualquer escala para nível Estadual ou Global.

*Responsável Técnico: Governança Core*
