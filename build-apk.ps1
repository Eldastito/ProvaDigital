# Script para Build do APK ExamePad
# Execute este script para gerar o APK Android

Write-Host "=== ExamePad - Build Android APK ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Dependências
Write-Host "[1/6] Verificando dependências..." -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Instale: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✓ Java encontrado: $javaVersion" -ForegroundColor Green
    
    # Verificar se é Java 17
    $javaVersionNumber = java -version 2>&1 | Select-String "version" | ForEach-Object { $_ -replace '.*"(\d+).*', '$1' }
    if ($javaVersionNumber -lt 17) {
        Write-Host "⚠️  Java 17 ou superior recomendado (encontrado: $javaVersionNumber)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Java não encontrado!" -ForegroundColor Red
    Write-Host "Instale o JDK 17: https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

# Android SDK
if (Test-Path env:ANDROID_HOME) {
    Write-Host "✓ ANDROID_HOME configurado: $env:ANDROID_HOME" -ForegroundColor Green
}
else {
    Write-Host "⚠️  ANDROID_HOME não configurado!" -ForegroundColor Yellow
    Write-Host "Configure: `$env:ANDROID_HOME = 'C:\Users\$env:USERNAME\AppData\Local\Android\Sdk'" -ForegroundColor Gray
    Write-Host "Para persistir: [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\$env:USERNAME\AppData\Local\Android\Sdk', 'User')" -ForegroundColor Gray
}

# Capacitor
try {
    $capVersion = npx cap --version 2>&1
    Write-Host "✓ Capacitor encontrado: $capVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Capacitor não encontrado" -ForegroundColor Yellow
    Write-Host "Instalando..." -ForegroundColor Gray
    npm install -g @capacitor/cli
}

# 2. Verificar Variáveis de Ambiente
Write-Host ""
Write-Host "[2/6] Verificando variáveis de ambiente..." -ForegroundColor Yellow

$envWarnings = 0

if (!(Test-Path env:VITE_SUPABASE_URL)) {
    Write-Host "⚠️  VITE_SUPABASE_URL não configurada!" -ForegroundColor Yellow
    $envWarnings++
}
else {
    Write-Host "✓ VITE_SUPABASE_URL configurada" -ForegroundColor Green
}

if (!(Test-Path env:VITE_SUPABASE_ANON_KEY)) {
    Write-Host "⚠️  VITE_SUPABASE_ANON_KEY não configurada!" -ForegroundColor Yellow
    $envWarnings++
}
else {
    Write-Host "✓ VITE_SUPABASE_ANON_KEY configurada" -ForegroundColor Green
}

if (!(Test-Path env:VITE_GEMINI_API_KEY)) {
    Write-Host "⚠️  VITE_GEMINI_API_KEY não configurada!" -ForegroundColor Yellow
    $envWarnings++
}
else {
    Write-Host "✓ VITE_GEMINI_API_KEY configurada" -ForegroundColor Green
}

if ($envWarnings -gt 0) {
    Write-Host ""
    Write-Host "⚠️  $envWarnings variável(is) de ambiente não configurada(s)" -ForegroundColor Yellow
    Write-Host "O app pode não funcionar corretamente sem essas variáveis." -ForegroundColor Yellow
    Write-Host "Configure no arquivo .env na raiz do projeto." -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continuar mesmo assim? (s/n)"
    if ($continue -ne 's') {
        exit 0
    }
}

# 3. Build do projeto React
Write-Host ""
Write-Host "[3/6] Compilando projeto React..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro no build do React!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build React concluído" -ForegroundColor Green

# 4. Sync Capacitor
Write-Host ""
Write-Host "[4/6] Sincronizando Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro no sync do Capacitor!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Sync concluído" -ForegroundColor Green

# 5. Verificar configuração Android
Write-Host ""
Write-Host "[5/6] Verificando configuração Android..." -ForegroundColor Yellow

if (Test-Path "android/app/build.gradle") {
    Write-Host "✓ Projeto Android configurado" -ForegroundColor Green
}
else {
    Write-Host "✗ Projeto Android não encontrado!" -ForegroundColor Red
    Write-Host "Execute: npx cap add android" -ForegroundColor Yellow
    exit 1
}

# 6. Build APK
Write-Host ""
Write-Host "[6/6] Gerando APK..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns minutos na primeira vez..." -ForegroundColor Gray

Set-Location android
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ APK GERADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Localização do APK:" -ForegroundColor Cyan
    Write-Host "android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
    Write-Host ""
    Write-Host "Para instalar no tablet:" -ForegroundColor Yellow
    Write-Host "1. Conecte o tablet via USB" -ForegroundColor White
    Write-Host "2. Ative 'Depuração USB' nas configurações do Android" -ForegroundColor White
    Write-Host "3. Execute: adb install app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
}
else {
    Write-Host ""
    Write-Host "✗ Erro ao gerar APK!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "1. Instale o Android Studio: https://developer.android.com/studio" -ForegroundColor White
    Write-Host "2. Configure ANDROID_HOME apontando para o SDK" -ForegroundColor White
    Write-Host "3. Abra o projeto 'android/' no Android Studio e deixe sincronizar" -ForegroundColor White
}
Set-Location ..
