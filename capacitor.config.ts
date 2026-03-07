import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.examepad.app',
  appName: 'ExamePad Forge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
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
