
import { MeshMessage, MeshPeer, MeshRole, MeshMessageType } from "../types";
import { supabase } from "./supabaseClient";
import { io, Socket } from "socket.io-client";
import { Capacitor } from '@capacitor/core';

/**
 * Local Mesh Service — Hybrid Realtime (Supabase + Socket.io Gateway)
 * 
 * Canal 1: BroadcastChannel (Tabs no mesmo browser)
 * Canal 2: Supabase Realtime (Internet/Cloud fallback)
 * Canal 3: Socket.io Gateway (Local Mesh / Offline prioritário)
 */

class LocalMeshService {
    private channel: BroadcastChannel | null = null;
    private supabaseChannels: any[] = [];
    private socket: Socket | null = null;
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
     */
    public join(id: string, name: string, role: MeshRole, tenantId?: string) {
        this.disconnect();

        this.peer = {
            id,
            name,
            role,
            isOnline: true,
            lastSeen: Date.now()
        };

        console.log(`[MESH] ${name} joining as ${role} (ID: ${id}).`);

        // === CANAL 1: BroadcastChannel ===
        try {
            this.channel = new BroadcastChannel('examepad_local_mesh');
            this.channel.onmessage = (event) => {
                this.handleIncomingMessage(event.data as MeshMessage);
            };
        } catch (e) {
            console.warn('[MESH] BroadcastChannel não disponível.');
        }

        // === CANAL 2: Supabase Realtime ===
        const roomName = `mesh_room_${tenantId || 'global'}`;
        this.subscribeToRoom(roomName);
        if (tenantId) this.subscribeToRoom('mesh_room_global');

        // === CANAL 3: Socket.io Gateway (Prioritário para Local) ===
        this.connectToGateway(tenantId);

        // Se for Tablet (UNASSIGNED), iniciar Discovery
        if (role === 'UNASSIGNED') {
            this.broadcast('DISCOVERY', { serialNumber: id });
        } else {
            this.announce();
        }

        if (this.announceInterval) clearInterval(this.announceInterval);
        this.announceInterval = setInterval(() => this.announce(), 3000);
    }

    /**
     * Conectar ao Gateway de Sinalização Local (Socket.io)
     */
    private connectToGateway(tenantId?: string) {
        try {
            // No emulador Android, 10.0.2.2 aponta para o host. No browser, localhost.
            const isAndroid = Capacitor.getPlatform() === 'android';
            const gatewayUrl = isAndroid ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

            console.log(`[MESH] Tentando conectar ao Gateway: ${gatewayUrl}`);

            this.socket = io(gatewayUrl, {
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log(`[MESH] ✅ Conectado ao Gateway Local (${gatewayUrl})`);
                this.socket?.emit('join-room', {
                    roomId: `mesh_room_${tenantId || 'global'}`,
                    peerId: this.peer.id,
                    peerName: this.peer.name,
                    peerType: this.peer.role
                });
                this.announce();
            });

            this.socket.on('mesh-broadcast', (msg: MeshMessage) => {
                this.handleIncomingMessage(msg);
            });

            this.socket.on('disconnect', () => {
                console.warn('[MESH] ❌ Desconectado do Gateway Local.');
            });

            this.socket.on('connect_error', () => {
                // Silencioso para não poluir console se o gateway não estiver rodando
            });

        } catch (err) {
            console.error('[MESH] Erro ao configurar Socket.io:', err);
        }
    }

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
                    this.announce();
                }
            });

        this.supabaseChannels.push(ch);
    }

    public disconnect() {
        if (this.announceInterval) clearInterval(this.announceInterval);

        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        for (const ch of this.supabaseChannels) {
            try { ch.unsubscribe(); } catch (e) { /* ignore */ }
        }
        this.supabaseChannels = [];
        this.listeners = [];

        this.peer.isOnline = false;
        console.log(`[MESH] 🛑 ${this.peer.name} desconectado.`);
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

        // Canal 1: BroadcastChannel
        if (this.channel) {
            try { this.channel.postMessage(msg); } catch (e) { /* ignore */ }
        }

        // Canal 2: Socket.io (Prioritário)
        if (this.socket?.connected) {
            this.socket.emit('mesh-broadcast', msg);
        }

        // Canal 3: Supabase Realtime
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

    public sendTo(targetId: string, type: MeshMessageType, payload: any) {
        const msg: MeshMessage = {
            type,
            sender: this.peer,
            targetId,
            payload,
            timestamp: Date.now()
        };

        if (this.channel) {
            try { this.channel.postMessage(msg); } catch (e) { /* ignore */ }
        }

        if (this.socket?.connected) {
            this.socket.emit('mesh-broadcast', msg);
        }

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

    private announce() {
        if (!this.peer.isOnline) return;
        this.broadcast('ANNOUNCE', {});
    }

    private handleIncomingMessage(msg: MeshMessage) {
        if (msg.sender.id === this.peer.id) return;
        this.peers.set(msg.sender.id, { ...msg.sender, lastSeen: Date.now() });
        if (!msg.targetId || msg.targetId === this.peer.id) {
            this.listeners.forEach(cb => cb(msg));
        }
    }
}

export const meshService = new LocalMeshService();
