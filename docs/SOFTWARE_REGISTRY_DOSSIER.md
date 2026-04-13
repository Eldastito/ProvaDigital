# Software Registry Dossier: FORGE (Code & Authorship)

Este documento identifica a estrutura funcional e os módulos prioritários da plataforma FORGE para efeito de **Registro de Programa de Computador** no INPI, documentando autoria, titularidade e baseline de versão.

---

## 1. Identificação do Sistema
- **Nome Comercial**: FORGE
- **Nome Técnico**: ExamePad SaaS — Prova Digital
- **Escopo**: Sistema de avaliação digital resiliente com persistência local, comunicação em malha P2P, criptografia de ponta a ponta e governança multi-escopo.
- **Titular Jurídico**: em consolidação formal (ExamePad Tecnologia Ltda)
- **Autoria Técnica**: Equipe técnica responsável pelo desenvolvimento desta baseline: Engenharia de Pilotagem | Porto Alegre
- **Baseline de Referência**: Commit `e094eaf`
- **Data da Baseline**: 12/04/2026
- **Hash de Integridade**: `REPORTS/HASH_INTEGRIDADE_BASELINE.json` (SHA-256, 37 arquivos)

---

## 2. Inventário Completo de Módulos

### 2.1 Núcleos Inventivos (Patente de Invenção)

| # | Módulo | Arquivo-Fonte | Tamanho | Função de Software |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Sessão & Isolamento** | `sessionIsolationService.ts` | 19.3KB | Gerenciamento de sessão com Context Pointer canônico e Cold Boot determinístico |
| 2 | **Segurança E2E** | `e2eEncryptionService.ts` | 10.3KB | Criptografia AES-256-GCM, PBKDF2, HMAC-SHA256 para envelope híbrido |
| 3 | **Criptografia PKI** | `cryptoService.ts` | 8.1KB | Primitivas RSA-OAEP 2048-bit para transporte seguro de chaves |
| 4 | **Orquestração Mesh** | `meshNetworkService.ts` | 16.7KB | Protocolo mesh P2P com descoberta, broadcast e heartbeat |
| 5 | **Servidor Local** | `localServerService.ts` | 12.5KB | Backend HTTP de borda para gateway de sala offline |
| 6 | **Cliente WebRTC** | `webrtcClient.ts` | 13KB | Comunicação P2P via WebRTC com signaling e data channels |
| 7 | **Bluetooth Mesh** | `bluetoothMeshService.ts` | 3.1KB | Extensão mesh via BLE para proximidade |
| 8 | **WiFi Hotspot** | `wifiHotspotService.ts` | 10.7KB | Extensão mesh via WiFi Direct/Hotspot |
| 9 | **Persistência** | `persistenceGateway.ts` | 9.1KB | Gateway desacoplado de I/O para IndexedDB |
| 10 | **Banco Offline** | `offlineDb.ts` | 7.3KB | Schema IndexedDB com migração versionada (v1→v4) |
| 11 | **Telemetria** | `telemetryService.ts` | 9.3KB | Envio de dados do estudante ao professor via mesh |
| 12 | **Pilot Mesh** | `pilotMeshService.ts` | 2.9KB | Piloto de serviço mesh para testes controlados |
| 13 | **Governança** | `governanceService.ts` | 29KB | Motor de autorização multi-escopo com Authority Pilot |
| 14 | **Classificação** | `securityClassification.ts` | 5.3KB | Segregação PATENT_SAFE vs TRADE_SECRET |
| 15 | **Tipos Canônicos** | `types.ts` | 44.4KB | Sistema de tipos TypeScript com 1764 linhas |

### 2.2 Módulos Pedagógicos e Funcionais

| # | Módulo | Arquivo-Fonte | Tamanho | Função de Software |
| :--- | :--- | :--- | :--- | :--- |
| 16 | **Dashboard Analytics** | `AnalyticsDashboard.tsx` | 9.4KB | Painel de dados analíticos agregados |
| 17 | **Analytics Preditivo** | `PredictiveRiskDashboard.tsx` | 12.1KB | Motor de detecção de risco de evasão com IA |
| 18 | **Dashboard Pedagógico** | `PedagogicalDashboard.tsx` | 27.2KB | Rastreamento pedagógico com competências BNCC |
| 19 | **Dashboard Rede** | `NetworkDashboardView.tsx` | 31KB | Visualização de rede de escolas com GeoMap |
| 20 | **GeoMap** | `GeoMap.tsx` | 44KB | Mapa georreferenciado com dados educacionais |
| 21 | **Construtor de Prova** | `ExamBuilderView.tsx` | 20.6KB | Montagem de provas com banco de itens |
| 22 | **Gerador IA** | `AIQuestionGeneratorView.tsx` | 34.7KB | Geração de questões via Gemini AI |
| 23 | **Central de Comando** | `CommandCenter.tsx` | 31.9KB | Monitor operacional de aplicação de provas |
| 24 | **Monitor Redundância** | `RedundancyMonitorView.tsx` | 12.9KB | Interface de monitoramento de camadas E1/E2/E3 |
| 25 | **Agendamento** | `ExamScheduler.tsx` | 49.2KB | Agendamento de provas com detecção de conflitos |
| 26 | **App Estudante** | `StudentApp.tsx` | 76.6KB | Aplicação completa de execução da avaliação |
| 27 | **App Professor** | `ProfessorApp.tsx` | 43KB | Aplicação de monitoramento e coleta |
| 28 | **App Coordenador** | `CoordinatorApp.tsx` | 37.5KB | Aplicação de coordenação operacional |
| 29 | **Portal Estudante** | `StudentDashboardView.tsx` | 7.2KB | Painel do aluno com progresso e gamificação |
| 30 | **Tutor IA (Corujão)** | `OwlTutorView.tsx` | 14.2KB | Tutoria adaptativa com IA conversacional |
| 31 | **Batalhas Estudante** | `StudentBattleView.tsx` | 31.4KB | Modo competitivo multiplayer educacional |
| 32 | **Modo Arcade** | `ArcadeView.tsx` | 13.6KB | Jogos educacionais integrados |
| 33 | **Modo Sobrevivência** | `SurvivalView.tsx` | 18.9KB | Desafio progressivo de conhecimento |
| 34 | **Eventos Gamificados** | `GamifiedEventsManager.tsx` | 21.5KB | Gestão de eventos gamificados |
| 35 | **NeuroScreening** | `NeuroScreeningView.tsx` | 14.8KB | Triagem cognitiva com instrumentos validados |
| 36 | **Comunicação/Chat** | `CommunicationView.tsx` | 12.6KB | Chat em tempo real entre perfis |
| 37 | **Gestão Escolar** | `ManagementView.tsx` | 38.8KB | Gestão multi-tenant de escolas e usuários |
| 38 | **Diário de Classe** | `ClassDiaryView.tsx` | 27.4KB | Registro de frequência e ocorrências |
| 39 | **Conselho de Classe** | `ClassCouncilView.tsx` | 16.9KB | Deliberação coletiva sobre desempenho |
| 40 | **Dashboard Professor** | `ProfessorDashboardView.tsx` | 49KB | Painel de resultados e desempenho de turmas |
| 41 | **Dashboard Diretor** | `SchoolPrincipalDashboard.tsx` | 45.9KB | Visão gerencial por escola |
| 42 | **Orientação Vocacional** | `VocationalCompassView.tsx` | 11.9KB | Bússola vocacional com perfil DISC |
| 43 | **Loja de Avatar** | `AvatarShopView.tsx` | 13.8KB | Marketplace de itens cosméticos |
| 44 | **Perfil de Usuário** | `UserProfileView.tsx` | 14.5KB | Inteligência comportamental (DISC, VARK) |
| 45 | **Logística Custódia** | `CustodyChecklist.tsx` | 15.2KB | Checklist de entrega/retirada de tablets |
| 46 | **Portal dos Pais** | `ParentsDashboardView.tsx` | 14.8KB | Acompanhamento parental |
| 47 | **Editor de Itens** | `ItemEditorView.tsx` | 15.4KB | Editor visual de questões com mídia |
| 48 | **Prova Impressa** | `PrintableExamView.tsx` | 11.5KB | Geração de versão impressa da prova |
| 49 | **Lab Multimodal** | `MultimodalLabView.tsx` | 11KB | Laboratório de projeção com 3D, vídeo, mapas |
| 50 | **Rankings** | `GlobalRankingView.tsx` | 9.7KB | Rankings globais e por competência |
| 51 | **Portal OCDE** | `OECDPortalView.tsx` | 11KB | Indicadores alinhados ao PISA/OCDE |

### 2.3 Módulos Adicionais Descobertos (Auditoria 13/04/2026)

| # | Módulo | Arquivo-Fonte | Tamanho | Função de Software |
| :--- | :--- | :--- | :--- | :--- |
| 52 | **Motor CAT Offline** | `offlineAdaptiveEngine.ts` | 10.3KB | Teste adaptativo TRI 3PL com serialização para IndexedDB |
| 53 | **Engine CAT** | `catEngine.ts` | 7KB | Motor de teste adaptativo computadorizado |
| 54 | **Motor de Risco** | `riskDetectionEngine.ts` | 9.6KB | Detecção preditiva de risco de evasão escolar |
| 55 | **Correção Automática** | `autoGradingService.ts` | 12.5KB | Auto-grading com rubrica e fallback manual |
| 56 | **Clustering IA** | `clusteringService.ts` | 5.6KB | Agrupamento de alunos por perfil cognitivo |
| 57 | **Codec QR Assinado** | `qrCodecService.ts` | 5.7KB | Serialização/assinatura de dados para QR Code |
| 58 | **Submissão Offline** | `OfflineSubmissionFlow.tsx` | 10.4KB | Fluxo de envio de resultados via QR |
| 59 | **Scanner Consolidação** | `SchoolConsolidationScanner.tsx` | 18.4KB | Scanner de consolidação por QR Code |
| 60 | **Roteiros de Estudo** | `StudyPlansView.tsx` | 16.1KB | Planos de estudo personalizados com IA |

---

## 3. Métricas do Código-Fonte

| Métrica | Valor |
| :--- | :--- |
| **Total de arquivos inventariados** | 60 |
| **Código-fonte total inventariado** | ~891 KB |
| **Linhas de código estimadas** | ~35.000+ |
| **Linguagem principal** | TypeScript (TSX/TS) |
| **Framework UI** | React 18 |
| **Persistência local** | IndexedDB (Dexie.js) |
| **Comunicação P2P** | WebRTC |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |

---

## 4. Evidências de Desenvolvimento (Baseline)
- **Marco de Versão**: Patent-Ready v1.1
- **Branch**: `main`
- **Hash Canônico (SHA-256)**: Disponível em `REPORTS/HASH_INTEGRIDADE_BASELINE.json`
- **Commit de Baseline**: `bb47e84`
- **Data da Baseline**: 13/04/2026
- **Algoritmo de Hash**: SHA-256 (Web Crypto API)

---

## 5. Política de Registro e Congelamento
Este dossiê orienta o registro das versões recorrentes do software. Recomenda-se o depósito imediato dos módulos listados nas Seções 2.1 e 2.2 como "**Versão 1.0**" da arquitetura FORGE, visando a proteção contra cópia literal do código-fonte.

**Procedimento de Registro**:
1. Congelar baseline com tag Git (`v1.0-patent-baseline`)
2. Gerar hashes SHA-256 de todos os módulos (`generate-hashes.cjs`)
3. Preparar documentação descritiva (Relatório Descritivo + Claims)
4. Depositar no e-INPI via formulário de Registro de Programa de Computador

---
**Observação**: O registro de software protege o código-fonte ("literariedade") e a autoria, sendo complementar e independente da Patente de Invenção (PI).
