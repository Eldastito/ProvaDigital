
import { MeshMessage, MeshPeer, MeshRole, MeshMessageType } from "../types";
import { io, Socket } from 'socket.io-client';

/**
 * Hybrid Mesh Service
 * 
 * Prioridade de Conexão:
 * 1. Socket.IO via Gateway Local (Wi-Fi Nativo - Ultra-Rápido)
 * 2. BroadcastChannel (Fallback: Tabs no mesmo navegador)
 * 
 * O Gateway Local roda no PC da Sede (npm run mesh:gateway) na porta 3001.
 * Tablets conectados ao Hotspot do Windows acessam via IP: 192.168.137.1:3001
 */

// IP padrão do Windows Mobile Hotspot
const HOTSPOT_GATEWAY_IP = '192.168.137.1';
const GATEWAY_PORT = 3001;

// Lista de URLs para tentar conectar ao Gateway (em ordem de prioridade)
const GATEWAY_URLS = [
    `http://localhost:${GATEWAY_PORT}`,          // PC local (Centro de Comando)
    `http://${HOTSPOT_GATEWAY_IP}:${GATEWAY_PORT}`, // Tablets via Hotspot
    `http://192.168.1.1:${GATEWAY_PORT}`,        // Roteador doméstico comum
];

class LocalMeshService {
    private channel: BroadcastChannel | null = null;
    private socket: Socket | null = null;
    private peer: MeshPeer;
    private listeners: ((msg: MeshMessage) => void)[] = [];
    private peers: Map<string, MeshPeer> = new Map();
    private announceInterval: any = null;
    private _gatewayConnected: boolean = false;

    constructor() {
        this.peer = {
            id: 'unknown',
            name: 'Unknown Device',
            role: 'UNASSIGNED',
            isOnline: false,
            lastSeen: 0
        };
    }

    /** Indica se o Gateway Local está conectado */
    get isGatewayConnected(): boolean {
        return this._gatewayConnected;
    }

    // Initialize the device on the network
    public join(id: string, name: string, role: MeshRole, tenantId?: string) {
        // Limpar conexões anteriores
        this.disconnect();

        this.peer = {
            id,
            name,
            role,
            isOnline: true,
            lastSeen: Date.now()
        };

        console.log(`[MESH] ${name} joining as ${role} (ID: ${id})`);

        // 1. BroadcastChannel (Fallback: comunicação entre abas)
        try {
            this.channel = new BroadcastChannel('examepad_local_mesh');
            this.channel.onmessage = (event) => {
                this.handleIncomingMessage(event.data as MeshMessage);
            };
        } catch (e) {
            console.warn('[MESH] BroadcastChannel não disponível neste ambiente.');
        }

        // 2. Socket.IO via Gateway Local (Prioridade #1 - Wi-Fi Nativo)
        this.tryConnectGateway(tenantId || 'global');

        // Heartbeat / Announce periódico
        if (this.announceInterval) clearInterval(this.announceInterval);
        this.announceInterval = setInterval(() => this.announce(), 3000);
    }

    /**
     * Tenta conectar ao Gateway Local em todas as URLs conhecidas
     */
    private async tryConnectGateway(roomId: string) {
        for (const url of GATEWAY_URLS) {
            try {
                // Teste rápido de disponibilidade (fetch com timeout)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const res = await fetch(`${url}/health`, {
                    signal: controller.signal,
                    mode: 'cors'
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    console.log(`[MESH] ✅ Gateway encontrado em: ${url}`);
                    this.connectSocket(url, roomId);
                    return; // Conectou com sucesso, para de tentar
                }
            } catch (e) {
                // Silencioso - tenta a próxima URL
                console.log(`[MESH] Gateway não encontrado em: ${url}`);
            }
        }

        console.warn('[MESH] ⚠️ Nenhum Gateway Local encontrado. Operando somente via BroadcastChannel.');
    }

    /**
     * Estabelece conexão Socket.IO com o Gateway
     */
    private connectSocket(url: string, roomId: string) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 5000
        });

        this.socket.on('connect', () => {
            this._gatewayConnected = true;
            console.log(`[MESH] 🔗 Conectado ao Gateway Local via Socket.IO`);

            // Entrar na sala do mesh
            this.socket!.emit('join-room', {
                roomId: `mesh_${roomId}`,
                peerId: this.peer.id,
                peerType: this.peer.role,
                peerName: this.peer.name
            });

            // Disparar anúncio imediato
            this.announce();
        });

        // Escutar mensagens mesh retransmitidas pelo gateway
        this.socket.on('mesh-broadcast', (msg: MeshMessage) => {
            this.handleIncomingMessage(msg);
        });

        // Quando um novo peer entra na sala, atualizar a lista
        this.socket.on('peer-joined', (peerInfo: any) => {
            console.log(`[MESH] 👋 Novo peer via Gateway: ${peerInfo.name}`);
            const newPeer: MeshPeer = {
                id: peerInfo.id,
                name: peerInfo.name,
                role: peerInfo.type || 'UNASSIGNED',
                isOnline: true,
                lastSeen: Date.now()
            };
            this.peers.set(newPeer.id, newPeer);
            // Notificar listeners com uma mensagem DISCOVERY sintética
            const discoveryMsg: MeshMessage = {
                type: 'DISCOVERY',
                sender: newPeer,
                payload: { serialNumber: newPeer.id },
                timestamp: Date.now()
            };
            this.listeners.forEach(cb => cb(discoveryMsg));
        });

        this.socket.on('disconnect', () => {
            this._gatewayConnected = false;
            console.log('[MESH] ⚡ Desconectado do Gateway Local.');
        });

        this.socket.on('connect_error', (err: any) => {
            this._gatewayConnected = false;
            console.warn('[MESH] Erro de conexão com Gateway:', err.message);
        });
    }

    // "Logical Kill Switch" - Disconnects from everything
    public disconnect() {
        if (this.announceInterval) clearInterval(this.announceInterval);
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this._gatewayConnected = false;
        }
        this.peer.isOnline = false;
        console.log(`[MESH] ${this.peer.name} disconnected (Kill Switch).`);
    }

    public getPeers(): MeshPeer[] {
        const now = Date.now();
        return Array.from(this.peers.values()).filter(
            p => p.id !== this.peer.id && (now - p.lastSeen < 10000)
        );
    }

    public onMessage(callback: (msg: MeshMessage) => void) {
        this.listeners.push(callback);
    }

    public broadcast(type: MeshMessageType, payload: any) {
        const msg: MeshMessage = {
            type,
            sender: this.peer,
            payload,
            timestamp: Date.now()
        };

        // Canal 1: BroadcastChannel (abas locais)
        if (this.channel) {
            try { this.channel.postMessage(msg); } catch (e) { /* ignore */ }
        }

        // Canal 2: Socket.IO (Gateway Wi-Fi Nativo) - PRIORIDADE
        if (this.socket?.connected) {
            this.socket.emit('mesh-broadcast', msg);
        }
    }

    public sendTo(targetId: string, type: MeshMessageType, payload: any) {
        const msg: MeshMessage = {
            type,
            sender: this.peer,
            targetId,
            payload,
            timestamp: Date.now()
        };

        // Canal 1: BroadcastChannel
        if (this.channel) {
            try { this.channel.postMessage(msg); } catch (e) { /* ignore */ }
        }

        // Canal 2: Socket.IO (Gateway)
        if (this.socket?.connected) {
            this.socket.emit('mesh-broadcast', msg);
        }
    }

    private announce() {
        if (!this.peer.isOnline) return;
        this.broadcast('ANNOUNCE', {});
    }

    private handleIncomingMessage(msg: MeshMessage) {
        // Anti-Loop/Self Check
        if (msg.sender.id === this.peer.id) return;

        // Update peer list
        this.peers.set(msg.sender.id, { ...msg.sender, lastSeen: Date.now() });

        // Filter messages for me or broadcast
        if (!msg.targetId || msg.targetId === this.peer.id) {
            this.listeners.forEach(cb => cb(msg));
        }
    }
}

export const meshService = new LocalMeshService();
