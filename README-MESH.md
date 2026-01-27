# 🌐 Rede Mesh Offline - Guia Completo

## 📋 Visão Geral

Sistema de comunicação offline entre tablets usando **rede mesh P2P via WebRTC**, permitindo que provas sejam aplicadas sem conexão com internet.

### Arquitetura

```
Tablet Roteador (Hotspot WiFi)
    ↓
Servidor Local (Signaling)
    ↓
WebRTC P2P → Mesh Network
    ↓
Professor Dashboard + Alunos (Telemetria)
```

---

## 🚀 Setup Rápido

### 1. Tablet Roteador (Coordenador)

```typescript
import { RouterTabletSetup } from './modules/runner/router/RouterTabletSetup';

// No componente principal
<RouterTabletSetup 
  eventId="evento-123"
  schoolId="escola-456"
  onReady={() => console.log('Roteador pronto!')}
/>
```

**O que faz:**
- Cria hotspot WiFi (ex: `ExamePad-ESCOLA-EVT123`)
- Inicia servidor HTTP na porta 8080
- Ativa signaling WebSocket

**Credenciais geradas:**
- SSID: `ExamePad-[SchoolID]-[EventID]`
- Senha: 12 caracteres aleatórios

---

### 2. Dashboard Professor

```typescript
import { LiveDashboard } from './modules/runner/professor/LiveDashboard';
import { getMeshNetwork } from './services/meshNetworkService';

// 1. Conectar à mesh
await getMeshNetwork().initialize({
  signalingServerUrl: 'http://192.168.43.1:8080',
  roomId: eventId,
  nodeId: `prof_${Date.now()}`,
  nodeType: 'PROFESSOR',
  nodeName: 'Professor João'
});

// 2. Renderizar dashboard
<LiveDashboard 
  eventId={eventId}
  examId={examId}
  totalQuestions={30}
/>
```

**Funcionalidades:**
- ✅ Grid de alunos em tempo real
- ✅ Progresso individual
- ✅ Detecção de violações
- ✅ Enviar alertas (individual/broadcast)
- ✅ Filtros (Normal/Atenção/Violação)

---

### 3. StudentApp (Aluno)

#### 3.1. Conectar à Mesh

```typescript
import { getMeshNetwork } from './services/meshNetworkService';
import { getTelemetryService } from './services/telemetryService';
import { getAlertingService } from './services/alertingService';
import { useNetworkStore, useNetworkSync } from './services/stores/useNetworkStore';

// No início da prova (após login)
const initializeMesh = async () => {
  // 1. Conectar à mesh
  await getMeshNetwork().initialize({
    signalingServerUrl: 'http://192.168.43.1:8080',
    roomId: studentData.eventId,
    nodeId: studentData.id,
    nodeType: 'STUDENT',
    nodeName: studentData.name
  });

  // 2. Iniciar telemetria
  await getTelemetryService().start({
    studentId: studentData.id,
    studentName: studentData.name,
    examId: studentData.examId,
    eventId: studentData.eventId,
    totalQuestions: actualItems.length
  });

  // 3. Iniciar sistema de alertas
  getAlertingService().initialize({
    userId: studentData.id,
    userName: studentData.name,
    userType: 'STUDENT'
  });

  // 4. Configurar store
  useNetworkStore.getState().setNodeConfig({
    nodeId: studentData.id,
    nodeName: studentData.name,
    nodeType: 'STUDENT',
    eventId: studentData.eventId
  });

  // 5. Sincronizar com store
  const { setupCallbacks, syncMesh } = useNetworkSync();
  setupCallbacks();
  
  // Sync inicial e periódico
  syncMesh();
  setInterval(syncMesh, 5000);
};
```

#### 3.2. Adicionar NetworkStatus

```typescript
import { NetworkStatusInline } from './modules/runner/student-app/NetworkStatus';

// No header do StudentApp
<div className="header">
  <h1>Prova Digital</h1>
  <NetworkStatusInline />
</div>
```

#### 3.3. Atualizar Telemetria

```typescript
import { getTelemetryService } from './services/telemetryService';

// Quando mudar de questão
const handleNextQuestion = () => {
  setCurrentQuestionIdx(prev => prev + 1);
  
  // Enviar telemetria imediatamente
  getTelemetryService().updateCurrentQuestion(currentQuestionIdx + 1);
};

// Quando responder
const handleOptionSelect = async (qId: string, optId: string) => {
  const newAnswers = { ...answers, [qId]: optId };
  setAnswers(newAnswers);
  
  // Atualizar contagem
  const count = Object.keys(newAnswers).length;
  getTelemetryService().updateAnsweredCount(count);
};

// Quando detectar violação
const onViolation = (reason: string) => {
  getTelemetryService().logViolation({
    studentId: studentData.id,
    eventType: reason, // 'TAB_SWITCH', 'NO_FACE', etc
    severity: 'MEDIUM',
    timestamp: Date.now()
  });
};
```

#### 3.4. Receber Alertas

```typescript
import { getAlertingService } from './services/alertingService';

const [showAlert, setShowAlert] = useState(false);
const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);

// Configurar callback
useEffect(() => {
  getAlertingService().setOnAlertReceived((alert) => {
    setCurrentAlert(alert);
    setShowAlert(true);
    
    // Tocar som de notificação
    new Audio('/alert-sound.mp3').play();
  });
}, []);

// Modal de alerta
{showAlert && currentAlert && (
  <div className="alert-modal">
    <h3>🔔 Alerta do Professor</h3>
    <p>{currentAlert.message}</p>
    <button onClick={() => {
      getAlertingService().markAsRead(currentAlert.id);
      setShowAlert(false);
    }}>
      OK, Entendi
    </button>
  </div>
)}
```

#### 3.5. Botão "Pedir Ajuda"

```typescript
import { requestHelp } from './services/alertingService';

// No componente
<button 
  onClick={() => requestHelp('Tenho uma dúvida!')}
  className="help-button"
>
  🆘 Pedir Ajuda
</button>
```

---

## 🧪 Testes

### Teste 1: Conectividade Básica (2 tablets)

1. Configurar tablet roteador
2. Conectar 1 tablet aluno ao hotspot
3. Verificar no dashboard se aparece
4. Verificar telemetria (progresso, bateria)

**Esperado:** ✅ Aluno aparece no dashboard em <5s

---

### Teste 2: Comunicação (3+ tablets)

1. Conectar professor + 2 alunos
2. Professor envia alerta broadcast
3. Verificar se ambos alunos recebem
4. Aluno pede ajuda
5. Verificar se professor recebe

**Esperado:** ✅ Alertas recebidos em <2s

---

### Teste 3: Stress Test (10-40 tablets)

1. Conectar 10+ tablets simultaneamente
2. Todos respondem questões
3. Verificar dashboard atualiza
4. Enviar alertas em massa

**Esperado:** ✅ Dashboard atualiza em <10s

---

## 🔧 Troubleshooting

### Problema: Aluno não aparece no dashboard

**Causas:**
- Não conectado ao hotspot WiFi
- Servidor signaling não rodando
- Firewall bloqueando porta 8080

**Solução:**
```bash
# Verificar IP do servidor
ipconfig
# Deve ser 192.168.43.1

# Testar conectividade
curl http://192.168.43.1:8080/health
# Deve retornar {"status":"ok"}

# Verificar logs
console.log(getMeshNetwork().getStats());
```

---

### Problema: Telemetria não atualiza

**Causas:**
- TelemetryService não iniciado
- Mesh não conectada

**Solução:**
```typescript
// Verificar status
const telemetry = getTelemetryService();
console.log(telemetry.getStats());
// isActive deve ser true

// Reiniciar se necessário
telemetry.stop();
await telemetry.start({ ... });
```

---

### Problema: Alertas não chegam

**Causas:**
- AlertingService não inicializado
- Callback não configurado

**Solução:**
```typescript
const alerting = getAlertingService();
console.log(alerting.getStats());
// isActive deve ser true

// Configurar callback
alerting.setOnAlertReceived((alert) => {
  console.log('Alert received:', alert);
});
```

---

## 📊 Monitoramento

### Network Store (Zustand)

```typescript
import { useNetworkStore } from './services/stores/useNetworkStore';

// Em qualquer componente
const isConnected = useNetworkStore(state => state.isConnected);
const quality = useNetworkStore(state => state.connectionQuality);
const nodes = useNetworkStore(state => state.nodes);
const alerts = useNetworkStore(state => state.alerts);

console.log('Conectado:', isConnected);
console.log('Qualidade:', quality); // excellent/good/fair/poor/offline
console.log('Nodes:', nodes.length);
console.log('Alertas não lidos:', alerts.filter(a => !a.read).length);
```

### Redux DevTools

O Zustand é compatível com Redux DevTools. Instale a extensão e veja o estado em tempo real.

---

## 🎯 Checklist de Integração

### Tablet Roteador
- [ ] RouterTabletSetup renderizado
- [ ] Hotspot criado
- [ ] Servidor rodando na porta 8080
- [ ] Página de status acessível

### Dashboard Professor
- [ ] Mesh inicializada
- [ ] LiveDashboard renderizado
- [ ] Alunos aparecem quando conectam
- [ ] Alertas podem ser enviados

### StudentApp
- [ ] Mesh inicializada após login
- [ ] TelemetryService started
- [ ] AlertingService initialized
- [ ] NetworkStatus visible
- [ ] Callback de alertas configurado
- [ ] Botão "Pedir Ajuda" funcionando
- [ ] Telemetria atualiza ao responder

### Store (Zustand)
- [ ] useNetworkStore criado
- [ ] Callbacks configurados
- [ ] Persistência funcionando
- [ ] Selectors funcionando

---

## 📦 Dependências

```json
{
  "dependencies": {
    "socket.io-client": "^4.x",
    "simple-peer": "^9.x",
    "zustand": "^4.x",
    "express": "^4.x",
    "socket.io": "^4.x",
    "cors": "^2.x"
  }
}
```

---

## 🌟 Boas Práticas

### 1. Sempre limpar ao desmontar

```typescript
useEffect(() => {
  // Setup
  initializeMesh();
  
  return () => {
    // Cleanup
    getMeshNetwork().shutdown();
    getTelemetryService().stop();
    getAlertingService().stop();
  };
}, []);
```

### 2. Tratar erros de conexão

```typescript
try {
  await getMeshNetwork().initialize({ ... });
} catch (error) {
  console.error('Falha ao conectar mesh:', error);
  // Fallback: modo offline puro
}
```

### 3. Feedback visual para o usuário

```typescript
const isConnected = useNetworkStore(state => state.isConnected);

{!isConnected && (
  <div className="warning">
    ⚠️ Sem conexão com rede mesh. Dados serão enviados depois.
  </div>
)}
```

---

## 🔗 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| [wifiHotspotService.ts](./services/wifiHotspotService.ts) | Cria hotspot WiFi |
| [localServerService.ts](./services/localServerService.ts) | Servidor HTTP + Socket.io |
| [webrtcClient.ts](./services/webrtcClient.ts) | Cliente WebRTC P2P |
| [meshNetworkService.ts](./services/meshNetworkService.ts) | Rede mesh |
| [telemetryService.ts](./services/telemetryService.ts) | Telemetria automática |
| [alertingService.ts](./services/alertingService.ts) | Sistema de alertas |
| [useNetworkStore.ts](./services/stores/useNetworkStore.ts) | Store global |
| [RouterTabletSetup.tsx](./modules/runner/router/RouterTabletSetup.tsx) | UI roteador |
| [LiveDashboard.tsx](./modules/runner/professor/LiveDashboard.tsx) | Dashboard professor |
| [NetworkStatus.tsx](./modules/runner/student-app/NetworkStatus.tsx) | Status rede |

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [README principal](./README.md)
- [Documentação de segurança](./SECURITY.md)
- [Guia PWA](./PWA_INSTALLATION_GUIDE.md)

---

**Versão:** Sprint 2 - 100% Completo ✅  
**Última Atualização:** 2026-01-27  
**Desenvolvido por:** Equipe ExamePad
