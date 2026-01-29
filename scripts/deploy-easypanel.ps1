# Script de Deploy para Easypanel
# Execute este script para fazer deploy do ExamePad no Easypanel

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false
)

Write-Host "=== ExamePad - Deploy Easypanel ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar pré-requisitos
Write-Host "[1/5] Verificando pré-requisitos..." -ForegroundColor Yellow

if (!(Test-Path ".env.staging")) {
    Write-Host "✗ Arquivo .env.staging não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Arquivo .env.staging encontrado" -ForegroundColor Green

# 2. Executar testes
if (!$SkipTests) {
    Write-Host ""
    Write-Host "[2/5] Executando testes..." -ForegroundColor Yellow
    
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
    Write-Host "[2/5] Testes ignorados (--SkipTests)" -ForegroundColor Gray
}

# 3. Build
if (!$SkipBuild) {
    Write-Host ""
    Write-Host "[3/5] Compilando projeto..." -ForegroundColor Yellow
    
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build falhou!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Build concluído" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "[3/5] Build ignorado (--SkipBuild)" -ForegroundColor Gray
}

# 4. Criar Dockerfile se não existir
Write-Host ""
Write-Host "[4/5] Preparando Docker..." -ForegroundColor Yellow

if (!(Test-Path "Dockerfile")) {
    Write-Host "Criando Dockerfile..." -ForegroundColor Gray
    
    @"
FROM nginx:alpine

# Copiar build
COPY dist /usr/share/nginx/html

# Copiar configuração nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8
    
    Write-Host "✓ Dockerfile criado" -ForegroundColor Green
}

# Criar nginx.conf se não existir
if (!(Test-Path "nginx.conf")) {
    Write-Host "Criando nginx.conf..." -ForegroundColor Gray
    
    @"
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
"@ | Out-File -FilePath "nginx.conf" -Encoding UTF8
    
    Write-Host "✓ nginx.conf criado" -ForegroundColor Green
}

# 5. Instruções para Easypanel
Write-Host ""
Write-Host "[5/5] Deploy no Easypanel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ PREPARAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos no Easypanel:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse seu Easypanel: https://seu-easypanel.com" -ForegroundColor White
Write-Host "2. Crie um novo App (tipo: Docker)" -ForegroundColor White
Write-Host "3. Configure o repositório Git ou faça upload dos arquivos" -ForegroundColor White
Write-Host "4. Adicione as variáveis de ambiente:" -ForegroundColor White
Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - VITE_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "   - VITE_GEMINI_API_KEY" -ForegroundColor Gray
Write-Host "5. Configure o domínio (ex: staging.examepad.com)" -ForegroundColor White
Write-Host "6. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "Ou use Docker diretamente:" -ForegroundColor Yellow
Write-Host "  docker build -t examepad-staging ." -ForegroundColor Cyan
Write-Host "  docker run -p 80:80 examepad-staging" -ForegroundColor Cyan
Write-Host ""
