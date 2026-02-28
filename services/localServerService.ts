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
            const express = (await import(/* @vite-ignore */ 'express')).default;
            const { createServer } = await import(/* @vite-ignore */ 'http');
            const { Server: SocketIOServer } = await import(/* @vite-ignore */ 'socket.io');
            const cors = (await import(/* @vite-ignore */ 'cors')).default;

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

        // 🛡️ Middleware de Segurança para Rotas Sink/Mesh
        const authMiddleware = (req: any, res: any, next: any) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Acesso Negado: Token não fornecido.' });
            }
            const token = authHeader.split(' ')[1];
            if (!token || token.length < 10) { // Validação básica de tamanho (ex: eventId ou signed token)
                return res.status(403).json({ error: 'Acesso Negado: Token inválido.' });
            }
            next();
        };

        // --- MESH SYNC ENDPOINTS (PHASE 7) ---

        // 1. Download Exam (Student -> Teacher)
        this.app.get('/sync/exam/:id', authMiddleware, async (req: any, res: any) => {
            try {
                const examId = req.params.id;
                // Import Dynamically to avoid circular dependencies if needed, or just standard import if safe
                // We assume useAppStore is available in the global scope or module system
                const { useAppStore } = await import('../store/useAppStore');
                const store = useAppStore.getState();

                const exam = store.exams.find((e: any) => e.id === examId);

                if (!exam) {
                    return res.status(404).json({ error: 'Exam not found in teacher cache' });
                }

                // Hydrate items
                // The exam object in store has items as ExamItemConfig[], so we need to fetch full Item objects from global store
                let fullItems: any[] = [];

                if (store.items && store.items.length > 0) {
                    fullItems = store.items.filter((i: any) =>
                        (exam.items_config || []).some((ic: any) =>
                            (typeof ic === 'string' ? ic : ic.itemId) === i.id
                        )
                    );
                }

                // 🛡️ SECURITY HARDENING (Requested by User)
                // Remove sensitive fields (answers) before sending to student device via Mesh
                const sanitizedItems = fullItems.map((item: any) => ({
                    ...item,
                    alternatives: item.alternatives.map((alt: any) => ({
                        id: alt.id,
                        text: alt.text
                        // isCorrect removed
                    })),
                    correctAnswerJustification: undefined, // removed
                    isPublic: undefined,
                    ownerId: undefined
                }));

                res.json({
                    exam,
                    items: sanitizedItems
                });
            } catch (e) {
                console.error("Error serving exam:", e);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // 2. Submit Answers (Student -> Teacher)
        this.app.post('/sync/submit', authMiddleware, async (req: any, res: any) => {
            try {
                const submission = req.body; // Expects OfflineSubmission shape

                if (!submission || !submission.studentId || !submission.examId) {
                    return res.status(400).json({ error: 'Invalid submission data' });
                }

                const { offlineConsolidationService } = await import('./offlineConsolidationService');

                // Map to OfflineSubmission interface
                // We assume the student sends a compatible payload
                // Force eventId = examId if not present (simplified for now)
                const payload = {
                    studentId: submission.studentId,
                    studentName: submission.studentName || 'Unknown',
                    examId: submission.examId,
                    eventId: submission.eventId || submission.examId,
                    encryptedAnswers: submission.encryptedAnswers, // Critical
                    scannedAt: new Date().toISOString(),
                    metadata: {
                        ...submission.metadata,
                        viaMesh: true,
                        peerIp: req.ip
                    }
                };

                await offlineConsolidationService.saveSubmission(payload);

                console.log(`📥 Mesh Submission Received: ${submission.studentId} for ${submission.examId}`);

                res.json({ success: true, receipt: Date.now() });

            } catch (e) {
                console.error("Error receiving submission:", e);
                res.status(500).json({ error: 'Failed to save submission' });
            }
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
