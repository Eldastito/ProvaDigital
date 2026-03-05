
import { MeshMessage, MeshPeer, MeshRole, MeshMessageType } from "../types";
import { supabase } from "./supabaseClient";

/**
 * Local Mesh Service — Supabase Realtime (Canal Primário)
 * 
 * Usa Supabase Realtime como ponte de sinalização entre dispositivos físicos.
 * BroadcastChannel como fallback para tabs no mesmo navegador.
 * 
 * COMPROVADO: Supabase Realtime foi o único mecanismo que conectou
 * tablets reais ao Centro de Comando com sucesso.
 */

class LocalMeshService {
    private channel: BroadcastChannel | null = null;
    private supabaseChannels: any[] = [];
    private peer: MeshPeer;
    private listeners: ((msg: MeshMessage) => void)[] = [];
    private peers: Map<string, MeshPeer> = new Map();
    private announceInterval: any = null;

    constructor() {
        this.peer = {
            id: 'unknown',
            name: 'Unknown Device',
            role: 'UNASSIGNED',
            isOnline: false,
            lastSeen: 0
        };
    }

    /**
     * Entrar na rede mesh
     * Conecta via Supabase Realtime (funciona entre dispositivos físicos)
     * + BroadcastChannel (funciona entre abas no mesmo navegador)
     */
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

        console.log(`[MESH] ${name} joining as ${role} (ID: ${id}). Tenant: ${tenantId || 'global'}`);

        // === CANAL 1: BroadcastChannel (Tab-to-Tab no mesmo navegador) ===
        try {
            this.channel = new BroadcastChannel('examepad_local_mesh');
            this.channel.onmessage = (event) => {
                this.handleIncomingMessage(event.data as MeshMessage);
            };
        } catch (e) {
            console.warn('[MESH] BroadcastChannel não disponível.');
        }

        // === CANAL 2: Supabase Realtime (Dispositivos Físicos) ===
        // Sala do Tenant
        const roomName = `mesh_room_${tenantId || 'global'}`;
        this.subscribeToRoom(roomName);

        // Sala Global (para tablets que ainda não sabem seu tenant)
        if (tenantId) {
            this.subscribeToRoom('mesh_room_global');
        }

        // Se for SERVER, também ouvir na sala global para "pescar" tablets novos
        if (role === 'SERVER' && tenantId) {
            console.log('[MESH] SERVER: Ouvindo sala global para tablets sem tenant.');
        }

        // Se for Tablet (UNASSIGNED), iniciar Discovery
        if (role === 'UNASSIGNED') {
            this.broadcast('DISCOVERY', { serialNumber: id });
        } else {
            this.announce();
        }

        // Heartbeat a cada 3 segundos
        if (this.announceInterval) clearInterval(this.announceInterval);
        this.announceInterval = setInterval(() => this.announce(), 3000);
    }

    /**
     * Inscrever-se em uma sala Supabase Realtime
     */
    private subscribeToRoom(roomName: string) {
        const ch = supabase.channel(roomName, {
            config: {
                broadcast: { self: false }
            }
        });

        ch.on('broadcast', { event: 'mesh_msg' }, (payload: any) => {
            this.handleIncomingMessage(payload.payload as MeshMessage);
        })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[MESH] ✅ Conectado ao Supabase Realtime: ${roomName}`);
                    // Disparar anúncio imediato para se tornar visível
                    this.announce();
                }
            });

        this.supabaseChannels.push(ch);
    }

    /**
     * Desconectar de tudo
     */
    public disconnect() {
        if (this.announceInterval) clearInterval(this.announceInterval);

        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }

        // Limpar todos os canais Supabase
        for (const ch of this.supabaseChannels) {
            try { ch.unsubscribe(); } catch (e) { /* ignore */ }
        }
        this.supabaseChannels = [];

        this.peer.isOnline = false;
        console.log(`[MESH] ${this.peer.name} disconnected.`);
    }

    /**
     * Obter peers conectados (vistos nos últimos 10 segundos)
     */
    public getPeers(): MeshPeer[] {
        const now = Date.now();
        return Array.from(this.peers.values()).filter(
            p => p.id !== this.peer.id && (now - p.lastSeen < 10000)
        );
    }

    /**
     * Registrar listener de mensagens
     */
    public onMessage(callback: (msg: MeshMessage) => void) {
        this.listeners.push(callback);
    }

    /**
     * Broadcast para todos os dispositivos (BroadcastChannel + Supabase)
     */
    public broadcast(type: MeshMessageType, payload: any) {
        const msg: MeshMessage = {
            type,
            sender: this.peer,
            payload,
            timestamp: Date.now()
        };

        // Canal 1: BroadcastChannel (local tabs)
        if (this.channel) {
            try { this.channel.postMessage(msg); } catch (e) { /* ignore */ }
        }

        // Canal 2: Supabase Realtime (dispositivos físicos)
        for (const ch of this.supabaseChannels) {
            try {
                ch.send({
                    type: 'broadcast',
                    event: 'mesh_msg',
                    payload: msg
                });
            } catch (e) { /* ignore */ }
        }
    }

    /**
     * Enviar mensagem para um peer específico
     */
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

        // Canal 2: Supabase Realtime
        for (const ch of this.supabaseChannels) {
            try {
                ch.send({
                    type: 'broadcast',
                    event: 'mesh_msg',
                    payload: msg
                });
            } catch (e) { /* ignore */ }
        }
    }

    /**
     * Anunciar presença na rede
     */
    private announce() {
        if (!this.peer.isOnline) return;
        this.broadcast('ANNOUNCE', {});
    }

    /**
     * Processar mensagem recebida
     */
    private handleIncomingMessage(msg: MeshMessage) {
        // Anti-Loop: ignorar mensagens próprias
        if (msg.sender.id === this.peer.id) return;

        // Atualizar lista de peers
        this.peers.set(msg.sender.id, { ...msg.sender, lastSeen: Date.now() });

        // Entregar mensagem se for para mim ou broadcast
        if (!msg.targetId || msg.targetId === this.peer.id) {
            this.listeners.forEach(cb => cb(msg));
        }
    }
}

export const meshService = new LocalMeshService();
