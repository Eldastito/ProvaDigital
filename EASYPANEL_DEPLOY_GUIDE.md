# 🔧 Guia de Correção - Página Branca no EasyPanel

## ❌ Problema Atual

Deploy foi bem-sucedido, mas página continua branca porque **as variáveis de ambiente não estão sendo passadas para o build do Docker**.

---

## ✅ SOLUÇÃO: Configurar Build Arguments no EasyPanel

### Passo 1: Acessar Configurações de Build

1. No **EasyPanel**, vá no seu projeto `provadigital`
2. Clique em **"Configurações"** ou **"Settings"**
3. Procure por **"Build Arguments"** ou **"Build Args"**

### Passo 2: Adicionar Build Arguments

Adicione as seguintes variáveis como **Build Arguments** (não apenas Environment Variables):

```
VITE_SUPABASE_URL=https://xqpjmqnkdtqyuqxfgxqy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGptcW5rZHRxeXVxeGZneHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMzE4NzgsImV4cCI6MjA0OTYwNzg3OH0.CtQGqPxKLhFqZVvBqCLKGVPqxQGqPxKLhFqZVvBqCLKGVPqxQGqPxKLhFqZVvBqCLKGVPqxQ
VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
```

### Passo 3: Rebuild

1. Salve as configurações
2. Faça um **novo deploy** (rebuild)
3. Aguarde o build completar

---

## 🔍 Como Verificar se Funcionou

Após o rebuild:

1. Acesse `forge.tesseractauto.com`
2. Pressione **F12** (DevTools)
3. Vá em **Console**
4. **NÃO deve ter** erros de "variáveis de ambiente não configuradas"

---

## 🆘 Se Não Funcionar

### Alternativa 1: Usar docker-compose.yml

Se o EasyPanel não suporta Build Arguments no Dockerfile, crie um `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
        VITE_GEMINI_API_KEY: ${VITE_GEMINI_API_KEY}
    ports:
      - "80:80"
```

### Alternativa 2: Build Localmente e Fazer Deploy da Imagem

```bash
# No seu computador
docker build \
  --build-arg VITE_SUPABASE_URL=https://xqpjmqnkdtqyuqxfgxqy.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
  --build-arg VITE_GEMINI_API_KEY=AIza... \
  -t examepad:latest .

# Push para Docker Hub
docker tag examepad:latest seu-usuario/examepad:latest
docker push seu-usuario/examepad:latest

# No EasyPanel, use a imagem do Docker Hub
```

### Alternativa 3: Usar Vercel/Netlify (Mais Fácil)

Se o EasyPanel continuar com problemas, recomendo usar:

- **Vercel** (grátis, suporta Vite nativamente)
- **Netlify** (grátis, configuração simples)
- **Railway** (grátis, suporta Docker)

**Configuração no Vercel** (5 minutos):
1. Conecte seu GitHub
2. Selecione o repositório
3. Adicione as variáveis de ambiente
4. Deploy automático!

---

## 📊 Checklist de Troubleshooting

- [ ] Variáveis estão em **Build Arguments** (não só Environment)
- [ ] Rebuild foi feito após adicionar Build Arguments
- [ ] Console do navegador não mostra erros de variáveis
- [ ] Arquivo `dist/` foi gerado corretamente no build

---

## 💡 Dica Importante

**Diferença entre Environment Variables e Build Arguments:**

- **Environment Variables**: Disponíveis em **runtime** (quando o container está rodando)
- **Build Arguments**: Disponíveis em **build time** (quando o Docker está compilando)

Para o Vite funcionar, você precisa de **Build Arguments** porque o Vite compila os arquivos durante o build.

---

**Me envie um print do console (F12) para eu ver os erros exatos!**
