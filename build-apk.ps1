# Script para Build do APK ExamePad
# Execute este script para gerar o APK Android

Write-Host "=== ExamePad - Build Android APK ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Java
Write-Host "[1/4] Verificando Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✓ Java encontrado: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Java não encontrado!" -ForegroundColor Red
    Write-Host "Instale o JDK 17: https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

# 2. Build do projeto React
Write-Host ""
Write-Host "[2/4] Compilando projeto React..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro no build do React!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build React concluído" -ForegroundColor Green

# 3. Sync Capacitor
Write-Host ""
Write-Host "[3/4] Sincronizando Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro no sync do Capacitor!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Sync concluído" -ForegroundColor Green

# 4. Build APK
Write-Host ""
Write-Host "[4/4] Gerando APK..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns minutos na primeira vez..." -ForegroundColor Gray

cd android
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
} else {
    Write-Host ""
    Write-Host "✗ Erro ao gerar APK!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "1. Instale o Android Studio: https://developer.android.com/studio" -ForegroundColor White
    Write-Host "2. Configure ANDROID_HOME apontando para o SDK" -ForegroundColor White
    Write-Host "3. Abra o projeto 'android/' no Android Studio e deixe sincronizar" -ForegroundColor White
}

cd ..
