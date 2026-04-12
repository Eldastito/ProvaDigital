/**
 * @module SecurityClassification
 * @description Classificação de constantes de segurança da plataforma FORGE.
 * 
 * Este arquivo centraliza a marcação de parâmetros operacionais por
 * nível de classificação, garantindo segregação estrita entre:
 * - PATENT_SAFE: Pode ser incluído em documentos de patente/registro
 * - TRADE_SECRET: NUNCA deve ser incluído em documentos externos
 * - OPERATIONAL: Configuração interna sem implicação legal
 * 
 * @trade-secret-governance Este arquivo é o índice de classificação.
 * @see TRADE_SECRET_CLASSIFIED.md para o dossiê de segredos industriais.
 */

// ============================================================================
// CLASSIFICAÇÃO: PATENT_SAFE — Parâmetros que podem ser divulgados
// ============================================================================

/**
 * Algoritmos criptográficos utilizados no Envelope Híbrido.
 * @classification PATENT_SAFE — Algoritmos são públicos por design.
 */
export const CRYPTO_ALGORITHMS = {
    /** Cifra simétrica para payload de dados */
    SYMMETRIC_CIPHER: 'AES-GCM' as const,
    /** Comprimento de chave simétrica (bits) */
    SYMMETRIC_KEY_LENGTH: 256 as const,
    /** Algoritmo de derivação de chave */
    KEY_DERIVATION: 'PBKDF2' as const,
    /** Hash utilizado na derivação */
    KEY_DERIVATION_HASH: 'SHA-256' as const,
    /** Cifra assimétrica para transporte de chave */
    ASYMMETRIC_CIPHER: 'RSA-OAEP' as const,
    /** Comprimento de chave assimétrica (bits) */
    ASYMMETRIC_KEY_LENGTH: 2048 as const,
    /** Algoritmo de assinatura para integridade */
    SIGNATURE_ALGORITHM: 'HMAC' as const,
    /** Hash utilizado na assinatura */
    SIGNATURE_HASH: 'SHA-256' as const,
    /** Comprimento do Initialization Vector (bytes) */
    IV_LENGTH_BYTES: 12 as const,
} as const;

/**
 * Formato do Context Pointer canônico para Cold Boot.
 * @classification PATENT_SAFE — Formato descrito na patente.
 */
export const CONTEXT_POINTER = {
    /** Template do ponteiro de contexto */
    FORMAT: 'context:{eventId}:{studentId}:{examId}:active' as const,
    /** Template da chave de armazenamento */
    STORAGE_KEY_FORMAT: 'storage_{eventId}_{studentId}_{examId}' as const,
    /** Template da chave de tentativa */
    ATTEMPT_KEY_FORMAT: 'attempt:{attemptId}' as const,
} as const;

/**
 * Estados válidos do ciclo de vida da sessão.
 * @classification PATENT_SAFE — Transições descritas na patente.
 */
export const SESSION_LIFECYCLE = {
    /** Estados possíveis */
    STATES: ['ACTIVE', 'SUPERSEDED', 'COMPLETED', 'ABORTED'] as const,
    /** Origens possíveis */
    ORIGINS: ['CANONICAL', 'LEGACY_MIGRATED'] as const,
    /** Transições válidas (de → para) */
    VALID_TRANSITIONS: {
        ACTIVE: ['SUPERSEDED', 'COMPLETED', 'ABORTED'],
        SUPERSEDED: [],  // Estado terminal
        COMPLETED: [],   // Estado terminal
        ABORTED: [],     // Estado terminal
    } as const,
} as const;

/**
 * Configuração do protocolo Mesh (parâmetros públicos).
 * @classification PATENT_SAFE — Períodos de heartbeat são padrão.
 */
export const MESH_PROTOCOL = {
    /** Intervalo de heartbeat (ms) */
    HEARTBEAT_INTERVAL_MS: 5000 as const,
    /** Timeout para considerar nó inativo (ms) */
    NODE_INACTIVE_TIMEOUT_MS: 30000 as const,
    /** Tipos de mensagem do protocolo */
    MESSAGE_TYPES: [
        'HEARTBEAT', 'TELEMETRY', 'ALERT', 'ANSWER',
        'HANDSHAKE_REQUEST', 'HANDSHAKE_RESPONSE',
        'ENABLE_EXAM', 'CUSTOM', 'UNLOCK_SCREEN',
        'AUTOSAVE', 'HANDSHAKE_SUBMIT', 'CONFIRM_RECEIPT'
    ] as const,
} as const;

// ============================================================================
// CLASSIFICAÇÃO: TRADE_SECRET — NUNCA incluir em documentos de patente
// ============================================================================

/**
 * @trade-secret Parâmetros de detecção de fraude.
 * @classification TRADE_SECRET — Heurísticas proprietárias.
 * 
 * ATENÇÃO: Os valores abaixo são marcadores de referência.
 * Os valores REAIS devem ser carregados de variáveis de ambiente
 * ou de um gerenciador de segredos (ex: Vault, AWS Secrets Manager).
 * 
 * Veja TRADE_SECRET_CLASSIFIED.md para o inventário completo.
 */
export const PROCTORING_THRESHOLDS = {
    /** @trade-secret Peso dos eventos de detecção facial */
    FACE_DETECTION_WEIGHT: '__LOAD_FROM_ENV__' as const,
    /** @trade-secret Latência máxima aceitável para mesh (ms) */
    MESH_LATENCY_CEILING_MS: '__LOAD_FROM_ENV__' as const,
    /** @trade-secret Número de iterações PBKDF2 */
    PBKDF2_ITERATIONS: '__LOAD_FROM_ENV__' as const,
    /** @trade-secret Threshold de anomalia BLE */
    BLE_ANOMALY_THRESHOLD: '__LOAD_FROM_ENV__' as const,
} as const;

/**
 * @trade-secret Chaves de provisionamento.
 * @classification TRADE_SECRET — Chaves raiz de provisioning.
 * 
 * NUNCA devem ser hardcoded. Carregar de variáveis de ambiente.
 */
export const PROVISIONING_KEYS = {
    /** @trade-secret Chave raiz para provisioning de tablets */
    ROOT_PROVISIONING_KEY: '__LOAD_FROM_ENV__' as const,
    /** @trade-secret Salt para derivação de meshKey */
    MESH_KEY_SALT: '__LOAD_FROM_ENV__' as const,
} as const;
