# 🚀 ExamePad - Checklist de Deploy & Testes

**Data:** 07/01/2026  
**Versão:** v2.0 (Feature Flags + Hybrid Correction + Kiosk Mode)

---

## ✅ PRÉ-DEPLOY (Supabase)

### 1. Aplicar SQLs no Supabase
- [ ] **RLS Hardening:** Executar `supabase_core_schema.sql` (atualizado)
- [ ] **Feature Flags:** Executar `feature_flags_schema.sql`
- [ ] **Risk View:** Executar `risk_calculation_view.sql`

**Como aplicar:**
1. Abra o Supabase Dashboard → SQL Editor
2. Cole o conteúdo de cada arquivo
3. Execute (Run)
4. Verifique se não há erros

### 2. Configurar Feature Flags Iniciais
Execute no SQL Editor:
```sql
-- Habilitar AI Tutor para tenant de teste
INSERT INTO public.tenant_features (tenant_id, feature_key, is_enabled)
VALUES ('t1', 'AI_TUTOR', true)
ON CONFLICT (tenant_id, feature_key) DO UPDATE SET is_enabled = true;

-- Desabilitar para outro tenant (exemplo)
INSERT INTO public.tenant_features (tenant_id, feature_key, is_enabled)
VALUES ('t2', 'AI_TUTOR', false)
ON CONFLICT (tenant_id, feature_key) DO UPDATE SET is_enabled = true;
```

---

## 🌐 DEPLOY FRONTEND

### 3. Push para GitHub
- [x] `git add .`
- [x] `git commit -m "feat: Feature Flags, Hybrid Correction, Kiosk Mode..."`
- [ ] `git push origin main`

### 4. Verificar Deploy Automático
- [ ] Abrir Vercel/Netlify Dashboard
- [ ] Confirmar que o deploy foi disparado
- [ ] Aguardar conclusão (~2-5 min)
- [ ] Verificar logs de build (sem erros)

---

## 🧪 TESTES FUNCIONAIS (Web)

### 5. Feature Flags
- [ ] Login como aluno de tenant com `AI_TUTOR = true`
- [ ] Fazer uma prova e errar uma questão
- [ ] Verificar que o botão "Me explique Corujão" aparece
- [ ] Login como aluno de tenant com `AI_TUTOR = false`
- [ ] Verificar que o botão NÃO aparece

### 6. Correção Híbrida
- [ ] Login como professor
- [ ] Ir em "Lançamento de Resultados"
- [ ] Selecionar uma prova com questão discursiva
- [ ] Digitar uma resposta de teste no campo de texto
- [ ] Clicar no botão 🧠 (IA)
- [ ] Verificar que aparece um card roxo com sugestão
- [ ] Clicar em "✅ Aceitar" e verificar que a nota é preenchida
- [ ] Testar "Corrigir Todas" (batch)

### 7. Kiosk Mode Web
- [ ] Login como aluno
- [ ] Iniciar uma prova
- [ ] Verificar que entra em fullscreen automaticamente
- [ ] Pressionar `Esc` para sair do fullscreen
- [ ] Verificar que aparece overlay preto de bloqueio
- [ ] Clicar em "Retornar à Prova"
- [ ] Verificar que volta ao fullscreen
- [ ] Dar `Alt+Tab` para outra janela
- [ ] Voltar e verificar que o contador de infrações aumentou

### 8. Dashboard de Risco
- [ ] Login como diretor/admin
- [ ] Abrir Dashboard de Risco
- [ ] Verificar que carrega instantaneamente (< 1s)
- [ ] Filtrar por escola
- [ ] Verificar que os níveis de risco (HIGH/MEDIUM/LOW) aparecem
- [ ] Clicar em um aluno de risco alto
- [ ] Verificar que os fatores detalhados aparecem

### 9. Bulk Import
- [ ] Login como admin
- [ ] Ir em `/admin/import`
- [ ] Baixar template CSV
- [ ] Preencher com dados de teste
- [ ] Fazer upload
- [ ] Verificar que os dados foram importados
- [ ] Conferir no Supabase se os registros foram criados

---

## 📱 TESTES MOBILE (APK)

### 10. Instalação do APK
- [ ] Copiar `android/app/build/outputs/apk/debug/app-debug.apk` para o tablet
- [ ] Instalar o APK
- [ ] Permitir "Fontes Desconhecidas" se solicitado
- [ ] Abrir o app

### 11. Funcionalidades Básicas
- [ ] Login como aluno
- [ ] Verificar que a interface carrega corretamente
- [ ] Navegar entre telas (Dashboard, Arcade, Loja)
- [ ] Verificar que as imagens/ícones aparecem

### 12. Kiosk Mode (App)
- [ ] Iniciar uma prova no app
- [ ] Verificar que pede permissão de câmera
- [ ] Aceitar permissão
- [ ] Verificar que a câmera aparece no canto superior direito
- [ ] Tentar apertar o botão Home
- [ ] Verificar se registra infração (ainda não bloqueia 100% sem Device Owner)
- [ ] Verificar que o contador de infrações aumenta

### 13. Performance
- [ ] Testar navegação (deve ser fluida)
- [ ] Testar scroll em listas longas
- [ ] Verificar consumo de bateria (deixar rodando 10 min)

---

## 🔒 TESTES DE SEGURANÇA

### 14. RLS (Row Level Security)
- [ ] Login como professor da Escola A
- [ ] Tentar acessar dados da Escola B via URL direta
- [ ] Verificar que retorna vazio ou erro 403
- [ ] Login como aluno
- [ ] Tentar acessar `/admin/import`
- [ ] Verificar que é bloqueado

### 15. Feature Flags (Bypass)
- [ ] Tentar forçar `AI_TUTOR` via DevTools (alterar state)
- [ ] Verificar que o backend ainda valida (não envia dados se desabilitado)

---

## 📊 VALIDAÇÃO DE DADOS

### 16. Supabase - Verificar Tabelas
- [ ] `tenant_features` - Pelo menos 1 registro
- [ ] `students` - RLS funcionando (só vê da própria escola)
- [ ] `exam_results` - Notas sendo salvas corretamente
- [ ] View `student_risk_assessment` - Retorna dados

### 17. Logs de Erro
- [ ] Verificar console do navegador (F12) - sem erros críticos
- [ ] Verificar Supabase Logs - sem erros de query
- [ ] Verificar Vercel/Netlify Logs - build sem warnings críticos

---

## 🐛 BUGS CONHECIDOS (Para Corrigir Depois)

1. **TypeScript Errors em `routes.tsx`:** Componentes esperam props que não são passadas via `react-router-dom`. Precisa refatorar para usar `useOutletContext`.
2. **Java 23 vs Gradle:** APK build pode falhar se Java 23 estiver configurado (recomendado Java 17).
3. **Device Owner:** Kiosk Mode no app ainda não bloqueia 100% o botão Home (precisa configurar Android Management API).

---

## ✅ CRITÉRIOS DE SUCESSO

**Deploy é considerado bem-sucedido se:**
- [ ] Todos os SQLs aplicados sem erro
- [ ] Frontend deployado e acessível
- [ ] Feature Flags funcionando (botão aparece/desaparece)
- [ ] Correção Híbrida gerando sugestões
- [ ] Kiosk Mode bloqueando tela ao sair do fullscreen
- [ ] Dashboard de Risco carregando em < 1s
- [ ] APK instalando e abrindo no tablet
- [ ] RLS impedindo acesso cross-tenant

---

## 📞 SUPORTE

**Se algo der errado:**
1. Verificar logs do Supabase (SQL Editor → Logs)
2. Verificar console do navegador (F12)
3. Verificar logs do Vercel/Netlify
4. Rollback: `git revert HEAD` + `git push`

**Contato:** [Seu email/Slack]

---

**Boa sorte com o deploy! 🚀**
