import { registerPlugin } from '@capacitor/core';

export interface NativeOperationsPlugin {
  startKioskMode(): Promise<void>;
  stopKioskMode(): Promise<void>;
  sendUDPTelemetry(options: { payload: string }): Promise<void>;
  getKioskStatus(): Promise<{ isActive: boolean }>;
}

const NativeOperations = registerPlugin<NativeOperationsPlugin>('NativeOperations');

export class NativeBridgeService {
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
      // Silently fail or fallback to mesh
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
}

export const nativeBridge = new NativeBridgeService();
