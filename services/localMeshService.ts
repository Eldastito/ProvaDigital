
import { MeshMessage, MeshPeer, MeshRole, MeshMessageType } from "../types";

// This service simulates a Local Wi-Fi Network using the BroadcastChannel API.
// This allows different browser tabs (simulating different tablets) to communicate.

class LocalMeshService {
    private channel: BroadcastChannel | null = null;
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
    public join(id: string, name: string, role: MeshRole) {
        if (this.channel) this.channel.close();
        
        this.channel = new BroadcastChannel('examepad_local_mesh');
        this.peer = {
            id,
            name,
            role,
            isOnline: true,
            lastSeen: Date.now()
        };
        
        console.log(`[MESH] ${name} joined as ${role}`);

        this.channel.onmessage = (event) => {
            const msg = event.data as MeshMessage;
            this.handleIncomingMessage(msg);
        };

        this.announce();
        if (this.announceInterval) clearInterval(this.announceInterval);
        this.announceInterval = setInterval(() => this.announce(), 3000); // Faster heartbeat for demo
    }

    // "Logical Kill Switch" - Disconnects from the mesh entirely
    public disconnect() {
        if (this.announceInterval) clearInterval(this.announceInterval);
        if (this.channel) {
            this.channel.close();
            this.channel = null;
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
        if (!this.channel) return;
        const msg: MeshMessage = {
            type,
            sender: this.peer,
            payload,
            timestamp: Date.now()
        };
        this.channel.postMessage(msg);
    }

    // REMOVED as unused
    // public sendTo(targetId: string, type: MeshMessageType, payload: any) {
    //     if (!this.channel) return;
    //     const msg: MeshMessage = {
    //         type,
    //         sender: this.peer,
    //         targetId,
    //         payload,
    //         timestamp: Date.now()
    //     };
    //     this.channel.postMessage(msg);
    // }

    private announce() {
        if (!this.peer.isOnline || !this.channel) return;
        this.broadcast('ANNOUNCE', {});
    }

    private handleIncomingMessage(msg: MeshMessage) {
        // Update peer list
        this.peers.set(msg.sender.id, { ...msg.sender, lastSeen: Date.now() });

        // Filter messages meant for me or broadcast
        if (!msg.targetId || msg.targetId === this.peer.id) {
            this.listeners.forEach(cb => cb(msg));
        }
    }
}

export const meshService = new LocalMeshService();
