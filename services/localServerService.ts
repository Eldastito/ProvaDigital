/**
 * Local Server Service
 * 
 * Servidor HTTP local que roda no tablet roteador para:
 * - Servir página de status
 * - Gerenciar signaling WebRTC via Socket.io
 * - Fornecer API REST para peers
 * 
 * Sprint 2 - Fase 1/2
 */

import express, { Express, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import cors from 'cors';

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
 * 
 * Roda no tablet roteador e permite:
 * - Descoberta de peers via HTTP
 * - Signaling WebRTC via Socket.io
 * - Status da rede
 */
export class LocalServerService {
    private app: Express;
    private httpServer: HTTPServer;
    private io: SocketIOServer;
    private peers: Map<string, PeerInfo> = new Map();
    private isRunning: boolean = false;

    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new SocketIOServer(this.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    /**
     * Configurar middleware Express
     */
    private setupMiddleware(): void {
        // CORS
        this.app.use(cors({
            origin: '*'
        }));

        // JSON parser
        this.app.use(express.json());

        // Logging
        this.app.use((req, res, next) => {
            console.log(`[HTTP] ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Configurar rotas HTTP
     */
    private setupRoutes(): void {
        // Health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({
                status: 'ok',
                timestamp: Date.now(),
                peers: this.peers.size,
                uptime: process.uptime()
            });
        });

        // Lista de peers conectados
        this.app.get('/peers', (req: Request, res: Response) => {
            const peersList = Array.from(this.peers.values());
            res.json({
                count: peersList.length,
                peers: peersList
            });
        });

        // Informações de um peer específico
        this.app.get('/peers/:id', (req: Request, res: Response) => {
            const peer = this.peers.get(req.params.id);

            if (!peer) {
                res.status(404).json({ error: 'Peer não encontrado' });
                return;
            }

            res.json(peer);
        });

        // Registrar novo peer (alternativa ao WebSocket)
        this.app.post('/peers/register', (req: Request, res: Response) => {
            const { id, type, name } = req.body;

            if (!id || !type || !name) {
                res.status(400).json({ error: 'Campos obrigatórios: id, type, name' });
                return;
            }

            const peer: PeerInfo = {
                id,
                type,
                name,
                connectedAt: Date.now(),
                lastSeen: Date.now()
            };

            this.peers.set(id, peer);

            res.json({ success: true, peer });
        });

        // Página de status (HTML)
        this.app.get('/', (req: Request, res: Response) => {
            const html = this.generateStatusPage();
            res.send(html);
        });

        // Fallback 404
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({ error: 'Endpoint não encontrado' });
        });
    }

    /**
     * Configurar WebSocket (Socket.io)
     */
    private setupWebSocket(): void {
        this.io.on('connection', (socket) => {
            console.log(`[WS] Cliente conectado: ${socket.id}`);

            // Join room (sala do evento)
            socket.on('join-room', (data: { roomId: string; peerId: string; peerType: string; peerName: string }) => {
                console.log(`[WS] ${data.peerName} entrando na sala: ${data.roomId}`);

                socket.join(data.roomId);

                // Adicionar aos peers
                const peer: PeerInfo = {
                    id: data.peerId,
                    type: data.peerType as any,
                    name: data.peerName,
                    connectedAt: Date.now(),
                    lastSeen: Date.now()
                };

                this.peers.set(data.peerId, peer);

                // Notificar outros peers
                socket.to(data.roomId).emit('peer-joined', peer);

                // Enviar lista de peers existentes
                const existingPeers = Array.from(this.peers.values())
                    .filter(p => p.id !== data.peerId);

                socket.emit('existing-peers', existingPeers);
            });

            // WebRTC Signaling: Offer
            socket.on('offer', (data: { target: string; offer: any }) => {
                console.log(`[WS] Offer de ${socket.id} para ${data.target}`);
                this.io.to(data.target).emit('offer', {
                    from: socket.id,
                    offer: data.offer
                });
            });

            // WebRTC Signaling: Answer
            socket.on('answer', (data: { target: string; answer: any }) => {
                console.log(`[WS] Answer de ${socket.id} para ${data.target}`);
                this.io.to(data.target).emit('answer', {
                    from: socket.id,
                    answer: data.answer
                });
            });

            // WebRTC Signaling: ICE Candidate
            socket.on('ice-candidate', (data: { target: string; candidate: any }) => {
                this.io.to(data.target).emit('ice-candidate', {
                    from: socket.id,
                    candidate: data.candidate
                });
            });

            // Heartbeat
            socket.on('heartbeat', (data: { peerId: string }) => {
                const peer = this.peers.get(data.peerId);
                if (peer) {
                    peer.lastSeen = Date.now();
                    this.peers.set(data.peerId, peer);
                }
            });

            // Desconexão
            socket.on('disconnect', () => {
                console.log(`[WS] Cliente desconectado: ${socket.id}`);

                // Remover peer (buscar por socket.id - simplificado)
                // Em produção, usar mapeamento socketId -> peerId
                this.peers.forEach((peer, peerId) => {
                    if (Date.now() - peer.lastSeen > 30000) {
                        this.peers.delete(peerId);
                        socket.broadcast.emit('peer-left', peerId);
                    }
                });
            });
        });

        // Limpeza de peers inativos (a cada 30s)
        setInterval(() => {
            const now = Date.now();
            this.peers.forEach((peer, peerId) => {
                if (now - peer.lastSeen > 60000) { // 60s sem heartbeat
                    console.log(`[CLEANUP] Removendo peer inativo: ${peerId}`);
                    this.peers.delete(peerId);
                    this.io.emit('peer-left', peerId);
                }
            });
        }, 30000);
    }

    /**
     * Iniciar servidor
     */
    async start(config: ServerConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.httpServer.listen(config.port, () => {
                    this.isRunning = true;
                    console.log(`✅ Servidor local rodando na porta ${config.port}`);
                    console.log(`   HTTP: http://192.168.43.1:${config.port}`);
                    console.log(`   WebSocket: ws://192.168.43.1:${config.port}`);
                    resolve();
                });

                this.httpServer.on('error', (error) => {
                    console.error('❌ Erro ao iniciar servidor:', error);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Parar servidor
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.isRunning) {
                resolve();
                return;
            }

            this.io.close();
            this.httpServer.close(() => {
                this.isRunning = false;
                this.peers.clear();
                console.log('⏹️ Servidor local parado');
                resolve();
            });
        });
    }

    /**
     * Broadcast de mensagem para todos os peers
     */
    broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }

    /**
     * Enviar mensagem para peer específico
     */
    sendToPeer(peerId: string, event: string, data: any): void {
        this.io.to(peerId).emit(event, data);
    }

    /**
     * Gerar página HTML de status
     */
    private generateStatusPage(): string {
        const peersList = Array.from(this.peers.values());

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ExamePad - Servidor Local</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
    }
    h1 { font-size: 2em; margin-bottom: 10px; }
    h2 { font-size: 1.3em; margin: 30px 0 15px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px; }
    .status { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
    .stat {
      flex: 1;
      min-width: 150px;
      background: rgba(255,255,255,0.2);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .stat-value { font-size: 2.5em; font-weight: bold; }
    .stat-label { font-size: 0.9em; opacity: 0.8; margin-top: 5px; }
    .peer {
      background: rgba(255,255,255,0.15);
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .peer-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
    .peer-info { font-size: 0.9em; opacity: 0.8; margin-top: 5px; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      background: rgba(255,255,255,0.3);
    }
    .badge-professor { background: #10b981; }
    .badge-student { background: #3b82f6; }
    .badge-coordinator { background: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌐 ExamePad - Servidor Local</h1>
    <p>Tablet Roteador ativo e funcionando</p>
    
    <div class="status">
      <div class="stat">
        <div class="stat-value">${peersList.length}</div>
        <div class="stat-label">Dispositivos Conectados</div>
      </div>
      <div class="stat">
        <div class="stat-value">${peersList.filter(p => p.type === 'STUDENT').length}</div>
        <div class="stat-label">Alunos</div>
      </div>
      <div class="stat">
        <div class="stat-value">${Math.floor(process.uptime() / 60)}m</div>
        <div class="stat-label">Tempo Ativo</div>
      </div>
    </div>
    
    <h2>Dispositivos Conectados</h2>
    ${peersList.length === 0 ? '<p>Nenhum dispositivo conectado ainda.</p>' : ''}
    ${peersList.map(peer => `
      <div class="peer">
        <div class="peer-header">
          <span>${peer.name}</span>
          <span class="badge badge-${peer.type.toLowerCase()}">${peer.type}</span>
        </div>
        <div class="peer-info">
          ID: ${peer.id.slice(0, 8)}... • Conectado há ${Math.floor((Date.now() - peer.connectedAt) / 1000)}s
        </div>
      </div>
    `).join('')} 
  </div>
  
  <script>
    // Auto-refresh a cada 5s
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>
    `.trim();
    }

    /**
     * Obter estatísticas do servidor
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            peersCount: this.peers.size,
            uptime: process.uptime(),
            peers: Array.from(this.peers.values())
        };
    }
}

// Export singleton
let serverInstance: LocalServerService | null = null;

export function getLocalServer(): LocalServerService {
    if (!serverInstance) {
        serverInstance = new LocalServerService();
    }
    return serverInstance;
}
