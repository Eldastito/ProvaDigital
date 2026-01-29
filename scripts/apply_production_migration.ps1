# Script para aplicar Production Hardening Migration
# Execute este script para aplicar as melhorias de segurança no Supabase

Write-Host "=== ExamePad - Production Hardening Migration ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Supabase CLI
Write-Host "[1/4] Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✓ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# 2. Backup do banco antes de aplicar
Write-Host ""
Write-Host "[2/4] Criando backup..." -ForegroundColor Yellow
$backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "Arquivo de backup: $backupFile" -ForegroundColor Gray

# Nota: Em produção, use o comando apropriado do Supabase para backup
# supabase db dump > $backupFile

Write-Host "⚠️  ATENÇÃO: Execute backup manual antes de continuar!" -ForegroundColor Yellow
$confirm = Read-Host "Backup realizado? (s/n)"
if ($confirm -ne 's') {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

# 3. Aplicar migration
Write-Host ""
Write-Host "[3/4] Aplicando migration de hardening..." -ForegroundColor Yellow
Write-Host "Arquivo: supabase_migration_production_hardening.sql" -ForegroundColor Gray

# Opção 1: Via Supabase CLI (se configurado)
# supabase db push --file supabase_migration_production_hardening.sql

# Opção 2: Via psql direto (se tiver credenciais)
# psql $DATABASE_URL -f supabase_migration_production_hardening.sql

Write-Host ""
Write-Host "Para aplicar a migration, execute um dos comandos:" -ForegroundColor Cyan
Write-Host "1. Via Supabase Dashboard: SQL Editor > Cole o conteúdo do arquivo" -ForegroundColor White
Write-Host "2. Via CLI: supabase db push --file supabase_migration_production_hardening.sql" -ForegroundColor White
Write-Host "3. Via psql: psql `$DATABASE_URL -f supabase_migration_production_hardening.sql" -ForegroundColor White
Write-Host ""

$applyNow = Read-Host "Aplicar via Supabase CLI agora? (s/n)"
if ($applyNow -eq 's') {
    Write-Host "Aplicando..." -ForegroundColor Yellow
    
    # Tente aplicar via Supabase CLI
    supabase db push --file supabase_migration_production_hardening.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ MIGRATION APLICADA COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "✗ Erro ao aplicar migration!" -ForegroundColor Red
        Write-Host "Verifique os logs acima para detalhes." -ForegroundColor Yellow
        exit 1
    }
}

# 4. Executar testes de segurança
Write-Host ""
Write-Host "[4/4] Executar testes de segurança? (s/n)" -ForegroundColor Yellow
$runTests = Read-Host
if ($runTests -eq 's') {
    Write-Host "Executando testes..." -ForegroundColor Yellow
    npm run test -- security.test.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Testes de segurança passaram!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Alguns testes falharam. Revise os resultados." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration de Produção Concluída!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Validar RLS policies no Supabase Dashboard" -ForegroundColor White
Write-Host "2. Executar testes de segurança: npm run test -- security.test.ts" -ForegroundColor White
Write-Host "3. Verificar audit logs: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;" -ForegroundColor White
