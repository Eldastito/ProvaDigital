# Guia de Build Android (APK) - ExamePad 📱

Para que as funções de **Wi-Fi Hotspot** e **Rede Mesh Offline** funcionem, o sistema deve ser instalado como um aplicativo Android nativo utilizando o Capacitor.

## 1. Pré-requisitos
- **Node.js**: v18+
- **Android Studio**: Para compilação final e assinatura do APK.
- **Java JDK 17**: Necessário para o Gradle.

## 2. Preparação do Ambiente
Execute os comandos abaixo na raiz do projeto para garantir que as dependências nativas críticas estejam instaladas:

```bash
# Instalar plugins de hardware essenciais
npm install @capacitor/app @capacitor/keyboard @capacitor-community/hotspot
```

## 3. Comandos de Build
Siga esta sequência para gerar o APK atualizado com as novas permissões de hardware:

```bash
# 1. Compila o projeto React (Gera a pasta /dist)
npm run build

# 2. Sincroniza o código web com o projeto Android Android
npx cap sync android

# 3. Abre o projeto no Android Studio
npx cap open android
```

No **Android Studio**:
1. Vá em `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
2. O APK será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`.

## 4. Instalação no Tablet
1. Conecte o tablet via USB.
2. Ative a **Depuração USB** nas Opções do Desenvolvedor do Android.
3. Arraste o arquivo `.apk` para o tablet ou use o comando:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

## 5. Permissões de Hotspot (Importante!)
Ao abrir o app pela primeira vez, o Android pode solicitar permissões de **Localização** e **Configurações do Sistema**. Essas permissões são obrigatórias para que o app consiga criar o Hotspot automaticamente.

---
*Gerado automaticamente para a Fase 6 do Módulo de Logística & Offline.*
