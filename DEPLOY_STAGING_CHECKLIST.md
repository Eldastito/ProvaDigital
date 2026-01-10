# Deploy em Staging - Checklist Completo

## 🎯 Objetivo
Fazer deploy do ExamePad v3.0 em ambiente de staging para validação antes da produção.

---

## ✅ Pré-requisitos

- [x] Migration SQL criada
- [x] Testes de segurança passando (12/12)
- [x] Build local funcionando
- [ ] Ambiente Supabase staging configurado
- [ ] Variáveis de ambiente definidas
- [ ] Scripts de deploy criados

---

## 📋 Checklist de Deploy

### 1. Configuração do Ambiente Supabase

- [ ] Criar novo projeto Supabase para staging
- [ ] Anotar credenciais:
  - `VITE_SUPABASE_URL_STAGING`
  - `VITE_SUPABASE_ANON_KEY_STAGING`
- [ ] Aplicar migration SQL
- [ ] Criar usuários de teste
- [ ] Popular dados de exemplo

### 2. Configuração de Variáveis de Ambiente

Criar arquivo `.env.staging`:
```env
# Supabase
VITE_SUPABASE_URL=https://[seu-projeto-staging].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]

# Gemini AI
VITE_GEMINI_API_KEY=[sua-chave-gemini]

# Ambiente
VITE_ENV=staging
VITE_APP_VERSION=3.0.0-staging

# Feature Flags
VITE_ENABLE_AI_TUTOR=true
VITE_ENABLE_GAMIFICATION=true
VITE_ENABLE_RISK_DETECTION=true
```

### 3. Build para Staging

```powershell
# Usar variáveis de staging
$env:VITE_SUPABASE_URL = "https://[staging].supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "[key]"
$env:VITE_GEMINI_API_KEY = "[key]"

# Build
npm run build

# Verificar build
ls dist/
```

### 4. Deploy do Frontend

**Opção A: Vercel (Recomendado)**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod --env VITE_SUPABASE_URL=[url] --env VITE_SUPABASE_ANON_KEY=[key]
```

**Opção B: Netlify**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Opção C: GitHub Pages**
```bash
# Build com base path
npm run build -- --base=/examepad-staging/

# Deploy via gh-pages
npm install -g gh-pages
gh-pages -d dist
```

### 5. Configuração do Capacitor (Mobile)

```bash
# Sync com staging
npx cap sync

# Configurar em capacitor.config.ts
{
  "appId": "com.examepad.staging",
  "appName": "ExamePad Staging",
  "webDir": "dist",
  "server": {
    "url": "https://examepad-staging.vercel.app",
    "cleartext": true
  }
}
```

### 6. Smoke Tests

Executar testes básicos após deploy:

```powershell
# Testes de segurança
npm run test -- security.test.ts --run

# Testes de integração
npm run test -- realDataFlow.test.ts --run

# Testes E2E (se configurado)
npm run test:e2e
```

### 7. Validação Manual

- [ ] Acessar URL de staging
- [ ] Fazer login com usuário de teste
- [ ] Criar uma questão (manual)
- [ ] Criar uma questão (OCR)
- [ ] Montar uma prova
- [ ] Aplicar prova no tablet
- [ ] Corrigir prova
- [ ] Visualizar dashboard

### 8. Monitoramento

- [ ] Configurar Sentry para staging
- [ ] Configurar logs no Supabase
- [ ] Verificar métricas de performance
- [ ] Monitorar erros em tempo real

---

## 🚨 Rollback Plan

Se algo der errado:

1. **Frontend:** Reverter deploy no Vercel/Netlify
2. **Database:** Fazer rollback da migration SQL
3. **Notificar:** Avisar equipe e escolas piloto

---

## 📊 Critérios de Sucesso

- [ ] Deploy concluído sem erros
- [ ] Todos os smoke tests passando
- [ ] Validação manual bem-sucedida
- [ ] Sem erros críticos no Sentry
- [ ] Latência < 500ms
- [ ] Uptime > 99%

---

## 🎯 Próximos Passos

Após validação em staging:

1. Convidar 10 escolas piloto
2. Coletar feedback por 2 semanas
3. Corrigir bugs identificados
4. Fazer deploy em produção

---

**Status:** 🟡 **Aguardando Configuração**

**Responsável:** Equipe ExamePad  
**Prazo:** Esta semana  
**Prioridade:** Alta
