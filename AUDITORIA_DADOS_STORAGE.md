# 📊 Relatório de Auditoria: Persistência e Dados Simulados

## 1. Uso de Memória do Navegador (localStorage)

Identificamos os seguintes dados armazenados localmente no navegador:

| Chave | Finalidade | Persistência |
| :--- | :--- | :--- |
| `lgpd_consent` | Armazena se o usuário aceitou os termos da LGPD. | Permanente até limpeza manual. |
| `examepad_last_route` | **(F5 Fix)** Salva a última página visitada para restaurar após refresh. | Limpa ao fazer logout ou após uso. |
| `test_profile` | Usado pelo `ProfileSwitcher` para alternar rápido entre perfis de teste. | Permanente (apenas para ambiente de desenvolvimento/demo). |
| `owl_rate_limit_[id]` | Limite diário de perguntas para o tutor de IA (Corujão). | Expira a cada 24h. |

---

## 2. Presença de Dados Mockados (Simulados)

A aplicação possui um sistema híbrido que utiliza a variável `VITE_USE_MOCK_DATA`.

### Onde os dados mockados aparecem?
1. **Inicialização do Store:** Se `VITE_USE_MOCK_DATA=true`, o sistema carrega centenas de registros de exemplo (escolas, alunos, itens).
2. **Fallback Automático:** No arquivo `useAppStore.ts`, se um usuário logar e seu perfil (avatar/moedas) ou registro de aluno não existir no Supabase, o sistema cria um **registro mock temporário** em memória para o app não quebrar.

---

## 3. Plano para Operação 100% Real

Para garantir que **nenhum** dado simulado interfira no sistema de produção, seguiremos este plano:

### Passo 1: Configuração Rigorosa
- Definir `VITE_USE_MOCK_DATA=false` no arquivo `.env` de produção.
- Isso fará com que todos os arrays (`items`, `students`, `exams`) iniciem vazios.

### Passo 2: Limpeza do Store (`useAppStore.ts`)
- Remover a lógica que gera `mockProfile` e `mockStudent` durante o `setCurrentUser`.
- Ajustar o `loadRemoteData` para que, se não houver dados no Supabase, o sistema simplesmente retorne vazio (estado real do banco).

### Passo 3: Limpeza de Memória
- Adicionar comando `localStorage.clear()` no momento do logout completo para garantir que nenhum resquício de sessões anteriores permaneça.

---

## 🧪 Teste de Fluxo Real (Frontend ↔ Backend ↔ Supabase)

Vou criar um script de teste (`supabase_write.test.ts`) que realizará as seguintes operações reais:

1. **Escrita:** Inserir um novo Item no Banco de Dados.
2. **Leitura:** Buscar o item inserido.
3. **Persistência:** Verificar se os campos coincidem exatamente com o enviado.
4. **Limpeza:** Deletar o item de teste.

---

## 🎯 Conclusão da Auditoria

A aplicação está **pronta** para operar com dados reais, mas ainda possui "rodinhas de treinamento" (os fallbacks mockados). Recomendo a remoção desses fallbacks para que o sistema aponte erros reais (como falta de dados) em vez de mascará-los com simulações.

**Próxima Ação:** Aguardar aprovação para aplicar a remoção dos fallbacks de código.
