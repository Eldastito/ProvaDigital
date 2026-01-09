# 🔍 Diagnóstico: Problemas de Backend Supabase

## 🚨 Problema Reportado

**Sintoma:** F5 fix não funcionou em produção  
**Suspeita:** Backend Supabase não está funcionando corretamente  
**Impacto:** Aplicação não consegue autenticar ou carregar dados

---

## 🧪 Testes de Diagnóstico Criados

### Arquivo: `services/supabaseClient.test.ts`

**20+ testes automatizados** para identificar problemas:

### 1. Environment Variables (3 testes)
- ✅ VITE_SUPABASE_URL configurado
- ✅ VITE_SUPABASE_ANON_KEY configurado
- ℹ️ VITE_GEMINI_API_KEY configurado (opcional)

### 2. Supabase Client Initialization (2 testes)
- ✅ Cliente Supabase inicializado
- ✅ URL correto no cliente

### 3. Supabase Connection Test (2 testes)
- 🔌 Ping no Supabase
- 🔐 Verificação de sessão de autenticação

### 4. Database Tables Test (9 testes)
Testa acesso a cada tabela:
- `tenants`
- `schools`
- `classes`
- `users`
- `students`
- `items`
- `exams`
- `exam_results`
- `user_profiles`

### 5. Authentication Test (1 teste)
- 🔑 Sign up funcionando

### 6. Network Diagnostics (1 teste)
- 📡 Fetch direto para Supabase

---

## 🔍 Possíveis Causas

### 1. Variáveis de Ambiente Não Configuradas em Produção

**Sintoma:**
```
❌ ERRO: Variáveis de ambiente não configuradas!
```

**Solução:**
No seu serviço de deploy (Vercel, Netlify, etc.), configure:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Como verificar:**
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables
- Easypanel: App → Environment

### 2. API Key Inválida

**Sintoma:**
```
❌ Erro: Invalid API key
```

**Solução:**
1. Vá para Supabase Dashboard
2. Settings → API
3. Copie a "anon public" key
4. Atualize a variável `VITE_SUPABASE_ANON_KEY`

### 3. URL do Supabase Incorreta

**Sintoma:**
```
❌ Erro: Failed to fetch
```

**Solução:**
1. Vá para Supabase Dashboard
2. Settings → API
3. Copie a "Project URL"
4. Deve ser algo como: `https://xxxxx.supabase.co`

### 4. Tabelas Não Criadas no Banco

**Sintoma:**
```
❌ Erro ao acessar tenants: relation "public.tenants" does not exist
```

**Solução:**
Execute os scripts SQL no Supabase SQL Editor:
1. `supabase_core_schema.sql`
2. `supabase_schema_risk_alerts.sql`
3. `feature_flags_schema.sql`
4. `risk_evaluation_tables.sql`

### 5. Row Level Security (RLS) Bloqueando Acesso

**Sintoma:**
```
✅ Conexão OK
❌ Tabelas retornam vazio
```

**Solução:**
Temporariamente desabilitar RLS para testar:
```sql
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
-- etc...
```

**ATENÇÃO:** Reabilitar RLS após teste!

### 6. CORS Issues

**Sintoma:**
```
❌ Erro de rede: CORS policy
```

**Solução:**
No Supabase Dashboard:
1. Authentication → URL Configuration
2. Adicionar domínio de produção em "Site URL"
3. Adicionar em "Redirect URLs"

### 7. Projeto Supabase Pausado

**Sintoma:**
```
❌ Servidor retornou erro: 503 Service Unavailable
```

**Solução:**
1. Vá para Supabase Dashboard
2. Verifique se projeto está ativo
3. Se pausado, clique em "Restore"

---

## 📋 Checklist de Verificação

Execute os testes e marque:

- [ ] Variáveis de ambiente configuradas
- [ ] Cliente Supabase inicializa sem erro
- [ ] Consegue fazer ping no Supabase
- [ ] Consegue verificar sessão
- [ ] Tabelas existem no banco
- [ ] RLS configurado corretamente
- [ ] CORS configurado para domínio de produção
- [ ] Projeto Supabase ativo

---

## 🛠️ Como Executar os Testes

### Localmente
```bash
npm test -- supabaseClient.test.ts --run
```

### Interpretar Resultados

**✅ Sucesso:**
```
✅ VITE_SUPABASE_URL: Configurado
✅ Cliente Supabase inicializado
✅ Conexão com Supabase OK
✅ Tabela tenants acessível (5 registros)
```

**❌ Falha:**
```
❌ VITE_SUPABASE_URL: FALTANDO
❌ Erro ao conectar: Invalid API key
❌ Tabela tenants não existe no banco
```

---

## 🔧 Debugging em Produção

### 1. Verificar Console do Navegador

Abra DevTools (F12) e procure por:
```
🔧 Supabase Config: { url: ..., keyPresent: ... }
❌ ERRO: Variáveis de ambiente não configuradas!
```

### 2. Verificar Network Tab

1. Abra DevTools → Network
2. Filtre por "supabase"
3. Veja se há requests falhando
4. Verifique status code (200 = OK, 401 = Auth, 404 = Not Found)

### 3. Verificar Logs do Servidor

No seu serviço de deploy:
- Vercel: Deployments → Logs
- Netlify: Deploys → Deploy log
- Easypanel: Logs

Procure por:
```
❌ ERRO: Variáveis de ambiente não configuradas!
❌ Supabase credentials missing
```

---

## 🎯 Ação Imediata

**Execute agora:**
```bash
npm test -- supabaseClient.test.ts --run
```

**Envie o output completo** para análise detalhada.

---

## 📞 Próximos Passos

Baseado nos resultados dos testes, vou:
1. Identificar o problema exato
2. Fornecer solução específica
3. Criar script de correção automática
4. Validar em produção

---

**Criado em:** 08/01/2026 20:09  
**Status:** Aguardando resultados dos testes
