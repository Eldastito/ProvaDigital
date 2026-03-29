# 🧪 Relatório de Ensaio Sintético: Calibração R4C POA
**AVISO CRÍTICO**: Este documento contém apenas **BENCHMARKS PROJETADOS (SINTÉTICOS)**. Não constitui evidência oficial de campo e não substitui os dados reais necessários para o encerramento do Gate R4C. As métricas abaixo representam comportamento do simulador/harness em ambiente controlado e **não são equivalentes aos tempos de handshake end-to-end (segundos/minutos) usados no Gate oficial de campo**.

---

## 1. Objetivo da Calibração
Validar o comportamento do motor de governança do **Authority Pilot** sob carga de 5 salas simultâneas (Projeção: 300 tablets), visando calibrar os limites de latência e recuperação para o próximo **Rerun Oficial** em Porto Alegre.

---

## 2. Benchmarks Projetados (Cenário 5 Salas)
*Dados obtidos via simulador de estresse regional (Burst Script).*

| Métrica Projetada (Motor Interno) | Valor de Calibração (ms) | Status Sugerido para Rerun |
| :--- | :---: | :---: |
| **P95 do Simulador de Burst Interno** | **< 1.85ms** | Estável (Simulado) |
| **P99 do Simulador de Burst Interno** | **< 4.20ms** | Estável (Simulado) |
| **Taxa de Sucesso (Carga Local)** | **100%** | Conforme |
| **Recuperação Watchdog em Ensaio Sintético** | **~2.40s** | Seguro (Simulado) |

---

## 3. Análise de Comportamento (Observações Técnicas)
- **Isolamento Cross-Tenant**: Mantendo integridade total entre os 5 contextos municipais (POA, Canoas, Alvorada, Viamão, Gravataí).
- **Recuperação Automática**: O Watchdog demonstrou recuperação plena em ambiente simulado em menos de 3s, muito abaixo do limite mandatório de 15s.
- **Escalabilidade**: O sistema suporta o burst de 20s de pressão (handshake simultâneo) sem degradação do P95.

---

## 4. Recomendações para o Rerun Oficial
1. **Configuração do Lote**: Manter o limite de 300 tablets para a Tentativa Oficial 2.
2. **Coleta de Telemetria**: Priorizar a verificação imediata dos logs de `audit_logs` e `PilotExecutionLog` pós-ensaio para evitar o bloqueio por "Zero Telemetry".
3. **Threshold de Alerta**: Configurar o P95 End-to-End para disparar alerta se ultrapassar 1.5s em campo.

---
**Documento Gerado para Calibração Operacional**  
*Data: 28/03/2026*  
*Status: NÃO-OFICIAL / PROJEÇÃO SINTÉTICA*
