# Diagramas Técnicos — Patente FORGE

Diagramas de referência para o pedido de Patente de Invenção (PI) da plataforma FORGE.

---

## Figura 1: Topologia Mesh — Fluxo de Dados na Rede Local

```mermaid
graph TD
    subgraph SALA_DE_AULA["Sala de Aula (Sem Internet)"]
        PROF["📱 Tablet Professor<br/>(Nó de Coleta)"]
        S1["📱 Tablet Aluno 1"]
        S2["📱 Tablet Aluno 2"]
        S3["📱 Tablet Aluno 3"]
        SN["📱 Tablet Aluno N"]
        
        S1 -->|"Respostas Cifradas<br/>(Envelope Híbrido)"| PROF
        S2 -->|"Respostas Cifradas"| PROF
        S3 -->|"Respostas Cifradas"| PROF
        SN -->|"Respostas Cifradas"| PROF
        
        PROF -->|"Heartbeat<br/>BROADCAST"| S1
        PROF -->|"Heartbeat"| S2
        PROF -->|"Heartbeat"| S3
        
        S1 <-->|"P2P WebRTC"| S2
        S2 <-->|"P2P WebRTC"| S3
    end
    
    subgraph GATEWAY["Gateway Local (Servidor de Borda)"]
        LS["🖥️ Servidor Local HTTP<br/>(localServerService)"]
    end
    
    PROF -->|"Batch de Sala<br/>(WiFi Local)"| LS
    
    subgraph NUVEM["Nuvem (Quando Disponível)"]
        CLOUD["☁️ Supabase<br/>(PostgreSQL)"]
    end
    
    LS -->|"Sincronização<br/>(Quando Online)"| CLOUD
    
    style SALA_DE_AULA fill:#1a1a2e,stroke:#e94560,color:#fff
    style GATEWAY fill:#16213e,stroke:#0f3460,color:#fff
    style NUVEM fill:#0f3460,stroke:#533483,color:#fff
```

**Legenda**: Dados trafegam cifrados (payload AES-256-GCM) pela rede mesh. O header da mensagem permanece aberto apenas para roteamento. O servidor local opera como buffer temporário até a sincronização com a nuvem.

---

## Figura 2: Cold Boot — Diagrama de Estados do Ciclo de Vida da Sessão

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: startSession()
    
    ACTIVE --> ACTIVE: saveAnswer() / updateTelemetry() / logSecurityEvent()
    ACTIVE --> COMPLETED: finishSession()
    ACTIVE --> SUPERSEDED: Nova tentativa criada\n(setActiveAttemptForContext)
    ACTIVE --> ABORTED: Sessão cancelada\n(abort / timeout)
    
    COMPLETED --> [*]
    SUPERSEDED --> [*]
    ABORTED --> [*]
    
    note right of ACTIVE
        Ponteiro de Contexto:
        context:{eventId}:{studentId}:{examId}:active
        → aponta para esta sessão
        
        Cada operação incrementa version++
        requestId garante idempotência
    end note
    
    note right of SUPERSEDED
        Mantém referência:
        supersededByAttemptId → nova sessão
        Cadeia de custódia auditável
    end note
    
    note right of COMPLETED
        finishedAt registrado
        totalDuration calculado
        Pronta para upload
    end note
```

**Legenda**: A sessão inicia no estado ACTIVE com um Context Pointer canônico. Transições são unidirecionais e auditáveis. Estados SUPERSEDED, COMPLETED e ABORTED são terminais.

---

## Figura 3: Envelope Híbrido — Fluxo de Cifra e Assinatura

```mermaid
flowchart LR
    subgraph ORIGEM["Dispositivo de Origem (Aluno)"]
        R["Respostas\n(plaintext)"]
        
        R --> DK["Derivação de Chave\n(PBKDF2 SHA-256)"]
        DK --> ENC["Cifra\n(AES-256-GCM + IV)"]
        ENC --> EP["Pacote Cifrado\n{iv, data}"]
        
        EP --> ENV["Montagem do\nEnvelope Híbrido"]
        
        META["Metadados\n(type, from, to)"] --> ENV
        
        ENV --> SIGN["Assinatura HMAC\n(SHA-256)"]
    end
    
    subgraph TRANSPORTE["Rede Mesh P2P"]
        MSG["MeshHybridEnvelope\n─────────────\n📋 Header (aberto)\n  type: ANSWER\n  from: student_1\n  to: BROADCAST\n  messageId: uuid\n─────────────\n🔒 Payload (cifrado)\n  iv: base64...\n  data: base64...\n─────────────\n✅ Signature\n  HMAC: base64..."]
    end
    
    SIGN --> MSG
    
    subgraph DESTINO["Dispositivo de Destino (Professor)"]
        VER["Verificação HMAC\n(Integridade)"]
        STORE["Armazena\n(NÃO descriptografa)"]
        
        MSG --> VER
        VER -->|"OK"| STORE
        VER -->|"FALHA"| REJ["❌ Rejeitado\n(Adulteração)"]
    end
    
    subgraph CONSOLIDACAO["Servidor (Consolidação)"]
        DK2["Derivação de Chave\n(mesmos parâmetros)"]
        DEC["Decifra\n(AES-256-GCM)"]
        RESULT["Resultado\nProcessado"]
        
        STORE -->|"Upload"| DK2
        DK2 --> DEC
        DEC --> RESULT
    end
    
    style ORIGEM fill:#1a1a2e,stroke:#e94560,color:#fff
    style TRANSPORTE fill:#16213e,stroke:#fca311,color:#fff
    style DESTINO fill:#0f3460,stroke:#0f3460,color:#fff
    style CONSOLIDACAO fill:#533483,stroke:#533483,color:#fff
```

**Legenda**: As respostas são cifradas na origem com chave derivada do par (aluno+evento). O professor armazena o pacote cifrado sem descriptografá-lo. Apenas o servidor de consolidação (com acesso aos mesmos parâmetros de derivação) pode descriptografar.

---

## Figura 4: Authority Pilot — Fluxo de Decisão

```mermaid
flowchart TD
    REQ["Requisição de Autorização\n(resource, action, context)"]
    
    REQ --> CACHE{"Cache de\nDecisão?"}
    
    CACHE -->|"Hit"| CACHED_CORE["Decisão Core\n(memoizada)"]
    CACHE -->|"Miss"| EVAL["Avaliar Core\n(evaluateCoreDecision)"]
    EVAL --> STORE_CACHE["Armazenar\nem Cache"]
    
    CACHED_CORE --> AUDIT
    STORE_CACHE --> AUDIT
    
    AUDIT["Auditoria de Divergência\n(core vs legacy)"]
    
    AUDIT --> IS_MUTATION{"É Mutação?\n(CREATE/EDIT/DELETE)"}
    
    IS_MUTATION -->|"Sim"| PILOT_ACTIVE{"Pilot Ativo\npara Contexto?"}
    
    PILOT_ACTIVE -->|"Sim"| CROSS_TENANT{"Cross-tenant?"}
    
    CROSS_TENANT -->|"Sim"| BLOCK["🔴 BLOQUEADO\n(Fail-Closed)"]
    CROSS_TENANT -->|"Não"| CONTROLLED{"Escrita\nControlada?"}
    
    CONTROLLED -->|"Flag Ativa"| ALLOW["🟢 PERMITIDO\n(Core Decide)"]
    CONTROLLED -->|"Flag Inativa"| READONLY_BLOCK["🟡 BLOQUEADO\n(Readonly Mode)"]
    
    PILOT_ACTIVE -->|"Não"| DELEGATION["Delegação ao\nLegado"]
    
    IS_MUTATION -->|"Não"| IS_PILOT{"Pilot Ativo\npara Recurso?"}
    
    IS_PILOT -->|"Sim"| CORE_DECIDES{"Core Decide"}
    
    CORE_DECIDES -->|"Sucesso"| CORE_OK["🟢 Core OK"]
    CORE_DECIDES -->|"Erro"| FALLBACK["⚠️ Fallback\npara Legado"]
    
    FALLBACK --> COUNT{"Fallbacks\n≥ Limite?"}
    COUNT -->|"Sim"| KILL["🔴 Kill Switch\nPilot Desabilitado"]
    COUNT -->|"Não"| LEGACY_FB["Decisão Legacy\n(Fallback)"]
    
    IS_PILOT -->|"Não"| DELEGATION
    
    DELEGATION --> LEGACY_OK["📋 Legacy Decide\n(Delegação Rastreada)"]
    
    style BLOCK fill:#e94560,color:#fff
    style ALLOW fill:#2ecc71,color:#fff
    style READONLY_BLOCK fill:#f39c12,color:#fff
    style KILL fill:#e94560,color:#fff
    style CORE_OK fill:#2ecc71,color:#fff
```

**Legenda**: O motor de autorização opera em três modos: Shadow (ambos avaliam, legado decide), Pilot (core decide para whitelist), Kill Switch (retorno automático ao legado). Mutações cross-tenant são sempre bloqueadas (fail-closed).
