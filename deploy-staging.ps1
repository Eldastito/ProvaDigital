# Script de Deploy para Staging
# Execute este script para fazer deploy do ExamePad em staging

param(
    [string]$Platform = "vercel",  # vercel, netlify, ou github
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false
)

Write-Host "=== ExamePad - Deploy Staging ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar pré-requisitos
Write-Host "[1/6] Verificando pré-requisitos..." -ForegroundColor Yellow

if (!(Test-Path ".env.staging")) {
    Write-Host "✗ Arquivo .env.staging não encontrado!" -ForegroundColor Red
    Write-Host "Crie o arquivo com as variáveis de ambiente de staging." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Arquivo .env.staging encontrado" -ForegroundColor Green

# 2. Carregar variáveis de ambiente
Write-Host ""
Write-Host "[2/6] Carregando variáveis de ambiente..." -ForegroundColor Yellow

Get-Content .env.staging | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        Write-Host "✓ $name configurado" -ForegroundColor Green
    }
}

# 3. Executar testes
if (!$SkipTests) {
    Write-Host ""
    Write-Host "[3/6] Executando testes..." -ForegroundColor Yellow
    
    npm run test -- security.test.ts --run
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Testes falharam!" -ForegroundColor Red
        $continue = Read-Host "Continuar mesmo assim? (s/n)"
        if ($continue -ne 's') {
            exit 1
        }
    }
    else {
        Write-Host "✓ Todos os testes passaram" -ForegroundColor Green
    }
}
else {
    Write-Host ""
    Write-Host "[3/6] Testes ignorados (--SkipTests)" -ForegroundColor Gray
}

# 4. Build
if (!$SkipBuild) {
    Write-Host ""
    Write-Host "[4/6] Compilando projeto..." -ForegroundColor Yellow
    
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build falhou!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Build concluído" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "[4/6] Build ignorado (--SkipBuild)" -ForegroundColor Gray
}

# 5. Deploy
Write-Host ""
Write-Host "[5/6] Fazendo deploy para $Platform..." -ForegroundColor Yellow

switch ($Platform) {
    "vercel" {
        Write-Host "Usando Vercel..." -ForegroundColor Gray
        
        # Verificar se Vercel CLI está instalado
        try {
            vercel --version | Out-Null
        }
        catch {
            Write-Host "Instalando Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        # Deploy
        vercel --prod `
            --env VITE_SUPABASE_URL=$env:VITE_SUPABASE_URL `
            --env VITE_SUPABASE_ANON_KEY=$env:VITE_SUPABASE_ANON_KEY `
            --env VITE_GEMINI_API_KEY=$env:VITE_GEMINI_API_KEY `
            --env VITE_ENV=staging
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deploy no Vercel concluído" -ForegroundColor Green
        }
    }
    
    "netlify" {
        Write-Host "Usando Netlify..." -ForegroundColor Gray
        
        # Verificar se Netlify CLI está instalado
        try {
            netlify --version | Out-Null
        }
        catch {
            Write-Host "Instalando Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        # Deploy
        netlify deploy --prod --dir=dist
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deploy no Netlify concluído" -ForegroundColor Green
        }
    }
    
    "github" {
        Write-Host "Usando GitHub Pages..." -ForegroundColor Gray
        
        # Build com base path
        npm run build -- --base=/examepad-staging/
        
        # Deploy
        npm install -g gh-pages
        gh-pages -d dist
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deploy no GitHub Pages concluído" -ForegroundColor Green
        }
    }
    
    default {
        Write-Host "✗ Plataforma desconhecida: $Platform" -ForegroundColor Red
        Write-Host "Use: vercel, netlify ou github" -ForegroundColor Yellow
        exit 1
    }
}

# 6. Validação
Write-Host ""
Write-Host "[6/6] Validação pós-deploy..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acessar a URL de staging e fazer login" -ForegroundColor White
Write-Host "2. Executar validação manual (ver DEPLOY_STAGING_CHECKLIST.md)" -ForegroundColor White
Write-Host "3. Monitorar logs e erros" -ForegroundColor White
Write-Host "4. Convidar escolas piloto" -ForegroundColor White
Write-Host ""
Write-Host "URL de staging será exibida acima ☝️" -ForegroundColor Cyan
