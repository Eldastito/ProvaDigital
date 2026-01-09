# ExamePad SaaS: Gap Analysis & Roadmap 🚀

Este documento compara as promessas do **Relatório de Análise** com o estado atual do **Codebase** (Version 1.0.1) e define os próximos passos para a entrega final.

## 📊 Comparativo: Promessa vs. Realidade

| Pilar | Promessa (Relatório) | Status no Código | Observação |
| :--- | :--- | :--- | :--- |
| **Pessoas/Roles** | 8 perfis (MEC até Pais) | ✅ Completo | Implementado em `Layout.tsx` e `types.ts`. |
| **IA (Gemini)** | Geração, Correção e Tutor | ✅ Robusto | `geminiService.ts` possui todas as funções prometidas. |
| **Gamification** | Loja, Moedas, XP, Modos de Jogo | ✅ Completo | Componentes `Shop`, `Battle`, `Survival` e `Mentorship` prontos. |
| **Gestão de Risco** | Algoritmo preditivo e Alertas | ✅ Completo | `riskDetectionEngine.ts` e `RiskDashboard.tsx` funcionais. |
| **Neuro-screening** | Triagem TDAH/TEA via IA | ✅ Completo | `NeuroScreeningView.tsx` integra-se ao Gemini. |
| **Modo Offline** | Tablet App, Mesh, Cripto | 🟡 Integrado | `localMeshService.ts` simula rede local (Mesh) via BroadcastChannel. |
| **Dados Reais** | 100% integração Supabase | 🟡 Em Progresso | Migração concluída, mas requer ajuste em dados de vínculos (ex: Pais-Filhos). |

---

## 🔍 Gaps Identificados (O que falta refinar)

1. **Automação de Vínculos (Data Sync):**
   - O sistema depende do preenchimento manual de `children_ids` na tabela `users` para pais.
   - **Solução:** Criar um script ou interface de administração para vinculação em massa.

2. **Polimento de Estados Vazios (UX):**
   - Algumas telas exibem listas vazias ou "Nenhum dado" sem contexto (como era o caso dos Pais).
   - **Solução:** Aplicar o padrão de "Empty State" com botões de ação em todos os dashboards.

3. **Integração Visível de IA no Editor:**
   - Embora o `geminiService` suporte "Melhorar Enunciado" e "Sugerir BNCC", esses botões precisam estar mais acessíveis no `ItemEditorView`.

---

## 🗺️ Roadmap de Implementação (Guia de Próximos Passos)

### Fase 1: Estabilidade de Dados (Imediato)
- [ ] **Script de Migração de Vínculos:** Criar um helper SQL/Node para associar pais aos alunos baseado em critérios (sobrenome, CPF ou código da escola).
- [ ] **Validação de RLS:** Revisar políticas de segurança para garantir que `STATE_ADMIN` e `TENANT_ADMIN` vejam apenas seus respectivos dados.

### Fase 2: Refinamento de UX & IA (Curto Prazo)
- [ ] **Assistente de IA no Editor:** Adicionar botão "✨ Melhorar com IA" no `ItemEditorView.tsx`.
- [ ] **Dashboard Consolidado (MEC/Estado):** Refinar as visões de mapa geográfico no `DashboardView` para usar dados agregados reais do Supabase.

### Fase 3: Produção & Mobile (Médio Prazo)
- [ ] **Otimização PWA/Capacitor:** Testar a persistência de login no app Android após builds finais.
- [ ] **Sincronização Offline Real:** Testar o `localMeshService` em múltiplos dispositivos físicos.

---

## 🛠️ Como usar este guia
Este plano servirá como nossa "North Star". Cada vez que terminarmos uma correção, voltamos aqui para marcar o progresso e garantir que o **ExamePad** entregue exatamente o que foi prometido no relatório comercial.

> [!IMPORTANT]
> A plataforma já possui os "músculos" (IA, Gamificação, Risco). O trabalho agora é de "fisioterapia": garantir que todos os nervos (dados) estejam conectados corretamente aos órgãos (UI).
