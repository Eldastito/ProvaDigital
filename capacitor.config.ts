import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.examepad.app',
  appName: 'ExamePad',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f1d2e",
      showSpinner: false
    }
  },
  android: {
    // Habilitar WebView debugging (remover em produção)
    webContentsDebuggingEnabled: true,
    // Permitir acesso à câmera
    allowMixedContent: false
  }
};

export default config;
