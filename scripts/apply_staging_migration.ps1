# Script para Aplicar Migração de Hardening em Staging
# Lê credenciais do .env.staging e aplica o SQL via Supabase API (pg_meta) se disponível ou orienta o usuário.
# Nota: A API pg_meta geralmente requer Service Role Key. Como temos apenas Anon Key no .env.staging, 
# este script irá AVISAR o usuário para rodar via SQL Editor do Dashboard.

param(
    [string]$EnvFile = ".env.staging",
    [string]$MigrationFile = "supabase_migration_production_hardening.sql"
)

Write-Host "=== Aplicador de Migração Staging ===" -ForegroundColor Cyan

if (!(Test-Path $EnvFile)) {
    Write-Host "Erro: $EnvFile não encontrado." -ForegroundColor Red
    exit 1
}

$content = Get-Content $EnvFile
$urlLine = $content | Where-Object { $_ -match "VITE_SUPABASE_URL" }
$url = $urlLine.Split("=")[1].Trim()

Write-Host "Alvo: $url" -ForegroundColor Yellow
Write-Host "Arquivo SQL: $MigrationFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Para aplicar migrações via script, seria necessária a SERVICE_ROLE_KEY." -ForegroundColor Red
Write-Host "⚠️  Como estamos usando segredos de cliente (ANON_KEY), você deve aplicar manualmente." -ForegroundColor Red
Write-Host ""
Write-Host "INSTRUÇÕES:" -ForegroundColor Green
Write-Host "1. Abra o Dashboard do Supabase: $url" -ForegroundColor White
Write-Host "2. Vá para o SQL Editor" -ForegroundColor White
Write-Host "3. Copie o conteúdo de $MigrationFile" -ForegroundColor White
Write-Host "4. Cole e execute no SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "O conteúdo do arquivo SQL foi copiado para sua área de transferência (se possível)." -ForegroundColor Gray

try {
    Get-Content $MigrationFile | Set-Clipboard
    Write-Host "✓ Conteúdo copiado para o Clipboard!" -ForegroundColor Green
}
catch {
    Write-Host "X Não foi possível copiar para o clipboard. Abra o arquivo manualmente." -ForegroundColor Yellow
}


# Script finalizado sem pausa
Write-Host "Processo de cópia finalizado." -ForegroundColor Gray
