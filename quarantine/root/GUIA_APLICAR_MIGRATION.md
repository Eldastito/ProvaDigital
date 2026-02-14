# Guia: Aplicar Migration SQL via Supabase Dashboard

## 📋 Pré-requisitos

Como o Supabase CLI não está instalado, vamos aplicar a migration diretamente pelo Dashboard do Supabase.

---

## 🚀 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **donwkyyrqydogtgyzcar** (ou o nome do seu projeto)

### 2. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **+ New query** para criar uma nova query

### 3. Copiar o Conteúdo da Migration

1. Abra o arquivo: `supabase_migration_production_hardening.sql`
2. Selecione **TODO o conteúdo** (Ctrl+A)
3. Copie (Ctrl+C)

### 4. Colar e Executar

1. Cole o conteúdo no SQL Editor do Supabase (Ctrl+V)
2. **IMPORTANTE:** Revise o código antes de executar
3. Clique no botão **Run** (ou pressione Ctrl+Enter)

### 5. Verificar Resultados

Você deve ver mensagens de sucesso como:

```
✓ DROP POLICY
✓ CREATE POLICY "Read risk alerts by hierarchy"
✓ CREATE POLICY "Manage risk alerts by role"
✓ CREATE INDEX
✓ CREATE FUNCTION
✓ CREATE TRIGGER
```

Se houver erros, anote-os e me informe.

---

## ✅ Validação Pós-Migration

### Opção 1: Via Testes Automatizados
```powershell
npm run test -- security.test.ts --run
```

**Resultado esperado:** 12/12 testes passando

### Opção 2: Via SQL Manual

Execute no SQL Editor do Supabase:

```sql
-- 1. Verificar policies criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('risk_alerts', 'interventions', 'notifications')
ORDER BY tablename, policyname;

-- 2. Verificar constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conname LIKE '%tenant_id%';

-- 3. Verificar triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE 'audit_%';

-- 4. Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
AND tablename IN ('risk_alerts', 'interventions', 'notifications');
```

---

## 🔍 Troubleshooting

### Erro: "policy already exists"
**Solução:** A migration já foi aplicada parcialmente. Execute apenas as partes que faltam.

### Erro: "function does not exist"
**Solução:** Verifique se a função `get_current_user_role()` existe no schema. Se não, crie-a primeiro.

### Erro: "column does not exist"
**Solução:** Verifique se as tabelas `risk_alerts`, `interventions` e `notifications` existem.

---

## 📊 Checklist de Validação

Após aplicar a migration, verifique:

- [ ] Policies antigas removidas
- [ ] Novas policies criadas (hierárquicas)
- [ ] Constraints de tenant_id aplicados
- [ ] Índices criados
- [ ] Função `validate_tenant_access` criada
- [ ] Triggers de auditoria aplicados
- [ ] Testes de segurança passando

---

## 🎯 Próximos Passos

1. ✅ Aplicar migration via Dashboard
2. ✅ Executar testes: `npm run test -- security.test.ts --run`
3. ✅ Verificar que 12/12 testes passam
4. 🚀 Sistema pronto para produção!

---

## 💡 Dica: Instalar Supabase CLI (Opcional)

Para facilitar futuras migrations:

```powershell
npm install -g supabase
```

Depois, você poderá usar:
```powershell
supabase login
supabase link --project-ref donwkyyrqydogtgyzcar
supabase db push --file migration.sql
```

---

**Última Atualização:** 10/01/2026  
**Arquivo:** `supabase_migration_production_hardening.sql`
