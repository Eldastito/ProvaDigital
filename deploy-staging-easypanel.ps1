# Script de Deploy para Staging - Easypanel 🚀
# Execute este script para preparar e/ou fazer deploy no Easypanel

param(
    [switch]$SkipBuild = $false
)

Write-Host "=== ExamePad - Deploy STAGING (Easypanel) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Carregar variáveis de Staging
Write-Host "[1/4] Carregando configuração de Staging..." -ForegroundColor Yellow
if (!(Test-Path ".env.staging")) {
    Write-Host "✗ .env.staging não encontrado!" -ForegroundColor Red
    exit 1
}

# 2. Build da Aplicação em Modo Staging
if (!$SkipBuild) {
    Write-Host ""
    Write-Host "[2/4] Build da Aplicação (Modo Staging)..." -ForegroundColor Yellow
    
    # Forçar modo staging para que o Vite use .env.staging
    npm run build -- --mode staging
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build falhou!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Build concluído com sucesso" -ForegroundColor Green
}

# 3. Preparação do Docker
Write-Host ""
Write-Host "[3/4] Validando Dockerfile e Nginx..." -ForegroundColor Yellow

if (!(Test-Path "Dockerfile")) {
    Write-Host "Criando Dockerfile padrão..." -ForegroundColor Gray
    @"
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8
}

if (!(Test-Path "nginx.conf")) {
    Write-Host "Criando nginx.conf padrão..." -ForegroundColor Gray
    @"
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    location / {
        try_files `$uri `$uri/ /index.html;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
"@ | Out-File -FilePath "nginx.conf" -Encoding UTF8
}

Write-Host "✓ Configuração Docker pronta" -ForegroundColor Green

# 4. Instruções Finais - Deploy
Write-Host ""
Write-Host "[4/4] PRONTO PARA DEPLOY!" -ForegroundColor Green
Write-Host ""
Write-Host "Como você não usa Vercel, aqui estão as opções para Easypanel:" -ForegroundColor White
Write-Host ""
Write-Host "OPÇÃO A: Via Git (Recomendado se o Easypanel estiver conectado ao Git)" -ForegroundColor Yellow
Write-Host "1. Commitar as alterações:" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Deploy Staging'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host "2. No Easypanel, apenas clique em 'Deploy' ou 'Force Rebuild'" -ForegroundColor Gray
Write-Host ""
Write-Host "OPÇÃO B: Via Docker Manual (Se quiser subir a imagem direta)" -ForegroundColor Yellow
Write-Host "1. Build da imagem:" -ForegroundColor Gray
Write-Host "   docker build -t examepad-staging ." -ForegroundColor Gray
Write-Host "2. Push (se tiver registry):" -ForegroundColor Gray
Write-Host "   docker push seu-registry/examepad-staging" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "Certifique-se de que as variáveis de ambiente no Easypanel estão configuradas iguais ao .env.staging!" -ForegroundColor White
