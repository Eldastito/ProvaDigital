# Backlog de Ideias Perdidas e Funcionalidades Pendentes - Plataforma FORGE

Este documento consolida ideias, sugestões e requisitos identificados no codebase e em discussões de design que ainda não foram totalmente implementados ou que foram "perdidos" ao longo do desenvolvimento.

## 1. Ideias Sugeridas (O que falta implementar)

### 📊 Análise e Dashboards
- **Mapa de Calor (Heatmap) [CRÍTICO]:** Mencionado explicitamente como uma sugestão pendente. Deveria visualizar a incidência de erros/acertos por questão vs. aluno em uma grade colorida (matriz de desempenho) para rápida identificação de gargalos na turma.
- **Gráfico de Evolução Preditiva:** Embora o `RiskDetectionEngine.ts` exista, a visualização de "Tendência Real vs. Predição" no dashboard de professores ainda é simplificada.
- **Benchmark Comparativo Automático:** Funções para comparar automaticamente o desempenho da turma atual com a média histórica da mesma série em anos anteriores.

### 🧠 Laboratório de Projeção (Projection Lab)
- **Editor de Mapas Mentais:** Atualmente o `ProjectionLabView.tsx` apenas exibe imagens de mapas mentais. A ideia original incluía uma ferramenta interativa para a criação desses mapas em sala de aula.
- **Integração com Realidade Aumentada (AR):** Suporte para visualização dos modelos 3D via WebXR/AR diretamente nos tablets dos alunos (mencionado em discussões de "Smart Environment").

### 🏗️ Gestão e Infraestrutura (FORGE Smart Ops)
- **Motor de Alocação de Espaços:** Falta a entidade "Ambiente/Sala" para gerenciar onde as provas e eventos ocorrem, vinculando recursos fixos (ar condicionado, projetor).
- **Calendário Escolar Institucional:** O sistema hoje agenda apenas provas. Falta o calendário vivo para eventos da escola (reuniões, feriados, projetos).
- **Mapa de Ambientes (Gestão de Fluxo):** Visualização espacial da planta da escola com status em tempo real de ocupação e saúde operacional.

### 🌿 Ecossistema Mobile (Apps Nativos Android)
- **App Specialist (Neuro):** Interface nativa para triagens rápidas e acompanhamento de PDIs em modo offline.
- **App Logistics:** Controle de movimentação das malas de tablets via NFC/QR Code com auditoria em tempo real.
- **App Family:** Portal offline para pais acompanharem o desempenho e frequência sem necessidade de dados móveis constantes.

### 🔌 Smart Environment (IoT)
- **Drivers de Sensores:** Integração com sensores físicos (CO2, Temperatura, Luminosidade) via Mesh.
- **Automação de Cenários:** "Modo Prova" físico que ajusta luzes e trava notificações em dispositivos próximos.

## 2. Débitos Técnicos e "TODOs" Identificados
- **Mecanismos de Re-scoping de Questões por IA:** Implementar a lógica onde a IA sugere alterações em questões baseadas no feedback de "muito difícil" dos alunos.
- **Consolidação de Evidence Layer:** Criar o dossiê automático que unifica histórico acadêmico, resultados de triagens neuropsicológicas e observações do diário de classe.

---
**Documento gerado em:** 14/03/2026
**Responsável:** Antigravity AI
