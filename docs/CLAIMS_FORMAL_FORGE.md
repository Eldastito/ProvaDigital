# Reivindicações Formais — Plataforma FORGE

> **NOTA**: Estas reivindicações seguem as diretrizes do `CLAIMS_HYGIENE_CHECKLIST.md`.
> Termos proibidos foram substituídos por termos técnicos mensuráveis.
> As reivindicações descrevem efeitos técnicos, não resultados absolutos.

---

## Reivindicação 1 (Independente — Método Mesh Offline)

Método implementado por computador para **execução de avaliações digitais em ambiente sem conectividade externa**, caracterizado por compreender as etapas de:

a) estabelecer uma rede mesh peer-to-peer entre uma pluralidade de dispositivos de borda, em que cada dispositivo opera como nó da rede e é identificado por um papel funcional selecionado dentre estudante, professor e coordenador;

b) transmitir mensagens entre os nós da rede por meio de broadcast com identificador único de mensagem, em que cada nó mantém um cache de identificadores para evitar processamento duplicado;

c) monitorar a atividade dos nós por meio de sinal de heartbeat emitido periodicamente, em que nós sem heartbeat por período configurável são classificados como inativos;

d) encapsular cada mensagem em um envelope híbrido compreendendo um header com metadados operacionais em formato aberto e um payload com dados de conteúdo cifrado na origem;

em que o efeito técnico resultante é a **redução material da dependência de conectividade externa** durante a aplicação da avaliação digital.

---

## Reivindicação 2 (Dependente de 1 — Múltiplos Transportes)

Método conforme reivindicação 1, em que a rede mesh é **adicionalmente operável** por pelo menos um transporte alternativo selecionado dentre WebRTC, Bluetooth Low Energy e WiFi Direct, com fallback automático entre transportes em caso de indisponibilidade.

---

## Reivindicação 3 (Independente — Sistema Cold Boot)

Sistema de **retomada determinística de sessão de avaliação digital** em dispositivo de borda, caracterizado por compreender:

a) um módulo de persistência local configurado para armazenar dados de sessão em banco de dados indexado no dispositivo;

b) um ponteiro de contexto canônico no formato `context:{eventId}:{studentId}:{examId}:active` que referencia a tentativa ativa mais recente do estudante;

c) um mecanismo de lookup direto por chave primária que recupera a sessão ativa em complexidade O(1), sem necessidade de scan sequencial do banco de dados;

d) um controle de idempotência baseado em identificador de requisição único que previne a criação duplicada de sessões;

e) uma máquina de estados formal com transições válidas compreendendo ACTIVE para SUPERSEDED, ACTIVE para COMPLETED e ACTIVE para ABORTED, em que cada transição é registrada com timestamp e referência à sessão substituta;

em que o efeito técnico resultante é a **recuperação determinística do estado da avaliação** após interrupção de hardware ou software, sem perda de dados e sem intervenção humana.

---

## Reivindicação 4 (Dependente de 3 — Cadeia de Custódia)

Sistema conforme reivindicação 3, em que cada sessão que transiciona para o estado SUPERSEDED mantém uma **referência à sessão que a substituiu**, formando uma cadeia de custódia auditável que permite reconstrução histórica do ciclo de vida das tentativas.

---

## Reivindicação 5 (Dependente de 3 — Controle de Versão)

Sistema conforme reivindicação 3, em que cada operação de modificação sobre a sessão **incrementa um contador de versão atômico**, permitindo detecção de conflitos de concorrência e garantindo atomicidade lógica das operações de persistência.

---

## Reivindicação 6 (Independente — Método de Isolamento Criptográfico)

Método de **isolamento criptográfico de dados de avaliação** em trânsito por rede mesh, caracterizado por compreender as etapas de:

a) derivar uma chave criptográfica simétrica única para cada par (estudante, evento de avaliação) por meio de algoritmo de derivação de chave baseado em senha com função hash, a partir de um sal composto pelos identificadores do evento e do estudante;

b) cifrar os dados de resposta do estudante usando cifra simétrica autenticada com vetor de inicialização aleatório, produzindo um pacote criptografado transportável;

c) assinar payloads transmitidos por meio de código de autenticação de mensagem baseado em hash, permitindo detecção de adulteração;

d) gerar token de autenticação para cada dispositivo na rede mesh, incluindo identificador único de token para anti-replay, papel de controle de acesso e timestamp;

em que o efeito técnico resultante é a **não exposição do conteúdo das respostas** a nós intermediários na rede mesh.

---

## Reivindicação 7 (Dependente de 6 — Separação de Envelope)

Método conforme reivindicação 6, em que os dados cifrados são encapsulados em um **envelope híbrido** compreendendo um header público com tipo de mensagem, identificadores de remetente e destinatário, timestamp e identificador de mensagem, e um payload cifrado contendo os dados sensíveis, de modo que o roteamento da mensagem na rede mesh seja realizado exclusivamente com base no header público.

---

## Reivindicação 8 (Independente — Método de Migração de Autorização)

Método de **migração gradual de motor de autorização** em sistema multi-tenant em produção, caracterizado por compreender as etapas de:

a) operar um motor de autorização legado e um motor core em paralelo, em que ambos avaliam cada requisição de autorização e divergências entre decisões são registradas com severidade calculada;

b) para um subconjunto de recursos e escopos previamente definidos, transferir a autoridade de decisão do motor legado para o motor core, mantendo o motor legado como fallback;

c) monitorar a taxa de falhas do motor core por sessão e, ao atingir um limite configurável, desabilitar automaticamente a transferência de autoridade, retornando toda a decisão ao motor legado;

d) para operações de mutação de dados, aplicar bloqueio fail-closed para operações que ultrapassem os limites do tenant ativo, impedindo mutações cross-tenant;

em que o efeito técnico resultante é a **migração segura de motor de autorização sem downtime** e com rollback automático.

---

## Reivindicação 9 (Dependente de 8 — Escrita Controlada)

Método conforme reivindicação 8, em que a transferência de autoridade para operações de mutação é controlada por **feature flags granulares** independentes para cada tipo de operação, compreendendo pelo menos criação, atualização, transição de status e exportação.

---

## Reivindicação 10 (Dependente de 8 — Auditoria de Divergência)

Método conforme reivindicação 8, em que as divergências entre o motor legado e o motor core são classificadas em níveis de severidade compreendendo pelo menos: **crítico** para permissão de acesso cross-tenant pelo legado quando bloqueado pelo core; **alto** para bloqueio de fluxo essencial pelo core; **médio** para diferenças em recursos secundários; em que divergências de cada tipo são registradas de forma deduplicada para evitar explosão de logs.

---

## Quadro de Referência Cruzada

| Reivindicação | Tipo | Núcleo Inventivo | Módulo de Referência |
| :--- | :--- | :--- | :--- |
| 1 | Independente | Mesh Offline | `meshNetworkService.ts` |
| 2 | Dependente (1) | Mesh Offline | `bluetoothMeshService.ts`, `wifiHotspotService.ts` |
| 3 | Independente | Cold Boot | `sessionIsolationService.ts` |
| 4 | Dependente (3) | Cold Boot | `sessionIsolationService.ts` |
| 5 | Dependente (3) | Cold Boot | `sessionIsolationService.ts` |
| 6 | Independente | Envelope Híbrido | `e2eEncryptionService.ts` |
| 7 | Dependente (6) | Envelope Híbrido | `meshNetworkService.ts` |
| 8 | Independente | Authority Pilot | `governanceService.ts` |
| 9 | Dependente (8) | Authority Pilot | `governanceService.ts` |
| 10 | Dependente (8) | Authority Pilot | `governanceService.ts` |

---

**Total**: 4 reivindicações independentes + 6 reivindicações dependentes = **10 reivindicações**

> **CONFORMIDADE**: Todas as reivindicações foram redigidas em conformidade com o `CLAIMS_HYGIENE_CHECKLIST.md`:
> - ✅ Nenhum termo absoluto ("100% seguro", "infalível", "tempo real absoluto")
> - ✅ Todos os efeitos são "técnicos" e mensuráveis
> - ✅ Termos como "redução material", "não exposição", "recuperação determinística"
> - ✅ Cada reivindicação cita mecanismo técnico específico
