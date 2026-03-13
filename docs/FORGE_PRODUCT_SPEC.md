# Especificação de Produto: FORGE Smart School

## 1. Visão Geral
A FORGE Smart School não é apenas um LMS (Learning Management System), mas um sistema operacional para escolas inteligentes. O produto é dividido em três camadas que abordam a eficiência operacional, a eficácia pedagógica e a inteligência do ambiente físico.

---

## 2. Camada 1: FORGE Smart Ops (Cérebro Operacional)
*Status Atual: 80% Implementado*

### Módulos Existentes
- **Logística de Dispositivos:** Gestão formal de inventário, status de bateria, reserva por evento e telemetria (via `TabletPoolService`).
- **Centro de Comando:** Monitoramento em tempo real de atividades simultâneas, detecção de violações e saúde da rede (via `CommandCenter`).
- **Gestão de Rede (Mesh):** Capacidade de operação offline em rede local segura (via `MeshNetworkService`).
- **Gestão de Tenant/Hierarquia:** Estrutura multi-escola para Secretarias de Educação (via `ManagementView`).

### O que falta (Gap)
- **Motor de Alocação de Salas:** Expandir o agendador de provas para suportar agendamento de recursos físicos (salas, laboratórios).
- **Dashboard de Zeladoria:** Interface para gestão de manutenção física baseada no uso dos ambientes.

---

## 3. Camada 2: FORGE Smart Learning (Cérebro Pedagógico)
*Status Atual: 60% Implementado*

### Módulos Existentes
- **Banco de Itens IA:** Auditoria e geração de questões com IA multimodal (via `GeminiService`).
- **Roteiros de Estudo Adaptativos:** Trilhas personalizadas geradas por IA para alunos com gaps de aprendizagem (via `StudyPlansView`).
- **NeuroScreening:** Triagem avançada de indicadores cognitivos e comportamentais (via `NeuroScreeningView`).
- **Analytics de Desempenho:** Detecção preditiva de risco de evasão e baixo rendimento (via `PredictiveService`).

### O que falta (Gap)
- **Plano de Aula Estruturado:** Evoluir o campo de texto atual para um seletor de competências BNCC vinculado ao banco de questões.
- **Dossiê de Evidências:** Camada que consolida o "rastro" pedagógico (chat, diário, provas) em um relatório contínuo.

---

## 4. Camada 3: FORGE Smart Environment (Escola Conectada)
*Status Atual: 20% Implementado*

### Módulos Existentes
- **Gateway Mesh:** A fundação técnica para conectar sensores físicos sem WiFi externo está pronta.

### O que falta (Gap)
- **Modelo de Dados de Ambiente:** Tabelas no DB para `rooms`, `sensors`, `events_logs`.
- **Drivers de Integração:** Camada de software para leitura de sensores (CO2, Temperatura, Consumo Elétrico).
- **Cenários Ambientais:** Automação de status da sala (Ex: Modo Prova ativa silêncio acústico/bloqueio de sinais).

---

## 5. Auditoria de Mapeamento por Módulo

| Módulo | Funcionalidade | Estado |
| :--- | :--- | :--- |
| **Logistics** | Distribuição e Custódia | **JÁ EXISTE** |
| **Coordinator** | Command Center / SLO | **JÁ EXISTE** |
| **Academic** | Study Plans (IA) | **JÁ EXISTE** |
| **Neuro** | Triagem Cognitiva | **JÁ EXISTE** |
| **Diary** | Registro qualitativo | **PARCIAL** |
| **Calendar** | Alocação de Ativos | **PARCIAL** |
---

## 6. Ecossistema Mobile (Apps Nativos Android)
Além do núcleo pedagógico (Professor/Aluno/Coordenador), a plataforma deve expandir para apps nativos especializados para explorar ao máximo a rede Mesh e sensores:

### 6.1 FORGE Logistics (Suporte e Custódia)
- **Perfil:** Operadores de campo (`CUSTODY_OPS`).
- **Função:** Inventário rápido via QR Code, monitoramento de bateria em massa via Bluetooth Mesh e diagnóstico de nós de rede em áreas de sombra.

### 6.2 FORGE Family (Portfólio e Alertas)
- **Perfil:** Pais e Responsáveis (`PAIS`).
- **Função:** Notificações push em tempo real (frequência/ocorrências) e visualização offline do desempenho do aluno em áreas sem conectividade 4G/5G constante.

### 6.3 FORGE Specialist (NeuroScreening Pró)
- **Perfil:** Psicopedagogos e Médicos.
- **Função:** Triagens cognitivas de alta precisão usando drivers nativos para latência de toque mínima e sensores de movimento (giroscópio/acelerômetro) para detectar tremores e padrões motores.

### 6.4 FORGE Smart Building (Manutenção e IoT)
- **Perfil:** Zeladoria e Gestão de Facilidades.
- **Função:** Controle direto de dispositivos da Camada 3 (Ar condicionado, luzes, sensores de CO2) via Mesh, com alertas de background para eventos críticos de infraestrutura.
