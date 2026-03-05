
import { MeshMessage, MeshPeer, MeshRole, MeshMessageType } from "../types";
import { supabase } from "./supabaseClient";

// This service implements a Hybrid Local/Cloud Mesh Network.
// 1. BroadcastChannel: For communication between tabs on the same machine/browser.
// 2. Supabase Realtime: For communication between different physical devices (Tablets <-> Computer).

class LocalMeshService {
    private channel: BroadcastChannel | null = null;
    private supabaseChannel: any = null;
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

    // Initialize the device on the network
    public join(id: string, name: string, role: MeshRole, tenantId?: string) {
        if (this.channel) this.channel.close();
        if (this.supabaseChannel) {
            this.supabaseChannel.unsubscribe();
        }

        // 1. Local Browser Mesh (Tab-to-Tab)
        this.channel = new BroadcastChannel('examepad_local_mesh');

        this.peer = {
            id,
            name,
            role,
            isOnline: true,
            lastSeen: Date.now()
        };

        console.log(`[MESH] ${name} joined as ${role} (ID: ${id}). Tenant: ${tenantId || 'global'}`);

        this.channel.onmessage = (event) => {
            const msg = event.data as MeshMessage;
            this.handleIncomingMessage(msg);
        };

        // 2. Physical Network Bridge (Cloud Signaling)
        // Usamos o tenantId para criar uma sala virtual onde dispositivos reais se encontram.
        const roomName = `mesh_room_${tenantId || 'global'}`;
        this.supabaseChannel = supabase.channel(roomName, {
            config: {
                broadcast: { self: false }
            }
        });

        this.supabaseChannel
            .on('broadcast', { event: 'mesh_msg' }, (payload: any) => {
                this.handleIncomingMessage(payload.payload as MeshMessage);
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[MESH] Connected to Physical Discovery Bridge: ${roomName}`);
                    // Trigger announcement immediately once subscribed
                    this.announce();
                }
            });

        // 3. Global Discovery Bridge (Apenas para SERVER)
        // O servidor ouve na sala 'global' para "pescar" tablets novos que ainda não sabem seu tenant.
        if (role === 'SERVER' && tenantId) {
            const globalChannel = supabase.channel('mesh_room_global', {
                config: { broadcast: { self: false } }
            });
            globalChannel
                .on('broadcast', { event: 'mesh_msg' }, (payload: any) => {
                    this.handleIncomingMessage(payload.payload as MeshMessage);
                })
                .subscribe();
        }

        // Se for Tablet (UNASSIGNED), inicia Discovery
        if (role === 'UNASSIGNED') {
            this.broadcast('DISCOVERY', { serialNumber: id });
        } else {
            this.announce();
        }

        if (this.announceInterval) clearInterval(this.announceInterval);
        this.announceInterval = setInterval(() => this.announce(), 3000);
    }

    // "Logical Kill Switch" - Disconnects from the mesh entirely
    public disconnect() {
        if (this.announceInterval) clearInterval(this.announceInterval);
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        if (this.supabaseChannel) {
            this.supabaseChannel.unsubscribe();
            this.supabaseChannel = null;
        }
        this.peer.isOnline = false;
        console.log(`[MESH] ${this.peer.name} disconnected (Kill Switch).`);
    }

    public getPeers(): MeshPeer[] {
        const now = Date.now();
        // Return peers seen in the last 10 seconds
        return Array.from(this.peers.values()).filter(p => p.id !== this.peer.id && (now - p.lastSeen < 10000));
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

        // Send to Local Tabs
        if (this.channel) {
            this.channel.postMessage(msg);
        }

        // Send to Physical Network (Cloud Bridge)
        if (this.supabaseChannel) {
            this.supabaseChannel.send({
                type: 'broadcast',
                event: 'mesh_msg',
                payload: msg
            });
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

        // Local
        if (this.channel) {
            this.channel.postMessage(msg);
        }

        // Cloud
        if (this.supabaseChannel) {
            this.supabaseChannel.send({
                type: 'broadcast',
                event: 'mesh_msg',
                payload: msg
            });
        }
    }

    private announce() {
        if (!this.peer.isOnline || (!this.channel && !this.supabaseChannel)) return;
        this.broadcast('ANNOUNCE', {});
    }

    private handleIncomingMessage(msg: MeshMessage) {
        // Anti-Loop/Self Check
        if (msg.sender.id === this.peer.id) return;

        // Anti-Dup Rule: Se eu receber um anúncio com meu próprio ID vindo de outro
        if (msg.sender.id === this.peer.id && msg.timestamp !== this.peer.lastSeen && this.peer.isOnline) {
            console.error(`[MESH] CONFLITO DE IDENTIDADE DETECTADO: ${this.peer.id}`);
            this.broadcast('DISCOVERY_CONFLICT', { conflictedId: this.peer.id });
            return;
        }

        // Update peer list
        this.peers.set(msg.sender.id, { ...msg.sender, lastSeen: Date.now() });

        // Filter messages meant for me or broadcast
        if (!msg.targetId || msg.targetId === this.peer.id) {
            this.listeners.forEach(cb => cb(msg));
        }
    }
}

export const meshService = new LocalMeshService();
