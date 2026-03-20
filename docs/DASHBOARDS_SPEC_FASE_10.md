# Especificação de Dashboards — Authority Pilot (Fase 10)

## 🏛️ 1. Dashboard Executivo (Global Status)
**Foco**: Resumo de alto nível para tomada de decisão.
- **KPIs Centrais**:
  - `Health Score` Global (Baseado em SLOs).
  - % de Escolas Operacionais (Sync ativo).
  - Volume de Dados Trafegados (24h).
  - Saldo de Incidentes P0 Abertos.
- **Visão Geográfica**: Heatmap de saúde por Município/Organização.

## 🛠️ 2. Dashboard Operacional (School/Room Drill-down)
**Foco**: Diagnóstico rápido de falhas em campo.
- **RED Model (Malha Mesh)**:
  - **Rate**: Handshakes/min e Syncs/min.
  - **Errors**: Taxa de rejeição de frames e falhas de pareamento.
  - **Duration**: P95 Latência de Handshake e Tempo de Reconciliação.
- **Filtros**: `TenantID` -> `SchoolID` -> `RoomID`.

## 🔍 3. Dashboard Investigativo (Deep Drill)
**Foco**: Troubleshooting técnico.
- **Correlação**: Lista de Spans de Trace com falha vinculados a Logs estruturados.
- **Event Timeline**: Cronologia de eventos de mudança de estado e pareamento para um determinado PeerID.
