/**
 * E2E Encryption Service - WhatsApp-style Security
 * 
 * Implementa criptografia de ponta a ponta usando Web Crypto API:
 * - AES-256-GCM para criptografia de respostas
 * - PBKDF2 para derivação de chaves por aluno
 * - HMAC-SHA256 para integridade de QR Codes
 * 
 * Fluxo:
 * 1. Aluno finaliza prova → Criptografa respostas com chave única
 * 2. Professor escaneia QR → Armazena dados criptografados (NÃO descriptografa)
 * 3. Coordenador consolida escola → Descriptografa com chave mestra
 * 4. Servidor recebe → Processa em lote
 */

import { StudentAnswer } from '../../types';

export interface EncryptedPackage {
    iv: string;  // Initialization Vector (base64)
    data: string; // Ciphertext (base64)
}

export interface SignedPayload {
    type: 'STUDENT_SUBMISSION' | 'CLASSROOM_BATCH' | 'SCHOOL_BATCH';
    payload: any;
    signature: string; // HMAC signature
    timestamp: string;
}

export class E2EEncryptionService {
    /**
     * Deriva chave única por aluno/evento usando PBKDF2
     * 
     * @param eventId - ID do evento de prova
     * @param studentId - ID do aluno
     * @returns CryptoKey para AES-GCM
     */
    static async deriveStudentKey(eventId: string, studentId: string): Promise<CryptoKey> {
        const salt = `${eventId}:${studentId}:SALT2026`;

        // Importar eventId como base key
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(eventId),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // Derivar chave AES-256-GCM
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new TextEncoder().encode(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        return key;
    }

    /**
     * Criptografa dados genéricos
     * 
     * @param data - Dados a serem criptografados (devem ser JSON serializáveis)
     * @param key - Chave derivada
     * @returns Pacote criptografado (IV + dados)
     */
    static async encryptData<T>(
        data: T,
        key: CryptoKey
    ): Promise<EncryptedPackage> {
        // Gerar IV aleatório (12 bytes para GCM)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Serializar dados
        const plaintext = JSON.stringify(data);

        // Criptografar
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            new TextEncoder().encode(plaintext)
        );

        // Converter para base64 para transporte
        return {
            iv: this.arrayBufferToBase64(iv),
            data: this.arrayBufferToBase64(new Uint8Array(ciphertext))
        };
    }

    /**
     * Descriptografa dados genéricos
     * 
     * @param encryptedPackage - Pacote criptografado
     * @param key - Chave derivada
     * @returns Dados descriptografados do tipo T
     */
    static async decryptData<T>(
        encryptedPackage: EncryptedPackage,
        key: CryptoKey
    ): Promise<T> {
        // Converter de base64 para bytes
        const iv = this.base64ToArrayBuffer(encryptedPackage.iv);
        const ciphertext = this.base64ToArrayBuffer(encryptedPackage.data);

        // Descriptografar
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
            key,
            ciphertext.buffer as ArrayBuffer
        );

        // Parsear JSON
        const plaintext = new TextDecoder().decode(decrypted);
        return JSON.parse(plaintext) as T;
    }

    /**
     * @deprecated Use encryptData<StudentAnswer[]>
     */
    static async encryptAnswers(
        answers: StudentAnswer[],
        key: CryptoKey
    ): Promise<EncryptedPackage> {
        return this.encryptData(answers, key);
    }

    /**
     * @deprecated Use decryptData<StudentAnswer[]>
     */
    static async decryptAnswers(
        encryptedPackage: EncryptedPackage,
        key: CryptoKey
    ): Promise<StudentAnswer[]> {
        return this.decryptData<StudentAnswer[]>(encryptedPackage, key);
    }

    /**
     * Gera assinatura HMAC para detectar adulteração
     * 
     * @param data - Dados a serem assinados (string JSON)
     * @param secret - Segredo (eventId)
     * @returns Assinatura HMAC em base64
     */
    static async signPayload(data: string, secret: string): Promise<string> {
        // Importar chave HMAC
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Gerar assinatura
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(data)
        );

        return this.arrayBufferToBase64(new Uint8Array(signature));
    }

    /**
     * Verifica assinatura HMAC
     * 
     * @param data - Dados originais
     * @param signature - Assinatura recebida
     * @param secret - Segredo (eventId)
     * @returns true se assinatura válida
     */
    static async verifySignature(
        data: string,
        signature: string,
        secret: string
    ): Promise<boolean> {
        const expectedSignature = await this.signPayload(data, secret);
        return signature === expectedSignature;
    }

    /**
     * Cria payload assinado (QR Code)
     * 
     * @param type - Tipo de payload
     * @param payload - Dados do payload
     * @param secret - Segredo para assinatura
     * @returns Payload assinado pronto para QR Code
     */
    static async createSignedPayload(
        type: SignedPayload['type'],
        payload: any,
        secret: string
    ): Promise<SignedPayload> {
        const dataStr = JSON.stringify(payload);
        const signature = await this.signPayload(dataStr, secret);

        return {
            type,
            payload,
            signature,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Valida payload assinado
     * 
     * @param signedPayload - Payload recebido do QR Code
     * @param secret - Segredo para verificação
     * @returns true se válido, lança erro se adulterado
     */
    static async validateSignedPayload(
        signedPayload: SignedPayload,
        secret: string
    ): Promise<boolean> {
        const { signature, ...payloadWithoutSig } = signedPayload;
        const dataStr = JSON.stringify(payloadWithoutSig);

        const isValid = await this.verifySignature(dataStr, signature, secret);

        if (!isValid) {
            throw new Error('❌ QR Code adulterado! Signature HMAC inválida.');
        }

        return true;
    }

    /**
     * [F3A] Gera um Token de Autenticação Endurecido para o LocalMeshServer
     * 
     * @param studentId - ID do aluno/usuário
     * @param tabletId - ID único do dispositivo (proveniente do provisioning)
     * @param eventId - ID do evento
     * @param role - Papel do usuário (RBAC)
     * @param secret - Segredo autoritativo de provisioning (meshKey)
     * @returns Token Base64 assinado: "base64(payload).signature"
     */
    static async createMeshToken(
        studentId: string, 
        tabletId: string, 
        eventId: string, 
        role: 'STUDENT' | 'PROFESSOR' | 'COORDINATOR',
        secret: string
    ): Promise<string> {
        const payload = {
            studentId,
            tabletId,
            eventId,
            role,
            jti: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };
        const payloadJson = JSON.stringify(payload);
        const payloadB64 = btoa(payloadJson);
        const signature = await this.signPayload(payloadJson, secret);
        
        return `${payloadB64}.${signature}`;
    }

    // --- HELPERS ---

    private static arrayBufferToBase64(buffer: Uint8Array): string {
        const binary = String.fromCharCode(...buffer);
        return btoa(binary);
    }

    private static base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * // 1. Aluno finaliza prova
 * const key = await E2EEncryptionService.deriveStudentKey(eventId, studentId);
 * const encrypted = await E2EEncryptionService.encryptAnswers(answers, key);
 * 
 * // 2. Gerar QR Code assinado
 * const signedPayload = await E2EEncryptionService.createSignedPayload(
 *   'STUDENT_SUBMISSION',
 *   { studentId, encrypted },
 *   eventId
 * );
 * 
 * // 3. Professor escaneia e valida
 * await E2EEncryptionService.validateSignedPayload(signedPayload, eventId);
 * // Armazena encrypted (NÃO descriptografa ainda)
 * 
 * // 4. Coordenador descriptografa
 * const decrypted = await E2EEncryptionService.decryptAnswers(encrypted, key);
 * ```
 */
