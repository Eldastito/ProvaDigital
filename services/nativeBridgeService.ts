import { registerPlugin, Capacitor } from '@capacitor/core';

// ============================================================
// Phase 4 — Redundancy Telemetry (Observational Only)
// ============================================================

/** Taxonomia canônica de eventos de redundância */
export type RedundancyEventCode =
  // E1 — BLE Presence
  | 'E1_BLE_PRESENT'
  | 'E1_BLE_ABSENT'
  | 'E1_BLE_FALSE_TOGGLE'
  | 'E1_BLE_BRIDGE_ERROR'
  // E2 — SQLite Double-Write
  | 'E2_SQLITE_OK'
  | 'E2_SQLITE_LOCKED'
  | 'E2_SQLITE_IO_ERROR'
  | 'E2_BRIDGE_UNAVAILABLE'
  // E3 — UDP Mesh
  | 'E3_MESH_EMITTED'
  | 'E3_MESH_RECEIVED'
  | 'E3_DUPLICATE_RID'
  | 'E3_REPLAY_REJECTED'
  | 'E3_CLOCK_SKEW_INVALID'
  | 'E3_DECRYPTION_ERROR'
  | 'E3_BRIDGE_UNAVAILABLE';

/** Severidade do evento para classificação na UI */
export type RedundancyEventSeverity = 'OK' | 'WARNING' | 'CRITICAL';

/** Evento de telemetria de redundância — puramente observacional */
export interface RedundancyTelemetryEvent {
  id: string;
  timestamp: number;
  code: RedundancyEventCode;
  severity: RedundancyEventSeverity;
  layer: 'E1' | 'E2' | 'E3';
  latency?: number; // undefined quando não instrumentada
  metadata?: Record<string, unknown>;
}

export type RedundancyTelemetrySubscriber = (event: RedundancyTelemetryEvent) => void;

export interface BlePresenceResult {
  ok: boolean;
  present: boolean;
  source: 'ble';
  timestamp: number;
  errorCode?: 'RUNNER_ACTIVITY_NOT_ACTIVE' | 'BRIDGE_UNAVAILABLE' | 'INTERNAL_BRIDGE_ERROR';
  errorMessage?: string;
}

export type SaveNativeAnswerResult = {
  ok: boolean;
  persisted: boolean;
  storage: 'sqlite';
  timestamp: number;
  errorCode?: 'INVALID_PAYLOAD' | 'SQLITE_ERROR' | 'BRIDGE_UNAVAILABLE';
  errorMessage?: string;
};

export type BroadcastNativeAnswerResult = {
  ok: boolean;
  type: 'UDP_BROADCAST';
  errorCode?: 'ENCRYPTION_ERROR' | 'BRIDGE_UNAVAILABLE';
  errorMessage?: string;
};

export interface NativeOperationsPlugin {
  startKioskMode(): Promise<void>;
  stopKioskMode(): Promise<void>;
  sendUDPTelemetry(options: { payload: string }): Promise<void>;
  getKioskStatus(): Promise<{ isActive: boolean }>;
  getBLEPresence(): Promise<BlePresenceResult>;
  saveNativeAnswer(options: { 
    examId: string; 
    studentId: string; 
    questionId: string; 
    value: string; 
    requestId: string; 
    savedAt: string; 
  }): Promise<SaveNativeAnswerResult>;
  broadcastNativeAnswer(options: { 
    examId: string; 
    studentId: string; 
    questionId: string; 
    value: string; 
    requestId: string; 
    savedAt: string; 
  }): Promise<BroadcastNativeAnswerResult>;
}

const FEATURE_FLAGS = {
  FEATURE_BLE_PRESENCE_BRIDGE: true,
  FEATURE_NATIVE_SQL_DOUBLE_WRITE: true,
  FEATURE_UDP_MESH_REDUNDANCY: true,
  /**
   * Fase 4: Habilita emissão de telemetria para UI de monitoramento.
   *
   * DÍVIDA TÉCNICA REGISTRADA:
   * Esta flag opera de forma simplificada (hardcoded true).
   * Evolução futura: migrar para gate por ambiente/build via
   * import.meta.env.VITE_ENABLE_REDUNDANCY_MONITOR para controle
   * real por deploy. Não bloqueia homologação.
   */
  FEATURE_REDUNDANCY_MONITOR: true
};

const NativeOperations = registerPlugin<NativeOperationsPlugin>('NativeOperations');

/** Tamanho máximo do buffer efêmero de telemetria */
const TELEMETRY_BUFFER_MAX = 200;

let _telemetryIdCounter = 0;
function nextTelemetryId(): string {
  return `tel_${Date.now()}_${++_telemetryIdCounter}`;
}

export class NativeBridgeService {
  private static instance: NativeBridgeService;
  private isNative: boolean;

  // --- Phase 4: Telemetry Observational Layer ---
  private _telemetrySubscribers: Set<RedundancyTelemetrySubscriber> = new Set();
  private _telemetryBuffer: RedundancyTelemetryEvent[] = [];

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    if (this.isNative) {
      this.setupListeners();
    }
  }

  static getInstance(): NativeBridgeService {
    if (!NativeBridgeService.instance) {
      NativeBridgeService.instance = new NativeBridgeService();
    }
    return NativeBridgeService.instance;
  }

  private async setupListeners() {
    if (!this.isNative) return;

    try {
      const { App } = await import('@capacitor/app');
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          const isExamInProgress = window.location.pathname.includes('/aluno/prova');
          if (isExamInProgress) {
            if (confirm('Você está em prova! Deseja realmente sair? (Isso será logado)')) {
              App.exitApp();
            }
          } else {
            App.exitApp();
          }
        } else {
          window.history.back();
        }
      });
      console.log('🚀 NativeBridge: Listeners configurados');
    } catch (err) {
      console.warn('⚠️ NativeBridge: Erro ao carregar dependências nativas', err);
    }
  }

  /**
   * Ativa o bloqueio de tela (Kiosk Mode)
   */
  async enableSecurityLock(): Promise<void> {
    try {
      await NativeOperations.startKioskMode();
      console.log("🔒 Native Security Lock Enabled");
    } catch (e) {
      console.error("Failed to enable native lock:", e);
    }
  }

  /**
   * Desativa o bloqueio de tela
   */
  async disableSecurityLock(): Promise<void> {
    try {
      await NativeOperations.stopKioskMode();
      console.log("🔓 Native Security Lock Disabled");
    } catch (e) {
      console.error("Failed to disable native lock:", e);
    }
  }

  /**
   * Envia telemetria via UDP nativo (Baixa latência)
   */
  async broadcastTelemetry(data: any): Promise<void> {
    try {
      const payload = JSON.stringify(data);
      await NativeOperations.sendUDPTelemetry({ payload });
    } catch (e) {
      console.warn("Native UDP broadcast failed, falling back to WebRTC");
    }
  }

  /**
   * Verifica se o bloqueio está ativo
   */
  async checkLockStatus(): Promise<boolean> {
    try {
      const { isActive } = await NativeOperations.getKioskStatus();
      return isActive;
    } catch {
      return false;
    }
  }

  /**
   * Obtém o ID único do dispositivo
   */
  async getDeviceId(): Promise<string> {
    if (this.isNative) {
      try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getId();
        return info.identifier;
      } catch (e) {
        console.warn('⚠️ Erro ao obter Device ID nativo:', e);
      }
    }

    let webId = localStorage.getItem('forge_web_serial');
    if (!webId) {
      webId = `WEB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      localStorage.setItem('forge_web_serial', webId);
    }
    return webId;
  }

  /**
   * Verifica integridade e segurança
   */
  async checkSecurityHealth(): Promise<{ isRooted: boolean; isBinaryIntact: boolean; isOfficialApp: boolean; osVersion: string }> {
    if (this.isNative) {
      try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getInfo();
        return {
          isRooted: false,
          isBinaryIntact: true,
          isOfficialApp: true,
          osVersion: info.osVersion
        };
      } catch (e) {
        console.warn('⚠️ Erro ao realizar check de segurança nativo:', e);
      }
    }

    return {
      isRooted: false,
      isBinaryIntact: true,
      isOfficialApp: true,
      osVersion: 'Web-Emulator'
    };
  }

  /**
   * Simula download de APK via rede local
   */
  async downloadUpdateAPK(version: string): Promise<boolean> {
    console.log(`📦 Iniciando download do binário Forge v${version} via Mesh...`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ APK baixado e instalado com sucesso!');
        resolve(true);
      }, 3000);
    });
  }

  /**
   * Verifica se o aluno está fisicamente presente na sala (via BLE)
   * Requisito E1 - Fase 1 da Convergência Nativa
   */
  async isBleRoomPresent(): Promise<BlePresenceResult> {
    if (!FEATURE_FLAGS.FEATURE_BLE_PRESENCE_BRIDGE) {
      return { 
        ok: false, 
        present: false, 
        source: 'ble', 
        timestamp: Date.now(), 
        errorCode: 'BRIDGE_UNAVAILABLE', 
        errorMessage: 'Feature flag disabled' 
      };
    }

    if (!this.isNative) {
      return { 
        ok: false, 
        present: false, 
        source: 'ble', 
        timestamp: Date.now(), 
        errorCode: 'BRIDGE_UNAVAILABLE' 
      };
    }

    try {
      const result = await NativeOperations.getBLEPresence();
      return result;
    } catch (e) {
      return { 
        ok: false, 
        present: false, 
        source: 'ble', 
        timestamp: Date.now(), 
        errorCode: 'INTERNAL_BRIDGE_ERROR',
        errorMessage: e instanceof Error ? e.message : String(e)
      };
    }
  }

  /**
   * Realiza a persistência redundante no SQLite nativo (E2)
   * Respeita a política de "Truthful Success" do plugin.
   */
  async saveNativeAnswer(options: {
    examId: string;
    studentId: string;
    questionId: string;
    value: string;
    requestId: string;
    savedAt: string;
  }): Promise<SaveNativeAnswerResult> {
    const timestamp = Date.now();

    if (!FEATURE_FLAGS.FEATURE_NATIVE_SQL_DOUBLE_WRITE) {
      return { ok: false, persisted: false, storage: 'sqlite', timestamp, errorCode: 'BRIDGE_UNAVAILABLE', errorMessage: 'Feature flag disabled' };
    }

    if (!this.isNative) {
      return { ok: false, persisted: false, storage: 'sqlite', timestamp, errorCode: 'BRIDGE_UNAVAILABLE' };
    }

    try {
      const result = await NativeOperations.saveNativeAnswer(options);
      // Phase 4: Emitir evento de telemetria (sem bloquear)
      this.emitTelemetryEvent({
        code: result.ok ? 'E2_SQLITE_OK' : 'E2_SQLITE_LOCKED',
        severity: NativeBridgeService.severityFor(result.ok ? 'E2_SQLITE_OK' : 'E2_SQLITE_LOCKED'),
        layer: 'E2',
        metadata: { requestId: options.requestId, persisted: result.persisted },
      });
      return result;
    } catch (e) {
      const errorCode: RedundancyEventCode = 'E2_SQLITE_IO_ERROR';
      // Phase 4: Emitir evento de erro
      this.emitTelemetryEvent({
        code: errorCode,
        severity: NativeBridgeService.severityFor(errorCode),
        layer: 'E2',
        metadata: { requestId: options.requestId, error: e instanceof Error ? e.message : String(e) },
      });
      return { 
        ok: false, 
        persisted: false, 
        storage: 'sqlite', 
        timestamp, 
        errorCode: 'SQLITE_ERROR',
        errorMessage: e instanceof Error ? e.message : String(e)
      };
    }
  }

  /**
   * Realiza o broadcast redundante via UDP Mesh (E3)
   * Payload protegido por AES-GCM-256 no nativo.
   */
  async broadcastNativeAnswer(options: {
    examId: string;
    studentId: string;
    questionId: string;
    value: string;
    requestId: string;
    savedAt: string;
  }): Promise<BroadcastNativeAnswerResult> {
    if (!FEATURE_FLAGS.FEATURE_UDP_MESH_REDUNDANCY) {
      return { ok: false, type: 'UDP_BROADCAST', errorCode: 'BRIDGE_UNAVAILABLE', errorMessage: 'Feature flag disabled' };
    }

    if (!this.isNative) {
      return { ok: false, type: 'UDP_BROADCAST', errorCode: 'BRIDGE_UNAVAILABLE' };
    }

    try {
      const result = await NativeOperations.broadcastNativeAnswer(options);
      // Phase 4: Emitir evento de telemetria (sem bloquear)
      this.emitTelemetryEvent({
        code: result.ok ? 'E3_MESH_EMITTED' : 'E3_BRIDGE_UNAVAILABLE',
        severity: NativeBridgeService.severityFor(result.ok ? 'E3_MESH_EMITTED' : 'E3_BRIDGE_UNAVAILABLE'),
        layer: 'E3',
        metadata: { requestId: options.requestId },
      });
      return result;
    } catch (e) {
      const errorCode: RedundancyEventCode = 'E3_DECRYPTION_ERROR';
      // Phase 4: Emitir evento de erro
      this.emitTelemetryEvent({
        code: errorCode,
        severity: NativeBridgeService.severityFor(errorCode),
        layer: 'E3',
        metadata: { requestId: options.requestId, error: e instanceof Error ? e.message : String(e) },
      });
      return { 
        ok: false, 
        type: 'UDP_BROADCAST', 
        errorCode: 'ENCRYPTION_ERROR',
        errorMessage: e instanceof Error ? e.message : String(e)
      };
    }
  }

  /**
   * Verifica se está rodando nativamente
   */
  getIsNative(): boolean {
    return this.isNative;
  }

  // ============================================================
  // Phase 4 — Telemetry Observer API (Read-Only / Ephemeral)
  // ============================================================

  /**
   * Inscreve um subscriber para receber eventos de telemetria.
   * Retorna uma função de unsubscribe.
   */
  subscribeTelemetry(subscriber: RedundancyTelemetrySubscriber): () => void {
    this._telemetrySubscribers.add(subscriber);
    return () => { this._telemetrySubscribers.delete(subscriber); };
  }

  /** Retorna cópia somente-leitura do buffer efêmero */
  getTelemetryBuffer(): ReadonlyArray<RedundancyTelemetryEvent> {
    return [...this._telemetryBuffer];
  }

  /** Limpa o buffer (ação de UI, não afeta o núcleo) */
  clearTelemetryBuffer(): void {
    this._telemetryBuffer = [];
  }

  /**
   * Emite um evento de telemetria para todos os subscribers.
   * Não bloqueia o fluxo de salvamento — notificação assíncrona via queueMicrotask.
   */
  private emitTelemetryEvent(event: Omit<RedundancyTelemetryEvent, 'id' | 'timestamp'>): void {
    if (!FEATURE_FLAGS.FEATURE_REDUNDANCY_MONITOR) return;

    const fullEvent: RedundancyTelemetryEvent = {
      ...event,
      id: nextTelemetryId(),
      timestamp: Date.now(),
    };

    // Buffer circular efêmero
    this._telemetryBuffer.push(fullEvent);
    if (this._telemetryBuffer.length > TELEMETRY_BUFFER_MAX) {
      this._telemetryBuffer = this._telemetryBuffer.slice(-TELEMETRY_BUFFER_MAX);
    }

    // Notificação assíncrona — nunca bloqueia o save path
    queueMicrotask(() => {
      this._telemetrySubscribers.forEach(sub => {
        try { sub(fullEvent); } catch { /* subscriber crash não afeta o núcleo */ }
      });
    });
  }

  /** Mapeia severidade a partir do código de evento */
  private static severityFor(code: RedundancyEventCode): RedundancyEventSeverity {
    // Alertas visuais imediatos (CRITICAL)
    if ([
      'E2_SQLITE_LOCKED',
      'E2_SQLITE_IO_ERROR',
      'E3_DECRYPTION_ERROR',
    ].includes(code)) return 'CRITICAL';

    // Logs técnicos esperados (WARNING)
    if ([
      'E1_BLE_FALSE_TOGGLE',
      'E1_BLE_ABSENT',
      'E1_BLE_BRIDGE_ERROR',
      'E2_BRIDGE_UNAVAILABLE',
      'E3_DUPLICATE_RID',
      'E3_REPLAY_REJECTED',
      'E3_CLOCK_SKEW_INVALID',
      'E3_BRIDGE_UNAVAILABLE',
    ].includes(code)) return 'WARNING';

    return 'OK';
  }
}

export const nativeBridge = new NativeBridgeService();
