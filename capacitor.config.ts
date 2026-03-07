import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.examepad.app',
  appName: 'ExamePad Forge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Em produção, o app abrirá diretamente no domínio do servidor.
    // Para desenvolvimento local, comente a linha abaixo.
    // Para desenvolvimento local, use o IP 10.0.2.2 para acessar o host do emulador
    url: 'http://10.0.2.2:3000/apps/tablet',
    cleartext: true // Permitir HTTP para conexões locais (Gateway)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f1d2e",
      showSpinner: true,
      spinnerColor: "#6366f1"
    }
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true // Permitir HTTP + HTTPS (necessário para Gateway local)
  }
};

export default config;
