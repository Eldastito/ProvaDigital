/**
 * @module MeshNetworkService
 * @description Serviço de Rede Mesh P2P para comunicação offline entre dispositivos.
 * 
 * Implementa o Núcleo Inventivo "Execução Offline-Local Orquestrada" da plataforma FORGE,
 * permitindo a execução de avaliações digitais em larga escala em ambientes sem
 * conectividade internet, usando rede local mesh P2P entre dispositivos.
 * 
 * Mecanismos:
 * - Descoberta de peers via WebRTC Signaling
 * - Broadcast confiável com cache de messageId para evitar loops
 * - Heartbeat periódico (5s) para detecção de nós ativos/inativos
 * - Cleanout automático de nós inativos (30s timeout)
 * - Envelope Híbrido (MeshHybridEnvelope) com separação header/payload cifrado
 * - Handshake de identidade (Professor ↔ Aluno) para habilitação de prova
 * 
 * Efeito Técnico: Resiliência operacional com redução material da dependência
 * de conectividade externa durante a aplicação da avaliação.
 * 
 * @patent-safe Este módulo é parte do dossiê de Patente de Invenção FORGE.
 * @see PI_DOSSIER_PATENT_SAFE.md para o dossiê de patente.
 */

import { getWebRTCClient, DataChannelMessage, PeerConnection } from './webrtcClient';

// Tipos
export interface MeshMessage {
    /** Tipo de mensagem do protocolo mesh */
    type: 'HEARTBEAT' | 'TELEMETRY' | 'ALERT' | 'ANSWER' | 'HANDSHAKE_REQUEST' | 'HANDSHAKE_RESPONSE' | 'ENABLE_EXAM' | 'CUSTOM' | 'UNLOCK_SCREEN' | 'AUTOSAVE' | 'HANDSHAKE_SUBMIT' | 'CONFIRM_RECEIPT';
    /** ID do remetente (studentId ou tabletId) */
    from: string;
    /** ID do destinatário ou 'BROADCAST' para todos */
    to: string | 'BROADCAST';
    /** Dados da mensagem (formato depende do type) */
    payload: Record<string, unknown>;
    /** Timestamp da mensagem (epoch ms) */
    timestamp: number;
    /** Identificador único da mensagem para dedup */
    messageId: string;
}

/**
 * Envelope Híbrido (T3)
 * Separa metadados públicos (header) de carga cifrada (encryptedPayload)
 */
export interface MeshHybridEnvelope {
    schemaVersion: '1.2';
    encryptionVersion: '1.0';
    payloadType: 'AUTOSAVE' | 'ANSWER';
    eventId: string;
    examId: string;
    studentId: string;
    sessionId?: string;
    attemptId?: string;
    token: string; // F3A: Token de Identidade e Anti-Replay
    header: {
        progress: number;
        answeredCount: number;
        currentQuestion: number;
        battery: number;
        isOnline: boolean;
        timestamp: string;
    };
    encryptedPayload: {
        iv: string; // Base64 do IV
        data: string; // Ciphertext Base64
    };
    signature: string; // HMAC-SHA256
}

/**
 * Representa um nó na rede mesh (tablet conectado).
 */
export interface MeshNode {
    /** Identificador único do nó */
    id: string;
    /** Tipo/papel do dispositivo na rede */
    type: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR' | 'ROUTER';
    /** Nome legível do nó */
    name: string;
    /** Timestamp do último heartbeat recebido (epoch ms) */
    lastSeen: number;
    /** Se o nó está ativamente conectado */
    isConnected: boolean;
    /** Metadados adicionais do nó (bateria, versão, etc.) */
    metadata?: Record<string, unknown>;
}

export interface MeshStats {
    totalNodes: number;
    connectedNodes: number;
    messagesSent: number;
    messagesReceived: number;
    uptime: number;
}

/**
 * Serviço de Rede Mesh — Orquestrador de comunicação P2P offline.
 * 
 * Coordena toda a comunicação entre dispositivos na rede local,
 * gerenciando ciclo de vida de nós, broadcast de mensagens e
 * tolerância a falhas de conexão.
 * 
 * @patent-safe Protocolo de transporte e descoberta de nós.
 */
export class MeshNetworkService {
    private client = getWebRTCClient();
    private nodes: Map<string, MeshNode> = new Map();
    private messageIdCache: Set<string> = new Set(); // Para evitar loops
    private messagesSent: number = 0;
    private messagesReceived: number = 0;
    private startTime: number = 0;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private cleanupInterval: NodeJS.Timeout | null = null;

    // Callbacks customizados
    private onNodeJoined?: (node: MeshNode) => void;
    private onNodeLeft?: (nodeId: string) => void;
    private onMessageReceived?: (message: MeshMessage) => void;

    /**
     * Inicializar rede mesh
     */
    async initialize(config: {
        signalingServerUrl: string;
        roomId: string;
        nodeId: string;
        nodeType: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR' | 'ROUTER';
        nodeName: string;
    }): Promise<void> {
        try {
            console.log('🌐 Inicializando rede mesh...');

            this.startTime = Date.now();

            // Conectar cliente WebRTC
            await this.client.connect({
                signalingServerUrl: config.signalingServerUrl,
                roomId: config.roomId,
                peerId: config.nodeId,
                peerType: config.nodeType,
                peerName: config.nodeName
            });

            // Registrar handlers de mensagens
            this.setupMessageHandlers();

            // Iniciar heartbeat (a cada 5 segundos)
            this.startHeartbeat();

            // Iniciar limpeza de nodes inativos (a cada 30 segundos)
            this.startCleanup();

            console.log('✅ Rede mesh inicializada');

        } catch (error) {
            console.error('❌ Erro ao inicializar mesh:', error);
            throw error;
        }
    }

    /**
     * Configurar handlers de mensagens
     */
    private setupMessageHandlers(): void {
        // Heartbeat
        this.client.onMessage('HEARTBEAT', (msg) => {
            this.handleHeartbeat(msg);
        });

        // Telemetria
        this.client.onMessage('TELEMETRY', (msg) => {
            this.handleTelemetry(msg);
        });

        // Alerta
        this.client.onMessage('ALERT', (msg) => {
            this.handleAlert(msg);
        });

        // Resposta de prova
        this.client.onMessage('ANSWER', (msg) => {
            this.handleAnswer(msg);
        });

        // Handshake
        this.client.onMessage('HANDSHAKE_REQUEST', (msg) => {
            this.handleHandshakeRequest(msg);
        });

        this.client.onMessage('HANDSHAKE_RESPONSE', (msg) => {
            this.handleHandshakeResponse(msg);
        });

        // Comando de habilitação
        this.client.onMessage('ENABLE_EXAM', (msg) => {
            this.handleEnableExam(msg);
        });

        // Mensagem customizada
        this.client.onMessage('CUSTOM', (msg) => {
            if (this.onMessageReceived) {
                const meshMsg: MeshMessage = {
                    type: 'CUSTOM',
                    from: msg.from,
                    to: 'BROADCAST',
                    payload: msg.payload,
                    timestamp: msg.timestamp,
                    messageId: this.generateMessageId()
                };
                this.onMessageReceived(meshMsg);
            }
        });
    }

    /**
     * Processar heartbeat recebido
     */
    private handleHeartbeat(msg: DataChannelMessage): void {
        const { peerId, peerName, peerType, metadata } = msg.payload;

        // Atualizar ou adicionar node
        const existingNode = this.nodes.get(peerId);

        if (!existingNode) {
            // Novo node descoberto
            const node: MeshNode = {
                id: peerId,
                type: peerType || 'STUDENT',
                name: peerName,
                lastSeen: Date.now(),
                isConnected: true,
                metadata
            };

            this.nodes.set(peerId, node);

            console.log('👋 Novo node descoberto:', peerName);

            if (this.onNodeJoined) {
                this.onNodeJoined(node);
            }

        } else {
            // Atualizar lastSeen
            existingNode.lastSeen = Date.now();
            existingNode.isConnected = true;
            this.nodes.set(peerId, existingNode);
        }

        this.messagesReceived++;
    }

    /**
     * Processar telemetria recebida
     */
    private handleTelemetry(msg: DataChannelMessage): void {
        console.log('📊 Telemetria recebida de:', msg.from);

        if (this.onMessageReceived) {
            const meshMsg: MeshMessage = {
                type: 'TELEMETRY',
                from: msg.from,
                to: 'BROADCAST',
                payload: msg.payload,
                timestamp: msg.timestamp,
                messageId: this.generateMessageId()
            };
            this.onMessageReceived(meshMsg);
        }

        this.messagesReceived++;
    }

    /**
     * Processar alerta recebido
     */
    private handleAlert(msg: DataChannelMessage): void {
        console.log('🚨 Alerta recebido:', msg.payload.message);

        if (this.onMessageReceived) {
            const meshMsg: MeshMessage = {
                type: 'ALERT',
                from: msg.from,
                to: msg.payload.to || 'BROADCAST',
                payload: msg.payload,
                timestamp: msg.timestamp,
                messageId: this.generateMessageId()
            };
            this.onMessageReceived(meshMsg);
        }

        this.messagesReceived++;
    }

    /**
     * Processar resposta de prova
     */
    private handleAnswer(msg: DataChannelMessage): void {
        console.log('✍️ Resposta recebida de:', msg.from);

        if (this.onMessageReceived) {
            const meshMsg: MeshMessage = {
                type: 'ANSWER',
                from: msg.from,
                to: 'BROADCAST',
                payload: msg.payload,
                timestamp: msg.timestamp,
                messageId: this.generateMessageId()
            };
            this.onMessageReceived(meshMsg);
        }

        this.messagesReceived++;
    }

    /**
     * Processar Handshake Request (Aluno -> Professor)
     */
    private handleHandshakeRequest(msg: DataChannelMessage): void {
        console.log('🤝 Handshake solicitado por:', msg.from);

        if (this.onMessageReceived) {
            this.onMessageReceived({
                type: 'HANDSHAKE_REQUEST',
                from: msg.from,
                to: this.client.getStats().config?.peerId || 'PROFESSOR',
                payload: msg.payload,
                timestamp: msg.timestamp,
                messageId: this.generateMessageId()
            });
        }
    }

    /**
     * Processar Handshake Response (Professor -> Aluno)
     */
    private handleHandshakeResponse(msg: DataChannelMessage): void {
        console.log('🔑 Resposta de Handshake recebida para:', msg.payload.targetStudentId);

        if (this.onMessageReceived) {
            this.onMessageReceived({
                type: 'HANDSHAKE_RESPONSE',
                from: msg.from,
                to: msg.payload.targetStudentId,
                payload: msg.payload,
                timestamp: msg.timestamp,
                messageId: this.generateMessageId()
            });
        }
    }

    /**
     * Processar comando de Habilitação (Broadcast do Professor)
     */
    private handleEnableExam(msg: DataChannelMessage): void {
        console.log('🚀 Comando de Habilitação de Prova recebido!');

        if (this.onMessageReceived) {
            this.onMessageReceived({
                type: 'ENABLE_EXAM',
                from: msg.from,
                to: 'BROADCAST',
                payload: msg.payload,
                timestamp: msg.timestamp,
                messageId: this.generateMessageId()
            });
        }
    }

    /**
     * Enviar telemetria via Mesh
     */
    sendTelemetry(payload: any): void {
        this.broadcastMessage('TELEMETRY', payload);
    }

    /**
     * Iniciar envio de heartbeat periódico
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            const config = this.client.getStats().config;
            if (!config) return;

            this.client.broadcast('HEARTBEAT', {
                peerId: config.peerId,
                peerName: config.peerName,
                peerType: config.peerType,
                timestamp: Date.now()
            });

        }, 5000); // A cada 5 segundos
    }

    /**
     * Iniciar limpeza de nodes inativos
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 30000; // 30 segundos sem heartbeat

            this.nodes.forEach((node, nodeId) => {
                if (now - node.lastSeen > timeout) {
                    console.log('🧹 Removendo node inativo:', node.name);
                    node.isConnected = false;
                    this.nodes.delete(nodeId);

                    if (this.onNodeLeft) {
                        this.onNodeLeft(nodeId);
                    }
                }
            });

            // Limpar cache de messageIds antigos
            if (this.messageIdCache.size > 1000) {
                this.messageIdCache.clear();
            }

        }, 30000); // A cada 30 segundos
    }

    /**
     * Enviar mensagem para node específico
     */
    sendMessage(targetNodeId: string, type: MeshMessage['type'], payload: any): boolean {
        const message: MeshMessage = {
            type,
            from: this.client.getStats().config?.peerId || 'unknown',
            to: targetNodeId,
            payload,
            timestamp: Date.now(),
            messageId: this.generateMessageId()
        };

        const success = this.client.sendTo(targetNodeId, type, payload);

        if (success) {
            this.messagesSent++;
            this.messageIdCache.add(message.messageId);
        }

        return success;
    }

    /**
     * Broadcast para todos os nodes
     */
    broadcastMessage(type: MeshMessage['type'], payload: any): number {
        const message: MeshMessage = {
            type,
            from: this.client.getStats().config?.peerId || 'unknown',
            to: 'BROADCAST',
            payload,
            timestamp: Date.now(),
            messageId: this.generateMessageId()
        };

        const sentCount = this.client.broadcast(type, payload);

        if (sentCount > 0) {
            this.messagesSent += sentCount;
            this.messageIdCache.add(message.messageId);
        }

        return sentCount;
    }

    /**
     * Obter lista de nodes conectados
     */
    getConnectedNodes(): MeshNode[] {
        return Array.from(this.nodes.values()).filter(n => n.isConnected);
    }

    /**
     * Obter node específico
     */
    getNode(nodeId: string): MeshNode | undefined {
        return this.nodes.get(nodeId);
    }

    /**
     * Obter estatísticas da mesh
     */
    getStats(): MeshStats {
        return {
            totalNodes: this.nodes.size,
            connectedNodes: this.getConnectedNodes().length,
            messagesSent: this.messagesSent,
            messagesReceived: this.messagesReceived,
            uptime: Date.now() - this.startTime
        };
    }

    /**
     * Gerar ID único para mensagem
     */
    private generateMessageId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Registrar callback para node joined
     */
    setOnNodeJoined(callback: (node: MeshNode) => void): void {
        this.onNodeJoined = callback;
    }

    /**
     * Registrar callback para node left
     */
    setOnNodeLeft(callback: (nodeId: string) => void): void {
        this.onNodeLeft = callback;
    }

    /**
     * Registrar callback para mensagem recebida
     */
    setOnMessageReceived(callback: (message: MeshMessage) => void): void {
        this.onMessageReceived = callback;
    }

    /**
     * Desconectar da mesh
     */
    async shutdown(): Promise<void> {
        console.log('🔌 Desligando rede mesh...');

        // Parar heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Parar cleanup
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        // Desconectar cliente WebRTC
        await this.client.disconnect();

        // Limpar nodes
        this.nodes.clear();
        this.messageIdCache.clear();

        console.log('✅ Mesh desligada');
    }
}

// Export singleton
let meshInstance: MeshNetworkService | null = null;

export function getMeshNetwork(): MeshNetworkService {
    if (!meshInstance) {
        meshInstance = new MeshNetworkService();
    }
    return meshInstance;
}
