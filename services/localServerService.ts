/**
 * Local Server Service
 * 
 * Servidor HTTP local que roda no tablet roteador para:
 * - Servir página de status
 * - Gerenciar signaling WebRTC via Socket.io
 * - Fornecer API REST para peers
 * 
 * DESIGN NOTE: Este arquivo é projetado para ser "Safe-to-Bundle" no navegador.
 * Os módulos de servidor (express, http, socket.io) são importados dinamicamente
 * apenas quando o servidor é iniciado, o que não deve ocorrer em um ambiente web SaaS.
 */

import { PeerInfo, SignedMeshToken } from './localServerService.types';

export class LocalServerService {
    private app: any = null;
    private httpServer: any = null;
    private io: any = null;
    private peers: Map<string, PeerInfo> = new Map();
    private isRunning: boolean = false;

    // F3A: Cache de JTI para anti-replay (RAM-only)
    private static jtiCache: Map<string, number> = new Map();
    private static JTI_TTL = 10 * 60 * 1000; // 10 minutos
    private static MAX_JTI_CACHE_SIZE = 5000;

    constructor() {}

    /**
     * Iniciar servidor
     */
    async start(config: { port: number }): Promise<void> {
        if (this.isRunning) return;

        try {
            if (typeof window !== 'undefined' && !(window as any).isNativeApp) {
                console.warn('⚠️ LocalServerService: Servidor local não é suportado no navegador padrão.');
                return;
            }

            const express = (await import(/* @vite-ignore */ 'express')).default;
            const { createServer } = await import(/* @vite-ignore */ 'http');
            const { Server: SocketIOServer } = await import(/* @vite-ignore */ 'socket.io');
            const cors = (await import(/* @vite-ignore */ 'cors')).default;

            this.app = express();
            this.httpServer = createServer(this.app);
            this.io = new SocketIOServer(this.httpServer, {
                cors: { origin: '*', methods: ['GET', 'POST'] }
            });

            this.app.use(cors({ origin: '*' }));
            this.app.use(express.json());

            this.setupRoutes();
            this.setupWebSocket();

            return new Promise((resolve, reject) => {
                this.httpServer.listen(config.port, () => {
                    this.isRunning = true;
                    console.log(`✅ Servidor local rodando na porta ${config.port}`);
                    resolve();
                });
                this.httpServer.on('error', reject);
            });
        } catch (error) {
            console.error('❌ Falha ao carregar módulos de servidor:', error);
            throw new Error('Ambiente não suporta servidor local.');
        }
    }

    private setupRoutes(): void {
        const auth = this.authMiddleware.bind(this);

        this.app.get('/health', auth(['PROFESSOR', 'COORDINATOR']), (req: any, res: any) => {
            res.json({ status: 'ok', timestamp: Date.now(), peers: this.peers.size });
        });

        this.app.get('/peers', auth(['PROFESSOR', 'COORDINATOR']), (req: any, res: any) => {
            res.json({ peers: Array.from(this.peers.values()) });
        });

        this.app.get('/', (req: any, res: any) => {
            res.send(`<h1>ExamePad Local Server</h1><p>Online: ${this.peers.size} peers</p>`);
        });

        // 1. Download Exam (Student -> Teacher) - Apenas STUDENT ou PROFESSOR
        this.app.get('/sync/exam/:id', auth(['STUDENT', 'PROFESSOR']), async (req: any, res: any) => {
            try {
                const examId = req.params.id;
                const { useAppStore } = await import('../store/useAppStore');
                const store = useAppStore.getState();
                const exam = store.exams.find((e: any) => e.id === examId);

                if (!exam) return res.status(404).json({ error: 'Exam not found' });

                let fullItems: any[] = [];
                if (store.items && store.items.length > 0) {
                    fullItems = store.items.filter((i: any) => 
                        (exam.items_config || []).some((ic: any) => (typeof ic === 'string' ? ic : ic.itemId) === i.id)
                    );
                }

                const sanitizedItems = fullItems.map((item: any) => ({
                    ...item,
                    alternatives: item.alternatives.map((alt: any) => ({ id: alt.id, text: alt.text })),
                    correctAnswerJustification: undefined
                }));

                res.json({ exam, items: sanitizedItems });
            } catch (e) {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // 2. Submit Answers (Student -> Teacher) - Apenas STUDENT
        this.app.post('/sync/submit', auth(['STUDENT']), async (req: any, res: any) => {
            try {
                const submission = req.body;
                if (!submission?.studentId || !submission?.examId) {
                    return res.status(400).json({ error: 'Invalid submission data' });
                }

                const { offlineConsolidationService } = await import('./offlineConsolidationService');
                await offlineConsolidationService.saveSubmission({
                    studentId: submission.studentId,
                    studentName: submission.studentName || 'Unknown',
                    examId: submission.examId,
                    eventId: submission.eventId || submission.examId,
                    encryptedAnswers: submission.encryptedAnswers,
                    scannedAt: new Date().toISOString(),
                    metadata: { ...submission.metadata, viaMesh: true, peerIp: req.ip }
                });

                res.json({ success: true, receipt: Date.now() });
            } catch (e) {
                res.status(500).json({ error: 'Failed to save submission' });
            }
        });
    }

    private async validateMeshToken(rawToken: string, allowedRoles?: string[]): Promise<{ isValid: boolean; payload?: SignedMeshToken; error?: string }> {
        try {
            const parts = rawToken.split('.');
            if (parts.length !== 2) return { isValid: false, error: 'Invalid token format' };

            const payloadJson = atob(parts[0]);
            const payload: SignedMeshToken = JSON.parse(payloadJson);

            if (!payload.jti || !payload.tabletId) return { isValid: false, error: 'Incomplete token (F3A)' };

            if (LocalServerService.jtiCache.has(payload.jti)) {
                console.warn(`⚠️ REPLAY ATTACK DETECTED: ${payload.jti} from ${payload.tabletId}`);
                return { isValid: false, error: 'Token already used (Replay)' };
            }

            // A raiz de confiança é o hmacSecret do provisionamento
            const { TabletProvisioningService } = await import('./tabletProvisioningService');
            const tokens = await TabletProvisioningService.getSecurityTokens();
            
            // SECURITY: No fallback allowed in operational mode. Missing secret = failed trust.
            if (!tokens?.hmacSecret) {
                const err = `SEC-ERR-001: Missing hmacSecret in operational mode (Peer: ${payload.tabletId})`;
                console.error(`❌ ${err}`);
                return { isValid: false, error: 'Unauthorized: Security infrastructure not initialized' };
            }
            const secret = tokens.hmacSecret;

            const { E2EEncryptionService } = await import('./security/e2eEncryptionService');
            const isSignatureValid = await E2EEncryptionService.verifySignature(payloadJson, parts[1], secret);

            if (!isSignatureValid) {
                console.error(`❌ INVALID SIGNATURE: Token corrupted or spoofed from ${payload.tabletId}`);
                return { isValid: false, error: 'Invalid signature' };
            }

            const now = Date.now();
            if (now - payload.timestamp > LocalServerService.JTI_TTL || now - payload.timestamp < -60000) {
                return { isValid: false, error: 'Token expired or clock drift' };
            }

            if (allowedRoles && !allowedRoles.includes(payload.role)) {
                return { isValid: false, error: `Forbidden role: ${payload.role}` };
            }

            this.addToJtiCache(payload.jti);
            return { isValid: true, payload };
        } catch (error) {
            return { isValid: false, error: 'Token parsing failed' };
        }
    }

    private authMiddleware(allowedRoles?: string[]) {
        return async (req: any, res: any, next: any) => {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

            const rawToken = authHeader.split(' ')[1];
            const result = await this.validateMeshToken(rawToken, allowedRoles);

            if (!result.isValid) {
                return res.status(403).json({ error: result.error });
            }

            req.meshAuth = result.payload;
            next();
        };
    }

    private addToJtiCache(jti: string): void {
        const now = Date.now();
        if (LocalServerService.jtiCache.size >= LocalServerService.MAX_JTI_CACHE_SIZE) {
            for (const [key, exp] of LocalServerService.jtiCache.entries()) {
                if (exp < now) LocalServerService.jtiCache.delete(key);
            }
            if (LocalServerService.jtiCache.size >= LocalServerService.MAX_JTI_CACHE_SIZE) {
                const first = LocalServerService.jtiCache.keys().next().value;
                LocalServerService.jtiCache.delete(first!);
            }
        }
        LocalServerService.jtiCache.set(jti, now + LocalServerService.JTI_TTL);
    }

    private setupWebSocket(): void {
        this.io.on('connection', (socket: any) => {
            let currentPeerId: string | null = null;
            
            socket.on('join-room', (data: any) => {
                socket.join(data.roomId);
                currentPeerId = data.peerId;
                const peer: PeerInfo = {
                    id: data.peerId,
                    type: data.peerType,
                    name: data.peerName,
                    connectedAt: Date.now(),
                    lastSeen: Date.now()
                };
                this.peers.set(data.peerId, peer);
                socket.to(data.roomId).emit('peer-joined', peer);
                const existing = Array.from(this.peers.values()).filter(p => p.id !== data.peerId);
                socket.emit('existing-peers', existing);
            });

            // F3A: Endurecimento do broadcast de AUTOSAVE com Anti-Replay e RBAC
            socket.on('AUTOSAVE', async (envelope: any) => {
                const token = envelope?.token; // SignedMeshToken esperado
                if (!token) {
                    console.warn('⚠️ Rejected anonymous AUTOSAVE packet');
                    return;
                }

                const result = await this.validateMeshToken(token, ['STUDENT']);
                if (!result.isValid) {
                    console.warn(`🛑 AUTOSAVE REJECTED: ${result.error}`);
                    return;
                }

                // Payload verificado, pode fazer broadcast para o professor
                console.log(`📡 Sealed AUTOSAVE received from ${result.payload?.tabletId}`);
                socket.broadcast.emit('AUTOSAVE', envelope);
            });

            socket.on('mesh-broadcast', (msg: any) => socket.broadcast.emit('mesh-broadcast', msg));

            socket.on('disconnect', () => {
                if (currentPeerId) this.peers.delete(currentPeerId);
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
            peers: Array.from(this.peers.values())
        };
    }
}

let serverInstance: LocalServerService | null = null;
export function getLocalServer(): LocalServerService {
    if (!serverInstance) serverInstance = new LocalServerService();
    return serverInstance;
}
