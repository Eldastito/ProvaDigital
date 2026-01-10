# Guia de Deploy - Easypanel

## 🎯 Por que Easypanel?

O Easypanel é ideal para este projeto porque:
- ✅ **Self-hosted:** Controle total sobre a infraestrutura
- ✅ **Docker nativo:** Deploy via containers
- ✅ **Mais barato:** Sem custos de plataforma
- ✅ **Privacidade:** Dados ficam no seu servidor
- ✅ **Flexibilidade:** Configuração completa

---

## 🚀 Deploy no Easypanel

### Opção 1: Via Git (Recomendado)

1. **Push para repositório Git:**
```bash
git add .
git commit -m "Preparar deploy staging"
git push origin main
```

2. **No Easypanel:**
   - Criar novo App
   - Tipo: **Docker**
   - Conectar repositório Git
   - Branch: `main`

3. **Configurar variáveis de ambiente:**
```env
VITE_SUPABASE_URL=https://donwkyyrqydogtgyzcar.supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave]
VITE_GEMINI_API_KEY=[sua-chave]
VITE_ENV=staging
```

4. **Deploy automático** ✅

---

### Opção 2: Via Docker Manual

1. **Build local:**
```powershell
.\deploy-easypanel.ps1
```

2. **Build da imagem:**
```bash
docker build -t examepad-staging .
```

3. **Testar localmente:**
```bash
docker run -p 8080:80 examepad-staging
```
Acesse: http://localhost:8080

4. **Push para registry:**
```bash
docker tag examepad-staging seu-registry/examepad-staging
docker push seu-registry/examepad-staging
```

5. **No Easypanel:**
   - Criar App do tipo Docker
   - Imagem: `seu-registry/examepad-staging`
   - Deploy ✅

---

## 📋 Checklist de Deploy

- [ ] Build local funcionando
- [ ] Dockerfile criado
- [ ] nginx.conf configurado
- [ ] Variáveis de ambiente definidas
- [ ] Domínio configurado (staging.examepad.com)
- [ ] SSL/HTTPS ativado
- [ ] Deploy realizado
- [ ] Validação manual concluída

---

## 🔧 Configurações Importantes

### Domínio
Configure um subdomínio para staging:
- `staging.examepad.com`
- `app-staging.examepad.com`

### SSL/HTTPS
Easypanel configura automaticamente via Let's Encrypt

### Recursos Recomendados
- **CPU:** 1 vCPU
- **RAM:** 512MB - 1GB
- **Storage:** 5GB

---

## 🎯 Após o Deploy

1. **Testar acesso:** https://staging.examepad.com
2. **Validação manual:** Ver `VALIDACAO_MANUAL_STAGING.md`
3. **Monitorar logs:** Via Easypanel dashboard
4. **Convidar escolas piloto**

---

## 🆚 Comparação: Easypanel vs Vercel

| Recurso | Easypanel | Vercel |
|---------|-----------|--------|
| Custo | $0 (self-hosted) | $20/mês |
| Controle | Total | Limitado |
| Privacidade | 100% | Compartilhado |
| Deploy | Docker | Git |
| Escalabilidade | Manual | Automática |

**Recomendação:** Easypanel para staging e produção inicial. Vercel para demos rápidas.

---

**Status:** 🚀 Pronto para deploy no Easypanel!
