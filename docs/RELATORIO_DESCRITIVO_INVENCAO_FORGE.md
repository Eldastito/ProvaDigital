# Relatório Descritivo da Invenção — Plataforma FORGE

## Campo da Invenção

A presente invenção refere-se a um **sistema e método para execução de avaliações digitais em ambientes com conectividade limitada ou inexistente**, compreendendo mecanismos de comunicação em rede mesh peer-to-peer, retomada determinística de sessão após falhas de hardware, isolamento criptográfico de dados sensíveis em trânsito, e migração gradual de motor de autorização em sistema multi-tenant.

A invenção pertence ao campo técnico de **sistemas distribuídos educacionais**, com aplicação primária em avaliações formais (provas, exames, triagens) realizadas em dispositivos de borda (tablets) em localidades com infraestrutura de rede precária.

---

## Estado da Técnica

### Sistemas Existentes e Suas Limitações

**1. Plataformas de avaliação baseadas em nuvem** (Google Forms, Microsoft Forms, Moodle):
- Requerem conectividade internet contínua durante toda a aplicação
- Perda total do progresso em caso de queda de conexão
- Incapazes de operar em escolas rurais ou comunidades remotas sem infraestrutura de rede

**2. Sistemas de avaliação em larga escala nacionais** (SAEB/Prova Brasil):
- Dependem de infraestrutura logística complexa para distribuição de provas impressas
- Custos operacionais elevados com transporte, impressão e coleta
- Tempo de processamento de resultados medido em meses

**3. Aplicações de avaliação offline existentes**:
- Operam em modo offline individual, sem comunicação entre dispositivos
- Não possuem mecanismo de retomada determinística após falha de hardware
- Dados trafegam em texto claro em redes locais, expondo respostas

**4. Sistemas de autorização multi-tenant**:
- Migrações de motor de autorização requerem downtime planejado
- Não possuem mecanismo de rollback automático em caso de falha
- Isolamento cross-tenant depende exclusivamente de validação na camada de aplicação

### Problemas Técnicos Não Resolvidos

| # | Problema Técnico | Consequência |
| :--- | :--- | :--- |
| P1 | Dependência de conectividade WAN para avaliação digital | Exclusão de 32% das escolas brasileiras com internet precária |
| P2 | Perda de sessão após interrupção de hardware | Necessidade de reiniciar prova, causando estresse e perda de tempo |
| P3 | Exposição de dados de resposta em rede local | Risco de interceptação e violação da integridade da avaliação |
| P4 | Indisponibilidade durante migração de autorização | Downtime planejado em sistema educacional com janelas operacionais rígidas |

---

## Descrição Detalhada da Invenção

### Visão Geral da Arquitetura

A plataforma FORGE implementa uma arquitetura de execução distribuída em que **dispositivos de borda (tablets)** se comunicam diretamente entre si via rede mesh P2P, sem necessidade de servidor central ou conectividade internet. O sistema opera em quatro camadas inventivas complementares:

### Mecanismo 1: Rede Mesh P2P Offline (Resolve P1)

O sistema implementa uma **rede mesh peer-to-peer** usando protocolo WebRTC, onde:

1. **Descoberta de Peers**: Cada dispositivo anuncia sua presença na rede local via signaling, identificando-se com um papel (STUDENT, PROFESSOR, COORDINATOR)
2. **Broadcast Confiável**: Mensagens são propagadas pela rede com identificador único (`messageId`) mantido em cache para evitar loops e duplicação
3. **Heartbeat Periódico**: A cada 5 segundos, cada nó emite um sinal de vida (`HEARTBEAT`), permitindo detecção de nós inativos (timeout de 30 segundos)
4. **Envelope Híbrido**: Cada mensagem é encapsulada em uma estrutura com header público (tipo, remetente, destinatário) e payload cifrado, permitindo roteamento sem exposição de conteúdo
5. **Múltiplos Transportes**: O sistema suporta WebRTC, Bluetooth Low Energy e WiFi Direct como transportes alternativos, com fallback automático

**Referência de Implementação**: `meshNetworkService.ts`, `webrtcClient.ts`, `bluetoothMeshService.ts`, `wifiHotspotService.ts`

### Mecanismo 2: Cold Boot Determinístico (Resolve P2)

O sistema implementa **retomada determinística de sessão** usando um ponteiro de contexto canônico:

1. **Context Pointer**: Para cada sessão de avaliação, é criado um ponteiro no formato `context:{eventId}:{studentId}:{examId}:active` que aponta para a tentativa ACTIVE mais recente
2. **Lookup O(1)**: A retomada da sessão não requer scan sequencial do banco de dados — o ponteiro é lido diretamente por chave primária
3. **Idempotência**: Operações de criação de sessão incluem um `requestId` que previne duplicação acidental
4. **Transição de Estado**: Sessões seguem uma máquina de estados formal com transições válidas:
   - `ACTIVE → SUPERSEDED` (quando nova tentativa é criada)
   - `ACTIVE → COMPLETED` (quando o estudante finaliza)
   - `ACTIVE → ABORTED` (quando a sessão é cancelada)
5. **Cadeia de Custódia**: Cada sessão SUPERSEDED mantém referência à sessão que a substituiu (`supersededByAttemptId`), formando uma cadeia auditável
6. **Controle de Versão**: Cada operação incrementa um contador atômico (`version`) para detectar conflitos de concorrência

**Referência de Implementação**: `sessionIsolationService.ts`, `persistenceGateway.ts`, `offlineDb.ts`

### Mecanismo 3: Envelope Híbrido Criptográfico (Resolve P3)

O sistema implementa **isolamento criptográfico** usando um envelope com duas camadas:

1. **Derivação de Chave por Aluno/Evento**: Para cada par (estudante, evento), uma chave AES-256 única é derivada via PBKDF2 (SHA-256), tornando impossível que um estudante descriptografe as respostas de outro
2. **Cifra de Payload**: As respostas são cifradas com AES-256-GCM e um Initialization Vector (IV) aleatório de 12 bytes, garantindo unicidade criptográfica
3. **Assinatura de Integridade**: Payloads transmitidos via QR Code ou mesh são assinados com HMAC-SHA256, permitindo detecção de adulteração
4. **Token de Autenticação Mesh**: Cada dispositivo na rede mesh recebe um token com JTI (JWT ID) único para anti-replay, papel RBAC (STUDENT/PROFESSOR/COORDINATOR) e timestamp

**Referência de Implementação**: `e2eEncryptionService.ts`, `cryptoService.ts`

### Mecanismo 4: Authority Pilot — Migração Gradual de Autorização (Resolve P4)

O sistema implementa **migração gradual de motor de autorização** usando três fases:

1. **Shadow Mode**: O motor novo (core) opera em paralelo com o legado, ambos avaliando cada requisição de autorização. Divergências são registradas com severidade calculada (CRITICAL para vazamento cross-tenant, HIGH para bloqueio de fluxo essencial)
2. **Authority Pilot**: Para recursos e escopos whitelisted, o motor core assume a decisão real. Feature flags granulares controlam cada tipo de mutação separadamente (CREATE, UPDATE, UPSERT, STATUS_TRANSITION, EXPORT)
3. **Kill Switch Automático**: Se o motor core falha N vezes na mesma sessão (fallback para legado), o pilot é automaticamente desabilitado, garantindo disponibilidade contínua

Mecanismos adicionais:
- **Isolamento Cross-Tenant**: Mutações entre organizações diferentes são bloqueadas no modo fail-closed
- **Memoização de Decisão**: Cache de decisões por chave composta para performance em hot paths
- **Deduplicação de Auditoria**: Divergências idênticas são registradas apenas uma vez para evitar explosão de logs

**Referência de Implementação**: `governanceService.ts`

---

## Desenhos Técnicos

Vide documento complementar `DIAGRAMAS_PATENTE_FORGE.md` contendo:
- **Figura 1**: Topologia Mesh — Fluxo de dados entre dispositivos na rede local
- **Figura 2**: Cold Boot — Diagrama de estados do ciclo de vida da sessão
- **Figura 3**: Envelope Híbrido — Separação Header/Payload com fluxo de cifra
- **Figura 4**: Authority Pilot — Fluxo de decisão Shadow Mode → Pilot → Rollback

---

## Reivindicações

Vide documento complementar `CLAIMS_FORMAL_FORGE.md` contendo as reivindicações independentes e dependentes.

---

## Resumo

Sistema e método para execução de avaliações digitais em ambientes com conectividade limitada, compreendendo: (a) rede mesh peer-to-peer entre dispositivos de borda com envelope híbrido criptográfico para isolamento de dados sensíveis; (b) mecanismo de retomada determinística de sessão via ponteiro de contexto canônico com lookup O(1); (c) isolamento criptográfico de respostas usando derivação de chave por par aluno/evento; e (d) migração gradual e segura de motor de autorização em sistema multi-tenant com kill switch automático. A invenção permite a aplicação de avaliações digitais em escala em regiões sem infraestrutura de rede, com garantias de integridade, segurança e continuidade operacional.
