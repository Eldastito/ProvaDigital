# Guia de Validação Manual - Staging

## 🎯 Objetivo
Validar todas as funcionalidades críticas do ExamePad em staging antes de liberar para escolas piloto.

---

## 👤 Usuários de Teste

Criar os seguintes usuários no Supabase staging:

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| admin@staging.test | Test@123 | SUPER_ADMIN | Admin geral |
| diretor@staging.test | Test@123 | DIRETOR | Diretor de escola |
| professor@staging.test | Test@123 | PROFESSOR | Professor |
| aluno@staging.test | Test@123 | ALUNO | Aluno |
| pais@staging.test | Test@123 | PAIS | Responsável |

---

## ✅ Checklist de Validação

### 1. Autenticação e Acesso

- [ ] Login com email/senha funciona
- [ ] Logout funciona
- [ ] Redirecionamento correto por role
- [ ] Sessão persiste após refresh
- [ ] Botões de navegação funcionam

**Como testar:**
1. Acessar URL de staging
2. Fazer login com cada tipo de usuário
3. Verificar se vai para a tela correta
4. Dar refresh (F5) e verificar se mantém sessão
5. Fazer logout

---

### 2. Banco de Itens

#### 2.1 Criação Manual
- [ ] Criar questão objetiva
- [ ] Criar questão dissertativa
- [ ] Adicionar imagem à questão
- [ ] Salvar e visualizar questão

**Como testar:**
1. Login como professor
2. Ir em "Banco de Itens"
3. Clicar em "Nova Questão"
4. Preencher todos os campos
5. Salvar e verificar se aparece na lista

#### 2.2 OCR (Gemini Vision)
- [ ] Upload de imagem funciona
- [ ] OCR extrai texto corretamente
- [ ] Questão é criada com texto extraído
- [ ] Possível editar após OCR

**Como testar:**
1. Preparar imagem de questão
2. Clicar em "Importar via OCR"
3. Fazer upload da imagem
4. Verificar extração de texto
5. Salvar questão

#### 2.3 Auditoria Pedagógica
- [ ] Botão "Auditoria" aparece
- [ ] IA analisa a questão
- [ ] Sugestões são exibidas
- [ ] Possível aplicar sugestões

**Como testar:**
1. Abrir uma questão
2. Clicar em "Auditoria Pedagógica"
3. Aguardar análise da IA
4. Verificar sugestões

---

### 3. Construtor de Provas

#### 3.1 Montagem Manual
- [ ] Selecionar questões do banco
- [ ] Adicionar questões à prova
- [ ] Reordenar questões
- [ ] Salvar prova

**Como testar:**
1. Ir em "Provas"
2. Clicar em "Nova Prova"
3. Adicionar 5 questões
4. Reordenar questões
5. Salvar prova

#### 3.2 Montagem Inteligente (IA)
- [ ] Definir critérios (dificuldade, BNCC)
- [ ] IA sugere questões
- [ ] Possível ajustar seleção
- [ ] Prova é criada

**Como testar:**
1. Clicar em "Montagem Inteligente"
2. Definir: 10 questões, médio, Matemática
3. Aguardar sugestões da IA
4. Revisar e salvar

---

### 4. Aplicação de Prova (Tablet)

- [ ] Modo tablet ativa
- [ ] Prova carrega corretamente
- [ ] Aluno consegue responder
- [ ] Navegação entre questões funciona
- [ ] Envio de respostas funciona

**Como testar:**
1. Login como aluno
2. Acessar prova disponível
3. Responder 3 questões
4. Navegar entre questões
5. Finalizar prova

---

### 5. Monitor ao Vivo

- [ ] Professor vê alunos online
- [ ] Progresso em tempo real
- [ ] Alertas de segurança funcionam
- [ ] Chat professor-aluno funciona

**Como testar:**
1. Login como professor
2. Abrir "Monitor ao Vivo"
3. Verificar lista de alunos
4. Verificar progresso
5. Enviar mensagem para aluno

---

### 6. Correção e Resultados

#### 6.1 Correção Automática
- [ ] Questões objetivas corrigidas
- [ ] Nota calculada corretamente
- [ ] Resultado salvo

**Como testar:**
1. Finalizar prova como aluno
2. Login como professor
3. Ir em "Resultados"
4. Verificar nota automática

#### 6.2 Correção Manual (Dissertativas)
- [ ] Questões dissertativas aparecem
- [ ] Possível atribuir nota
- [ ] Possível adicionar comentário
- [ ] Nota final atualiza

**Como testar:**
1. Abrir prova com dissertativa
2. Atribuir nota manualmente
3. Adicionar comentário
4. Salvar e verificar nota final

---

### 7. Dashboard e Analytics

- [ ] Dashboard carrega
- [ ] Gráficos aparecem
- [ ] Dados estão corretos
- [ ] Filtros funcionam

**Como testar:**
1. Login como diretor
2. Ir em "Dashboard"
3. Verificar gráficos
4. Aplicar filtros
5. Exportar relatório (se disponível)

---

### 8. Portal do Aluno

#### 8.1 Dashboard
- [ ] Notas aparecem
- [ ] Gráfico de evolução funciona
- [ ] Próximas provas listadas

**Como testar:**
1. Login como aluno
2. Verificar dashboard
3. Clicar em prova concluída
4. Ver detalhes

#### 8.2 Tutor IA (Corujão)
- [ ] Chat abre
- [ ] IA responde perguntas
- [ ] Histórico salva
- [ ] Possível fazer novas perguntas

**Como testar:**
1. Abrir "Tutor IA"
2. Fazer pergunta sobre matemática
3. Verificar resposta
4. Fazer follow-up

---

### 9. Gamificação

- [ ] Owl Coins aparecem
- [ ] Badges desbloqueados
- [ ] Ranking funciona
- [ ] Batalhas disponíveis

**Como testar:**
1. Login como aluno
2. Ir em "Arcade Zone"
3. Jogar uma batalha
4. Verificar coins ganhos

---

### 10. Performance e Segurança

- [ ] Páginas carregam em < 3s
- [ ] Sem erros no console
- [ ] RLS bloqueia acessos indevidos
- [ ] Dados isolados por tenant

**Como testar:**
1. Abrir DevTools (F12)
2. Verificar Console (sem erros)
3. Verificar Network (tempos de resposta)
4. Tentar acessar dados de outro tenant (deve falhar)

---

## 📊 Critérios de Aprovação

Para aprovar o staging:

- [ ] **100% dos itens críticos** passando (itens 1-6)
- [ ] **90%+ dos itens gerais** passando (itens 7-10)
- [ ] **Zero erros críticos** no console
- [ ] **Latência média < 500ms**
- [ ] **Sem vazamento de dados** entre tenants

---

## 🐛 Reportar Bugs

Se encontrar bugs, documente:

1. **Título:** Descrição curta
2. **Passos:** Como reproduzir
3. **Esperado:** O que deveria acontecer
4. **Atual:** O que acontece
5. **Severidade:** Crítico / Alto / Médio / Baixo
6. **Screenshot:** Se aplicável

---

**Responsável:** Equipe ExamePad  
**Prazo:** 2 dias após deploy  
**Status:** 🟡 Aguardando Deploy
