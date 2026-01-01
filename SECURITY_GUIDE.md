# 🔒 Guia de Segurança e Correção de Erros - ExamePad

## 🔴 PROBLEMA 1: Página Branca em Produção

### Causa
Variáveis de ambiente não configuradas no servidor de produção (Forge/EasyPanel).

### Solução Imediata

#### Passo 1: Configurar Variáveis de Ambiente no EasyPanel

1. Acesse **EasyPanel** → Seu Projeto → **Environment**
2. Adicione as seguintes variáveis:

```bash
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Gemini AI (OBRIGATÓRIO para IA)
VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
```

3. **Salve** e **Reinicie** o serviço

#### Passo 2: Verificar Build

O erro acontece porque o Vite não encontra as variáveis. Após configurar:

1. Faça um novo deploy
2. Verifique os logs de build
3. Acesse a URL e teste

---

## 🔒 PROBLEMA 2: Segurança do Repositório Público

### ⚠️ RISCOS IDENTIFICADOS

Seu repositório está **PÚBLICO** no GitHub. Isso significa:

❌ **Risco BAIXO** (por enquanto):
- `.env.local` NÃO foi commitado (protegido por `.gitignore`)
- Credenciais NÃO estão expostas no código
- ✅ Você está seguro!

⚠️ **Risco MÉDIO**:
- Qualquer pessoa pode ver sua lógica de negócio
- Competidores podem copiar funcionalidades
- Estrutura do banco de dados está visível

---

## ✅ SOLUÇÕES DE SEGURANÇA

### Opção 1: Tornar Repositório Privado (RECOMENDADO)

**Vantagens**:
- ✅ Código protegido
- ✅ Sem custo (GitHub oferece repos privados grátis)
- ✅ Controle total de acesso

**Como fazer**:
1. Acesse: https://github.com/Eldastito/ProvaDigital/settings
2. Role até **Danger Zone**
3. Clique em **Change visibility** → **Make private**
4. Confirme

**Desvantagens**:
- ❌ Não pode compartilhar publicamente
- ❌ Colaboradores precisam ser adicionados manualmente

---

### Opção 2: Manter Público com Proteções

Se quiser manter público (ex: portfólio, open source):

#### A. Remover Dados Sensíveis do Histórico

```bash
# Verificar se há arquivos sensíveis no histórico
git log --all --full-history -- .env.local
git log --all --full-history -- .env

# Se encontrar algo, limpar histórico (CUIDADO!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push (sobrescreve histórico)
git push origin --force --all
```

#### B. Adicionar Avisos de Segurança

Criar `SECURITY.md`:

```markdown
# Política de Segurança

## Variáveis de Ambiente Necessárias

Este projeto requer as seguintes variáveis de ambiente:

- `VITE_SUPABASE_URL` - URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `VITE_GEMINI_API_KEY` - Chave da API Gemini

**NUNCA** commite o arquivo `.env.local` com suas credenciais reais.

## Reportar Vulnerabilidades

Se encontrar uma vulnerabilidade, envie email para: [seu-email]
```

#### C. Usar Secrets do GitHub Actions (para CI/CD)

Se usar GitHub Actions:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

---

### Opção 3: Repositório Híbrido

**Código público** + **Configurações privadas**:

1. Manter repo público
2. Criar repo privado separado: `examepad-config`
3. Armazenar lá:
   - Credenciais de produção
   - Configurações de deploy
   - Documentação interna

---

## 🛡️ CHECKLIST DE SEGURANÇA

### ✅ Já Protegido
- [x] `.env.local` no `.gitignore`
- [x] Variáveis de ambiente usando `VITE_` prefix
- [x] Credenciais não hardcoded no código
- [x] `.env.example` sem valores reais

### ⚠️ Melhorias Recomendadas
- [ ] Tornar repositório privado OU
- [ ] Adicionar `SECURITY.md`
- [ ] Configurar GitHub Secrets (se usar Actions)
- [ ] Adicionar autenticação de 2 fatores no GitHub
- [ ] Revisar permissões de colaboradores

### 🔒 Segurança Avançada (Futuro)
- [ ] Implementar rate limiting
- [ ] Adicionar CORS restritivo
- [ ] Usar Supabase RLS (Row Level Security)
- [ ] Implementar audit logs
- [ ] Configurar alertas de segurança (Dependabot)

---

## 🚀 CORREÇÃO RÁPIDA (5 MINUTOS)

### Para Resolver AGORA:

1. **Configurar Variáveis no EasyPanel**:
   ```
   VITE_SUPABASE_URL=https://xqpjmqnkdtqyuqxfgxqy.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_GEMINI_API_KEY=AIzaSy...
   ```

2. **Reiniciar Serviço**

3. **Testar**: Acessar `forge.tesseractauto.com`

4. **Tornar Repo Privado** (opcional mas recomendado):
   - GitHub → Settings → Danger Zone → Make private

---

## 📊 MATRIZ DE DECISÃO

| Cenário | Recomendação |
|---------|--------------|
| **Produto comercial** | 🔒 Privado |
| **Portfólio pessoal** | 🌐 Público + SECURITY.md |
| **Open source** | 🌐 Público + boas práticas |
| **MVP/Testes** | 🔒 Privado (por enquanto) |

---

## ❓ FAQ

**P: Minhas credenciais foram expostas?**  
R: NÃO. O `.gitignore` protegeu o `.env.local`. Você está seguro.

**P: Preciso trocar as chaves?**  
R: Não é necessário, mas é boa prática rotacionar periodicamente.

**P: Como verifico se algo vazou?**  
R: Use: `git log --all --full-history -- .env.local`

**P: Repo privado tem custo?**  
R: NÃO. GitHub oferece repos privados ilimitados grátis.

---

## 🆘 SUPORTE

Se precisar de ajuda:
1. Verifique os logs do EasyPanel
2. Teste localmente com `npm run dev`
3. Compare variáveis de ambiente

**Próximos Passos**:
1. ✅ Configurar variáveis no EasyPanel
2. ✅ Decidir sobre privacidade do repo
3. ✅ Testar em produção
