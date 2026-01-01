# 🧪 Guia de Teste - Sistema de Alertas de Evasão

## Pré-requisitos
- ✅ Servidor rodando (`npm run dev`)
- ✅ Navegador aberto em `http://localhost:5173`

---

## 📋 Teste 1: Dashboard para Pais

### Objetivo
Validar que pais conseguem ver desempenho dos filhos e receber alertas.

### Passos

1. **Login como Pai**
   ```
   Email: Use um usuário com role PAIS do mockData
   Exemplo: Buscar em utils/mockData.ts um usuário PAIS
   ```

2. **Verificar Menu Lateral**
   - ✅ Deve aparecer item "Meus Filhos" (primeiro da lista)
   - ✅ Clicar nele

3. **Validar Dashboard**
   - ✅ Se tiver múltiplos filhos: seletor aparece no topo
   - ✅ 4 Cards de métricas visíveis:
     - IDG (Desempenho)
     - Frequência (%)
     - Última Nota
     - Próxima Prova
   - ✅ Timeline de atividades recentes
   - ✅ Botões de ação (Conversar com Professor, Ver Boletim)

4. **Testar Responsividade**
   - ✅ Redimensionar janela para mobile (375px)
   - ✅ Cards devem empilhar verticalmente
   - ✅ Timeline deve permanecer legível

### Critérios de Sucesso
- [ ] Dashboard carrega sem erros
- [ ] Métricas mostram valores reais (não "0" ou "N/A")
- [ ] Timeline mostra pelo menos 1 atividade
- [ ] Layout responsivo funciona

---

## 📋 Teste 2: Gestão de Risco (Coordenadores)

### Objetivo
Validar detecção de risco e sugestões de intervenção.

### Passos

1. **Login como Coordenador**
   ```
   Email: Use um usuário com role SUPERVISOR ou DIRETOR
   ```

2. **Verificar Menu Lateral**
   - ✅ Deve aparecer item "Gestão de Risco" (seção Gestão & BI)
   - ✅ Clicar nele

3. **Validar Dashboard de Risco**
   - ✅ 4 Cards de estatísticas no topo:
     - Total de Alunos
     - Risco Alto (vermelho)
     - Risco Médio (amarelo)
     - Risco Baixo (verde)
   - ✅ Filtros funcionando:
     - Por nível de risco
     - Por turma
   - ✅ Lista de alunos ordenada por score (maior risco primeiro)

4. **Expandir Detalhes de Aluno**
   - ✅ Clicar em um aluno com risco ALTO
   - ✅ Verificar seção "Fatores de Risco":
     - Nome do fator (ex: "Frequência Baixa")
     - Valor atual vs. Limiar
     - Evidências (lista de bullets)
     - Recomendação específica
   - ✅ Verificar seção "Intervenções Sugeridas":
     - Prioridade (URGENT/HIGH/MEDIUM)
     - Ação clara
     - Responsável (PARENT/TEACHER/COORDINATOR)
     - Prazo sugerido
     - Impacto esperado

5. **Testar Filtros**
   - ✅ Filtrar apenas "Risco Alto"
   - ✅ Contador deve atualizar ("Mostrando X de Y alunos")
   - ✅ Filtrar por uma turma específica
   - ✅ Combinar ambos os filtros

### Critérios de Sucesso
- [ ] Dashboard carrega sem erros
- [ ] Pelo menos 1 aluno aparece em risco
- [ ] Fatores de risco têm evidências concretas (não genéricas)
- [ ] Intervenções são específicas e acionáveis
- [ ] Filtros funcionam corretamente

---

## 📋 Teste 3: Algoritmo de Risco (Validação Técnica)

### Objetivo
Validar que o algoritmo está calculando corretamente.

### Passos

1. **Abrir Console do Navegador** (F12)

2. **Rodar Script de Validação**
   ```javascript
   // Importar função de validação
   import { validateRiskEngine } from './services/validateRiskEngine';
   
   // Rodar validação
   validateRiskEngine();
   ```

3. **Analisar Output**
   - ✅ Deve mostrar análise de 10 alunos
   - ✅ Para cada aluno:
     - Nome
     - Score de risco (0-100)
     - Nível (LOW/MEDIUM/HIGH)
     - Fatores identificados
     - Intervenções sugeridas
   - ✅ Estatísticas gerais:
     - % em cada nível de risco
     - Média de score
     - Fatores mais comuns

### Critérios de Sucesso
- [ ] Script roda sem erros
- [ ] Scores fazem sentido (não todos 0 ou 100)
- [ ] Distribuição de risco é realista (~10-20% alto, ~30% médio, ~50% baixo)
- [ ] Fatores mais comuns são frequência e desempenho

---

## 🐛 Troubleshooting

### Problema: Dashboard não carrega
**Solução**: 
1. Verificar console do navegador (F12)
2. Procurar erros de import
3. Verificar se `npm run dev` está rodando

### Problema: Métricas mostram "0" ou "N/A"
**Solução**:
1. Verificar se há dados em `utils/mockData.ts`
2. Verificar se `results` tem pelo menos 1 resultado para o aluno
3. Verificar se `exams` tem provas cadastradas

### Problema: Nenhum aluno em risco
**Solução**:
1. Algoritmo está funcionando (alunos estão bem!)
2. Para testar, ajustar mock data para simular risco:
   - Reduzir notas em `mockData.ts`
   - Ou ajustar thresholds em `riskDetectionEngine.ts`

### Problema: Erro de TypeScript
**Solução**:
1. Rodar `npx tsc --noEmit` para ver erros
2. Verificar imports (especialmente `ExamStatus` vs string literal)

---

## ✅ Checklist Final

Antes de ir para produção, validar:

- [ ] **Segurança**: Credenciais em `.env.local` (não hardcoded)
- [ ] **Performance**: Dashboard carrega em <2s
- [ ] **Responsividade**: Funciona em mobile (375px), tablet (768px), desktop (1440px)
- [ ] **Acessibilidade**: Navegação por teclado funciona
- [ ] **Dados**: Algoritmo gera scores realistas
- [ ] **UX**: Intervenções são acionáveis (não genéricas)
- [ ] **Explicabilidade**: Cada alerta mostra POR QUÊ (LGPD)

---

## 📊 Métricas de Sucesso (Pós-Deploy)

**Curto Prazo (30 dias)**:
- [ ] >60% dos pais acessam dashboard semanalmente
- [ ] >80% dos alertas de risco ALTO resultam em ação (reunião agendada)
- [ ] Tempo médio de resposta a alerta: <48h

**Médio Prazo (90 dias)**:
- [ ] Redução de 15% na evasão (vs. período anterior)
- [ ] Aumento de 10% na frequência média
- [ ] >70% dos coordenadores consideram alertas "úteis" ou "muito úteis"

---

**Próximo**: Após validação, implementar persistência no Supabase (salvar alertas, histórico de intervenções).
