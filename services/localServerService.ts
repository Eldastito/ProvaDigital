/**
 * Local Server Service
 * 
 * Servidor HTTP local que roda no tablet roteador para:
 * - Servir página de status
 * - Gerenciar signaling WebRTC via Socket.io
 * - Fornecer API REST para peers
 * 
 * Sprint 2 - Fase 1/2
 * 
 * DESIGN NOTE: Este arquivo é projetado para ser "Safe-to-Bundle" no navegador.
 * Os módulos de servidor (express, http, socket.io) são importados dinamicamente
 * apenas quando o servidor é iniciado, o que não deve ocorrer em um ambiente web SaaS.
 */

// Tipos
export interface ServerConfig {
    port: number;
    corsOrigins: string[];
}

export interface PeerInfo {
    id: string;
    type: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR';
    name: string;
    connectedAt: number;
    lastSeen: number;
}

/**
 * Servidor Local HTTP + WebSocket
 */
export class LocalServerService {
    private app: any = null;
    private httpServer: any = null;
    private io: any = null;
    private peers: Map<string, PeerInfo> = new Map();
    private isRunning: boolean = false;

    constructor() {
        // Initialization moved to start() to avoid dynamic import complexity in constructor
    }

    /**
     * Iniciar servidor
     */
    async start(config: ServerConfig): Promise<void> {
        if (this.isRunning) return;

        try {
            // Dynamic check for environment support
            if (typeof window !== 'undefined' && !(window as any).isNativeApp) {
                console.warn('⚠️ LocalServerService: Servidor local não é suportado no navegador padrão.');
                return;
            }

            // Dynamic imports to prevent Vite from bundling these for the browser
            const express = (await import('express')).default;
            const { createServer } = await import('http');
            const { Server: SocketIOServer } = await import('socket.io');
            const cors = (await import('cors')).default;

            this.app = express();
            this.httpServer = createServer(this.app);
            this.io = new SocketIOServer(this.httpServer, {
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST']
                }
            });

            this.setupMiddleware(express, cors);
            this.setupRoutes();
            this.setupWebSocket();

            return new Promise((resolve, reject) => {
                this.httpServer.listen(config.port, () => {
                    this.isRunning = true;
                    console.log(`✅ Servidor local rodando na porta ${config.port}`);
                    resolve();
                });

                this.httpServer.on('error', (error: any) => {
                    console.error('❌ Erro ao iniciar servidor:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('❌ Falha ao carregar módulos de servidor:', error);
            throw new Error('Ambiente não suporta servidor local.');
        }
    }

    private setupMiddleware(express: any, cors: any): void {
        this.app.use(cors({ origin: '*' }));
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        this.app.get('/health', (req: any, res: any) => {
            res.json({
                status: 'ok',
                timestamp: Date.now(),
                peers: this.peers.size
            });
        });

        this.app.get('/peers', (req: any, res: any) => {
            res.json({ peers: Array.from(this.peers.values()) });
        });

        this.app.get('/', (req: any, res: any) => {
            res.send(`<h1>ExamePad Local Server</h1><p>Online: ${this.peers.size} peers</p>`);
        });
    }

    private setupWebSocket(): void {
        this.io.on('connection', (socket: any) => {
            socket.on('join-room', (data: any) => {
                socket.join(data.roomId);
                const peer: PeerInfo = {
                    id: data.peerId,
                    type: data.peerType,
                    name: data.peerName,
                    connectedAt: Date.now(),
                    lastSeen: Date.now()
                };
                this.peers.set(data.peerId, peer);
                socket.to(data.roomId).emit('peer-joined', peer);
            });

            socket.on('disconnect', () => {
                // Cleanup logic simplified for stub
            });
        });
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;

        if (this.io) this.io.close();
        if (this.httpServer) {
            return new Promise((resolve) => {
                this.httpServer.close(() => {
                    this.isRunning = false;
                    this.peers.clear();
                    resolve();
                });
            });
        }
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            peersCount: this.peers.size,
            uptime: 0,
            peers: Array.from(this.peers.values())
        };
    }
}

let serverInstance: LocalServerService | null = null;

export function getLocalServer(): LocalServerService {
    if (!serverInstance) {
        serverInstance = new LocalServerService();
    }
    return serverInstance;
}
