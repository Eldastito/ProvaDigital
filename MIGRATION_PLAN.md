# Migração para Nested Routes - Plano Detalhado

## Status: 🚧 EM ANDAMENTO

### Checkpoint Criado
- ✅ Commit de segurança: "checkpoint: before nested routes migration"
- ✅ Todas as mudanças anteriores salvas

---

## FASE 1: Preparação e Mapeamento (1-2h)

### 1.1 Mapear todas as "views" do ViewRouter
- [ ] Listar todas as views em `ViewRouter.tsx`
- [ ] Mapear para URLs correspondentes
- [ ] Identificar views que usam parâmetros (examId, etc)

### 1.2 Identificar componentes que usam `setView`
- [ ] Buscar todos os usos de `setView` no código
- [ ] Listar componentes que precisam ser atualizados
- [ ] Priorizar por frequência de uso

---

## FASE 2: Criar Nova Estrutura de Rotas (2-3h)

### 2.1 Atualizar `routes.tsx`
- [ ] Manter rotas atuais funcionando
- [ ] Adicionar rotas alternativas com nested structure
- [ ] Testar que ambas funcionam em paralelo

### 2.2 Criar componente `DashboardLayout`
- [ ] Componente wrapper que usa `<Outlet />`
- [ ] Renderiza conteúdo baseado na rota filha
- [ ] Mantém compatibilidade com Layout atual

---

## FASE 3: Migração Gradual de Componentes (4-6h)

### 3.1 Grupo 1: Views Simples (sem parâmetros)
- [ ] `ItemsListView` → `/items`
- [ ] `ExamsListView` → `/exams`
- [ ] `AllocationView` → `/allocation`
- [ ] `ManagementView` → `/management`

### 3.2 Grupo 2: Views com Navegação Interna
- [ ] `ItemEditorView` → `/items/new`
- [ ] `ExamBuilderView` → `/exams/new`

### 3.3 Grupo 3: Views com Parâmetros
- [ ] `PrintableExamView` → `/exams/:id/print`
- [ ] `ResultsEntryView` → `/exams/:id/results`

### 3.4 Grupo 4: Student Portal
- [ ] `StudentDashboardView` → `/student`
- [ ] `OwlTutorView` → `/student/tutor`
- [ ] `StudentBattleView` → `/student/battle`
- [ ] `SurvivalView` → `/student/survival`
- [ ] `ArcadeView` → `/student/arcade`
- [ ] `AvatarShopView` → `/student/shop`

---

## FASE 4: Atualizar Navegação (3-4h)

### 4.1 Atualizar `Layout.tsx`
- [ ] Substituir `setView` por `navigate`
- [ ] Atualizar sidebar para usar URLs
- [ ] Testar navegação do menu

### 4.2 Atualizar botões de navegação
- [ ] Botões "Novo" → `navigate('/items/new')`
- [ ] Botões "Voltar" → `navigate(-1)` ou rota específica
- [ ] Links internos em cards/listas

### 4.3 Atualizar lógica de redirecionamento
- [ ] Login redirect → usar `navigate`
- [ ] Role-based redirects
- [ ] Fallback routes (404)

---

## FASE 5: Remover ViewRouter (1-2h)

### 5.1 Verificar que todas as views foram migradas
- [ ] Testar cada rota manualmente
- [ ] Verificar que F5 funciona em todas
- [ ] Confirmar que back/forward funcionam

### 5.2 Deletar código legado
- [ ] Remover `ViewRouter.tsx`
- [ ] Remover props `setView` dos componentes
- [ ] Remover estado `view` do App.tsx
- [ ] Limpar imports não usados

---

## FASE 6: Testes e Validação (2-3h)

### 6.1 Testes Funcionais
- [ ] Navegar por todas as telas
- [ ] Dar F5 em cada tela (deve manter estado)
- [ ] Testar botão voltar do navegador
- [ ] Testar botão avançar do navegador

### 6.2 Testes de Roles
- [ ] Login como ALUNO → testar navegação
- [ ] Login como PROFESSOR → testar navegação
- [ ] Login como ADMIN → testar navegação
- [ ] Login como DIRETOR → testar navegação

### 6.3 Testes de Edge Cases
- [ ] URL inválida → deve redirecionar
- [ ] Acesso sem permissão → deve bloquear
- [ ] Refresh em tela com parâmetros → deve manter

---

## ROLLBACK PLAN

Se algo der muito errado:
```bash
git reset --hard HEAD~1
git clean -fd
npm install
```

---

## PROGRESSO ATUAL

**Fase Atual:** 1 - Preparação  
**Tempo Estimado Restante:** 12-16 horas  
**Última Atualização:** 07/01/2026 22:12
