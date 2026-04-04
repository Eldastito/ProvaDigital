# Plano de Implementação: Fase 4 — Interface de Monitoramento

Este plano detalha a construção da interface de monitoramento do Ciclo de Redundância, transformando a telemetria técnica de E1, E2 e E3 em visibilidade operacional para o coordenador de prova.

## User Review Required

> [!IMPORTANT]
> **DIRETRIZ DE ESCOPO**: A interface será puramente observacional. Não haverá mecanismos de "escrita" ou "correção" de banco de dados pela UI nesta fase para preservar a integridade do núcleo.
> - **Matriz de Alerta**: Unificação de `LOCKED` e `IO_ERROR` na família "Persistência Secundária Degradada".
> - **Malha Mesh**: Exibição de taxa de recepção bruta vs descartes técnicos.

## Proposed Changes

### [Component] UI / Dashboard
#### [NEW] [RedundancyMonitorView.tsx](file:///c:/Users/miche/Downloads/examepad-saas-prova-digital/modules/admin/views/RedundancyMonitorView.tsx)
- Central de monitoramento com 3 painéis principais:
    - **Persistence Health**: Status IDB (OK) e SQLite (OK/Degradado).
    - **Mesh Network**: Gráfico de barras simples com Emissões vs Recepções e lista de descartes (Skew, Replay, Duplicate).
    - **BLE Presence**: Grade de dispositivos com status de presença e indicador de oscilação anômala.

#### [NEW] [AlertNotificationCenter.tsx](file:///c:/Users/miche/Downloads/examepad-saas-prova-digital/modules/admin/components/AlertNotificationCenter.tsx)
- Componente de toast/banner para alertas críticos (Nível Vermelho) baseados na taxonomia canônica.

### [Component] Service Layer / Bridge
#### [MODIFY] [nativeBridgeService.ts](file:///c:/Users/miche/Downloads/examepad-saas-prova-digital/services/nativeBridgeService.ts)
- Adição de um `EventEmitter` ou padrão `Observer` para que a UI possa se inscrever em eventos de erro/status sem injetar lógica no fluxo de salvamento.

---

## Open Questions
- **Localização**: A UI deve ser acessível apenas para o perfil `Coordenador` ou estar disponível em um "Menu de Engenharia" escondido para todos os perfis durante a homologação?
- **Persistência do Log na UI**: Os alertas devem persistir entre sessões (localmente) ou serem apenas "em tempo real" (limpos ao recarregar o app)?

## Verification Plan

### Automated Tests
- Testes unitários para o mapeador de códigos canônicos (`E2_...`, `E3_...`) para as cores/severidades da UI.

### Manual Verification
- Utilização de `adb shell` para injetar logs falsos e verificar se a UI reflete corretamente o estado "Degradado" e "Crítico".
- Validação visual do dashboard com 12 dispositivos simulados (Layout Stress).
