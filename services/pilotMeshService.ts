
/**
 * PilotMeshService - Gestor de Identidade e Sessões Offline (Mesh)
 * Simula a segurança baseada em Android Keystore e Peer-to-Peer Trust.
 */
export interface MeshDevice {
    id: string; // Device Unique ID
    publicKey: string;
    trusted: boolean;
}

export interface MeshSession {
    session_id: string;
    peer_id: string;
    established_at: string;
    expires_at: string;
    session_key: string; // Chave secreta de sessão (Simulada AES-256)
    next_sequence: number; // Contador de mensagens anti-replay
}

class PilotMeshService {
    private trustedDevices: Map<string, MeshDevice> = new Map();
    private activeSessions: Map<string, MeshSession> = new Map();
    private usedNonces: Set<string> = new Set();

    /**
     * Registra um dispositivo como confiável (Seed inicial)
     */
    registerTrustedDevice(id: string, publicKey: string): void {
        this.trustedDevices.set(id, { id, publicKey, trusted: true });
        console.log(`[PILOT_MESH][IDENTITY] Device ${id} registered as TRUSTED peer.`);
    }

    /**
     * Gera um desafio (Nonce) para prevenir Replay
     */
    generateChallenge(): string {
        const nonce = `nonce_${Math.random().toString(36).substring(7).toUpperCase()}`;
        return nonce;
    }

    /**
     * Valida um desafio assinado e estabelece sessão (Triple Handshake)
     */
    establishSession(peerId: string, challenge: string, signature: string): MeshSession {
        const device = this.trustedDevices.get(peerId);
        
        if (!device) throw new Error(`[PILOT_MESH][ERROR] Peer ${peerId} is not trusted.`);
        if (this.usedNonces.has(challenge)) throw new Error(`[PILOT_MESH][ERROR] Replay detected! Challenge ${challenge} already used.`);

        // Simulação de verificação de assinatura: 
        // Em um sistema real, usaríamos crypto.verify com a publicKey do device.
        if (signature !== `${challenge}_SIGNED_BY_${peerId}`) {
            throw new Error(`[PILOT_MESH][ERROR] Invalid signature from peer ${peerId}.`);
        }

        this.usedNonces.add(challenge);

        const session: MeshSession = {
            session_id: `mesh_sess_${Math.random().toString(36).substring(7)}`,
            peer_id: peerId,
            established_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3600000).toISOString(), // Expira em 1h
            session_key: `sk_${Math.random().toString(36).substring(7).toUpperCase()}`,
            next_sequence: 1
        };

        this.activeSessions.set(session.session_id, session);
        console.log(`[PILOT_MESH][AUTH] Session established with ${peerId}: ${session.session_id}`);
        
        return session;
    }

    getActiveSession(sessionId: string): MeshSession | undefined {
        return this.activeSessions.get(sessionId);
    }
}

export const pilotMeshService = new PilotMeshService();
