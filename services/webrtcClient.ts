/**
 * WebRTC Client Service
 * 
 * Cliente WebRTC para estabelecer conexões P2P com outros tablets
 * usando signaling via Socket.io do servidor local.
 * 
 * Sprint 2 - Fase 2
 */

import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';

// Tipos
export interface WebRTCConfig {
    signalingServerUrl: string;
    roomId: string;
    peerId: string;
    peerType: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR';
    peerName: string;
}

export interface PeerConnection {
    peerId: string;
    peerType: string;
    peerName: string;
    peer: SimplePeer.Instance;
    connected: boolean;
    lastSeen: number;
}

export interface DataChannelMessage {
    type: string;
    from: string;
    payload: any;
    timestamp: number;
}

/**
 * Cliente WebRTC
 * 
 * Gerencia conexões P2P com outros tablets na rede mesh local.
 */
export class WebRTCClient {
    private socket: Socket | null = null;
    private config: WebRTCConfig | null = null;
    private peers: Map<string, PeerConnection> = new Map();
    private messageHandlers: Map<string, (msg: DataChannelMessage) => void> = new Map();
    private isConnected: boolean = false;

    /**
     * Conectar ao servidor signaling
     */
    async connect(config: WebRTCConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔌 Conectando ao servidor signaling:', config.signalingServerUrl);

                this.config = config;

                // Conectar via Socket.io
                this.socket = io(config.signalingServerUrl, {
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5
                });

                // Event: Conectado
                this.socket.on('connect', () => {
                    console.log('✅ Conectado ao servidor signaling');
                    this.isConnected = true;

                    // Entrar na sala
                    this.socket!.emit('join-room', {
                        roomId: config.roomId,
                        peerId: config.peerId,
                        peerType: config.peerType,
                        peerName: config.peerName
                    });

                    resolve();
                });

                // Event: Erro de conexão
                this.socket.on('connect_error', (error) => {
                    console.error('❌ Erro ao conectar:', error);
                    reject(error);
                });

                // Event: Peers existentes na sala
                this.socket.on('existing-peers', (peers: any[]) => {
                    console.log(`📋 ${peers.length} peers já na sala`);

                    // Iniciar conexão com cada peer (como initiator)
                    peers.forEach(peer => {
                        this.createPeerConnection(peer, true);
                    });
                });

                // Event: Novo peer entrou
                this.socket.on('peer-joined', (peerInfo: any) => {
                    console.log('👋 Novo peer entrou:', peerInfo.name);

                    // Aguardar offer dele (não iniciamos, ele que inicia)
                });

                // Event: Peer saiu
                this.socket.on('peer-left', (peerId: string) => {
                    console.log('👋 Peer saiu:', peerId);
                    this.removePeer(peerId);
                });

                // ===== WEBRTC SIGNALING =====

                // Receber offer
                this.socket.on('offer', async (data: { from: string; offer: any }) => {
                    console.log('📨 Recebido offer de:', data.from);
                    await this.handleOffer(data.from, data.offer);
                });

                // Receber answer
                this.socket.on('answer', async (data: { from: string; answer: any }) => {
                    console.log('📨 Recebido answer de:', data.from);
                    await this.handleAnswer(data.from, data.answer);
                });

                // Receber ICE candidate
                this.socket.on('ice-candidate', async (data: { from: string; candidate: any }) => {
                    await this.handleIceCandidate(data.from, data.candidate);
                });

            } catch (error) {
                console.error('❌ Erro ao configurar WebRTC Client:', error);
                reject(error);
            }
        });
    }

    /**
     * Criar conexão P2P com um peer
     */
    private createPeerConnection(peerInfo: any, initiator: boolean): void {
        console.log(`🔗 Criando conexão P2P com ${peerInfo.name} (initiator: ${initiator})`);

        // Configuração ICE (STUN servers públicos)
        const iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];

        // Criar peer SimplePeer
        const peer = new SimplePeer({
            initiator,
            trickle: true,
            config: { iceServers }
        });

        // Event: Signal (offer/answer/ice-candidate)
        peer.on('signal', (signal) => {
            if (signal.type === 'offer') {
                console.log('📤 Enviando offer para:', peerInfo.id);
                this.socket!.emit('offer', {
                    target: peerInfo.id,
                    offer: signal
                });
            } else if (signal.type === 'answer') {
                console.log('📤 Enviando answer para:', peerInfo.id);
                this.socket!.emit('answer', {
                    target: peerInfo.id,
                    answer: signal
                });
            } else {
                // ICE candidate
                this.socket!.emit('ice-candidate', {
                    target: peerInfo.id,
                    candidate: signal
                });
            }
        });

        // Event: Conectado
        peer.on('connect', () => {
            console.log('✅ Conectado ao peer:', peerInfo.name);

            const connection = this.peers.get(peerInfo.id);
            if (connection) {
                connection.connected = true;
                connection.lastSeen = Date.now();
            }
        });

        // Event: Dados recebidos
        peer.on('data', (data) => {
            try {
                const message: DataChannelMessage = JSON.parse(data.toString());
                this.handleMessage(message);

                // Atualizar lastSeen
                const connection = this.peers.get(peerInfo.id);
                if (connection) {
                    connection.lastSeen = Date.now();
                }

            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error);
            }
        });

        // Event: Erro
        peer.on('error', (error) => {
            console.error('❌ Erro na conexão P2P:', error);
        });

        // Event: Fechado
        peer.on('close', () => {
            console.log('🔌 Conexão fechada com:', peerInfo.name);
            this.removePeer(peerInfo.id);
        });

        // Adicionar ao mapa
        const connection: PeerConnection = {
            peerId: peerInfo.id,
            peerType: peerInfo.type,
            peerName: peerInfo.name,
            peer,
            connected: false,
            lastSeen: Date.now()
        };

        this.peers.set(peerInfo.id, connection);
    }

    /**
     * Processar offer recebido
     */
    private async handleOffer(fromPeerId: string, offer: any): Promise<void> {
        // Verificar se já temos conexão
        if (this.peers.has(fromPeerId)) {
            console.warn('⚠️ Já existe conexão com este peer, ignorando offer');
            return;
        }

        // Criar peer (não-initiator)
        const peerInfo = {
            id: fromPeerId,
            type: 'UNKNOWN',
            name: 'Unknown'
        };

        this.createPeerConnection(peerInfo, false);

        // Processar offer
        const connection = this.peers.get(fromPeerId);
        if (connection) {
            connection.peer.signal(offer);
        }
    }

    /**
     * Processar answer recebido
     */
    private async handleAnswer(fromPeerId: string, answer: any): Promise<void> {
        const connection = this.peers.get(fromPeerId);
        if (!connection) {
            console.warn('⚠️ Answer recebido de peer desconhecido:', fromPeerId);
            return;
        }

        connection.peer.signal(answer);
    }

    /**
     * Processar ICE candidate
     */
    private async handleIceCandidate(fromPeerId: string, candidate: any): Promise<void> {
        const connection = this.peers.get(fromPeerId);
        if (!connection) {
            return;
        }

        connection.peer.signal(candidate);
    }

    /**
     * Remover peer desconectado
     */
    private removePeer(peerId: string): void {
        const connection = this.peers.get(peerId);
        if (connection) {
            try {
                connection.peer.destroy();
            } catch (error) {
                // Ignorar erro ao destruir
            }
            this.peers.delete(peerId);
        }
    }

    /**
     * Enviar mensagem para um peer específico
     */
    sendTo(peerId: string, type: string, payload: any): boolean {
        const connection = this.peers.get(peerId);

        if (!connection || !connection.connected) {
            console.warn('⚠️ Peer não conectado:', peerId);
            return false;
        }

        const message: DataChannelMessage = {
            type,
            from: this.config!.peerId,
            payload,
            timestamp: Date.now()
        };

        try {
            connection.peer.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            return false;
        }
    }

    /**
     * Broadcast de mensagem para todos os peers
     */
    broadcast(type: string, payload: any): number {
        let sentCount = 0;

        this.peers.forEach((connection) => {
            if (connection.connected) {
                const success = this.sendTo(connection.peerId, type, payload);
                if (success) sentCount++;
            }
        });

        return sentCount;
    }

    /**
     * Registrar handler para tipo de mensagem
     */
    onMessage(type: string, handler: (msg: DataChannelMessage) => void): void {
        this.messageHandlers.set(type, handler);
    }

    /**
     * Processar mensagem recebida
     */
    private handleMessage(message: DataChannelMessage): void {
        const handler = this.messageHandlers.get(message.type);

        if (handler) {
            handler(message);
        } else {
            console.log('📨 Mensagem sem handler:', message.type);
        }
    }

    /**
     * Obter lista de peers conectados
     */
    getConnectedPeers(): PeerConnection[] {
        return Array.from(this.peers.values()).filter(p => p.connected);
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            isConnected: this.isConnected,
            totalPeers: this.peers.size,
            connectedPeers: this.getConnectedPeers().length,
            config: this.config
        };
    }

    /**
     * Enviar heartbeat para todos
     */
    sendHeartbeat(): void {
        this.broadcast('HEARTBEAT', {
            peerId: this.config!.peerId,
            peerName: this.config!.peerName,
            timestamp: Date.now()
        });
    }

    /**
     * Desconectar de todos os peers
     */
    async disconnect(): Promise<void> {
        console.log('🔌 Desconectando de todos os peers...');

        // Destruir todas as conexões P2P
        this.peers.forEach((connection) => {
            try {
                connection.peer.destroy();
            } catch (error) {
                // Ignorar
            }
        });

        this.peers.clear();

        // Desconectar do signaling server
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.isConnected = false;

        console.log('✅ Desconectado');
    }
}

// Export singleton helper
let clientInstance: WebRTCClient | null = null;

export function getWebRTCClient(): WebRTCClient {
    if (!clientInstance) {
        clientInstance = new WebRTCClient();
    }
    return clientInstance;
}
