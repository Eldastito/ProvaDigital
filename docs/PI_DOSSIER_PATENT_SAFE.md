# PI Dossier: FORGE (Patent-Safe)

Este documento contém o lastro técnico para fundamentar pedidos de **Patente de Invenção (PI)** da plataforma FORGE, descrevendo núcleos inventivos, mecanismos técnicos e efeitos pretendidos de forma não confidencial.

- **Estado**: Fase 3 (Documentação Formal para Depósito)
- **Baseline de Referência**: Commit `e094eaf` (tag `v1.0-patent-baseline`)
- **Titularidade jurídica**: em consolidação formal, fora do escopo do presente fechamento técnico.
- **Data da Revisão**: 12/04/2026

---

## 1. Núcleos Inventivos Principais

### 1.1 Execução Offline-Local Orquestrada (Mesh P2P)
**Problema Técnico**: Dependência de infraestrutura central (nuvem/WAN) em aplicações de avaliação digital de larga escala em áreas geográficas remotas ou instáveis.  
**Mecanismo**: Orquestração de malha local (mesh) P2P via WebRTC com nó local de orquestração operando como gateway de sala, incluindo descoberta de peers, broadcast confiável com dedup e heartbeat periódico.  
**Efeito Técnico**: Resiliência operacional com redução material da dependência de conectividade externa durante a aplicação da avaliação.

**Implementação**: `meshNetworkService.ts` (16.7KB), `localServerService.ts` (12.5KB), `webrtcClient.ts` (13KB), `bluetoothMeshService.ts`, `wifiHotspotService.ts`, `pilotMeshService.ts`, `telemetryService.ts` (9.3KB)

### 1.2 Retomada Segura de Sessão (Cold Boot Determinístico)
**Problema Técnico**: Perda de integridade da sessão de usuário em dispositivos de borda após interrupções de hardware ou falhas no software cliente.  
**Mecanismo**: Recuperação de estado via identificador determinístico de contexto (Context Pointer canônico: `context:{eventId}:{studentId}:{examId}:active`) com lookup O(1) no IndexedDB, controle de idempotência via `requestId`, e transição de estado auditável (ACTIVE → SUPERSEDED/COMPLETED/ABORTED) com cadeia de custódia.  
**Efeito Técnico**: Retomada determinística de sessão por meio de lookup direto por ponteiro canônico de contexto, sem perda de dados e sem intervenção humana.

**Implementação**: `sessionIsolationService.ts` (19.3KB), `persistenceGateway.ts` (9.1KB), `offlineDb.ts` (7.3KB)

### 1.3 Isolamento Criptográfico em Envelope Híbrido
**Problema Técnico**: Exposição de dados de resposta sensíveis ao trafegar por nós intermediários em redes locais ou mesh.  
**Mecanismo**: Estruturação de envelope com separação entre metadados operacionais (header aberto) e payload de conteúdo (cifrado na origem com AES-256-GCM), derivação de chave por aluno/evento (PBKDF2, 100K iterações, SHA-256), assinatura HMAC-SHA256 para integridade de QR Codes, e token mesh com anti-replay (JTI).  
**Efeito Técnico**: Não exposição do conteúdo útil da prova do estudante ao componente de retransmissão ou armazenamento intermediário.

**Implementação**: `e2eEncryptionService.ts` (10.3KB), `cryptoService.ts` (8.1KB)

### 1.4 Governança Multi-Escopo com Authority Pilot
**Problema Técnico**: Risco de regressão e indisponibilidade na migração de motor de autorização em sistema multi-tenant educacional em produção, com hierarquia complexa (MEC → Secretarias → Escolas).  
**Mecanismo**: Motor de autorização dual com modo shadow (legado + core em paralelo registrando divergências), pilot de autoridade (core assume decisão para recursos/escopos whitelisted), kill switch automático por contagem de fallbacks, escrita controlada via feature flags granulares, isolamento cross-tenant fail-closed, e auditoria de divergência com severidade calculada (CRITICAL/HIGH/MEDIUM/LOW).  
**Efeito Técnico**: Migração segura de motor de autorização em produção, com rollback automático e sem downtime, preservando isolamento de dados entre organizações.

**Implementação**: `governanceService.ts` (29KB)

---

## 2. Matriz de Rastreabilidade (Invenção ↔ Código ↔ Evidência)

| Núcleo | Mecanismo | Efeito Técnico (Status) | Base de Implementação | Prova de Evidência | Classe |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesh Offline** | Orquestração local P2P | Operação resiliente sem WAN. **[COMPROVADO]** | `meshNetworkService.ts`, `localServerService.ts`, `webrtcClient.ts` | `EV-MESH-LOCAL-001` | Patent-Safe |
| **Cold Boot** | Context Pointer Canônico O(1) | Retomada determinística. **[COMPROVADO]** | `sessionIsolationService.ts`, `persistenceGateway.ts`, `offlineDb.ts` | `EV-DET-CB-001` | Patent-Safe |
| **Secured Envelope** | Envelope Híbrido AES-GCM + HMAC | Isolamento criptográfico. **[COMPROVADO]** | `e2eEncryptionService.ts`, `cryptoService.ts` | `EV-SEC-ENV-001` | Patent-Safe |
| **Authority Pilot** | Shadow Mode + Kill Switch | Migração segura em produção. **[COMPROVADO]** | `governanceService.ts` | `EV-GOV-AP-001` | Patent-Safe |

---

## 3. Evidências Formais de Benchmark

| ID | Descrição | Script | Status |
| :--- | :--- | :--- | :--- |
| `EV-DET-CB-001` | Benchmark Cold Boot: latência p95 de retomada | `benchmarks/benchmark-cold-boot.ts` | ✅ Script criado |
| `EV-SEC-ENV-001` | Benchmark E2E Encryption: throughput AES/HMAC/RSA | `benchmarks/benchmark-encryption.ts` | ✅ Script criado |
| `HASH-BASELINE` | Hash SHA-256 de 37 arquivos (785.6 KB) | `benchmarks/generate-hashes.cjs` | ✅ Gerado |

---

## 4. Classificação de Segurança

| Classificação | Descrição | Referência |
| :--- | :--- | :--- |
| **PATENT_SAFE** | Pode ser incluído no depósito de patente | `constants/securityClassification.ts` |
| **TRADE_SECRET** | NUNCA incluir em documentos externos | `docs/TRADE_SECRET_CLASSIFIED.md` |

---

## 5. Limites de Divulgação e Sigilo
Este dossiê **NÃO CONTÉM** os segredos industriais da FORGE. Os itens a seguir foram omitidos ou descritos de forma genérica para proteção operacional:
- Thresholds exatos de latência para mitigação (Segredo Industrial).
- Chaves raiz de provisionamento e algoritmos de derivação proprietários (Segredo Industrial).
- Heurísticas específicas de detecção de fraude e pesos do `proctoring` (Segredo Industrial).
- Número real de iterações PBKDF2 em produção (Segredo Industrial).

---
**Baseline Técnica**: Commit `e094eaf` (Pós-Fase 3 / Patent Readiness)  
**Data da Revisão**: 12/04/2026  
**Responsável**: Engenharia FORGE | Arquitetura de Segurança
