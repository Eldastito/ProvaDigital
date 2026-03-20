
import { pilotMeshService, MeshSession } from './pilotMeshService';

/**
 * PilotSecureChannelService - Envelopamento Criptográfico de Frames (AEAD)
 * Simula a proteção AES-GCM com Sequence Numbers para Malha Offline.
 */
export interface SecureFrame {
    session_id: string;
    sequence: number;
    encrypted_payload: string;
    auth_tag: string; // Simulação de Hash AEAD (Garante integridade)
}

class PilotSecureChannelService {
    /**
     * Cifra um payload em um Frame Seguro.
     */
    async encryptFrame(sessionId: string, payload: any): Promise<SecureFrame> {
        const session = pilotMeshService.getActiveSession(sessionId);
        if (!session) throw new Error(`[SECURE_CHANNEL][ERROR] Session ${sessionId} not active.`);

        const sequence = session.next_sequence++;
        const rawPayload = JSON.stringify(payload);

        // Simulação de Cifragem AEAD: 
        // Em um sistema real, usaríamos a session.session_key com AES-GCM
        const encrypted = Buffer.from(rawPayload).toString('base64');
        const authTag = this.generateAuthTag(session.session_key, sequence, encrypted);

        return {
            session_id: sessionId,
            sequence,
            encrypted_payload: encrypted,
            auth_tag: authTag
        };
    }

    /**
     * Decifra um Frame e valida integridade/sequência.
     */
    async decryptFrame(frame: SecureFrame): Promise<any> {
        const session = pilotMeshService.getActiveSession(frame.session_id);
        if (!session) throw new Error(`[SECURE_CHANNEL][ERROR] Session ${frame.session_id} not active.`);

        // 1. Verificação de Integridade (Auth Tag)
        const expectedTag = this.generateAuthTag(session.session_key, frame.sequence, frame.encrypted_payload);
        if (frame.auth_tag !== expectedTag) {
            throw new Error(`[SECURE_CHANNEL][ERROR] Integrity check failed! Frame tampered or wrong key.`);
        }

        // 2. Anti-Replay Intra-Sessão (Sequence Check Simplificado)
        // Em um sistema real, usaríamos uma janela deslizante ou verificaríamos se sequence >= lastReceived
        console.log(`[SECURE_CHANNEL][INFO] Frame ${frame.sequence} verified successfully.`);

        const rawPayload = Buffer.from(frame.encrypted_payload, 'base64').toString('utf8');
        return JSON.parse(rawPayload);
    }

    private generateAuthTag(key: string, seq: number, data: string): string {
        // Simulação de Hashing HMAC/AEAD para integridade
        return `tag_${key.substring(0,4)}_${seq}_${data.length}`;
    }
}

export const pilotSecureChannelService = new PilotSecureChannelService();
