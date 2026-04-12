/**
 * @module CryptoService
 * @description Primitivas criptográficas assimétricas (PKI) e simétricas (AES-GCM).
 * 
 * Provê operações de baixo nível para o sistema de segurança da plataforma FORGE:
 * - AES-256-GCM: Cifra simétrica para payloads de dados
 * - RSA-OAEP (2048-bit): Cifra assimétrica para transporte seguro de chaves
 * - Wrap/Unwrap de chaves: Encapsulamento de chave AES com chave pública RSA
 * - Geração de pares de chaves RSA: Para provisionamento de dispositivos
 * 
 * Este módulo é consumido pelo E2EEncryptionService e pelo MeshNetworkService
 * para implementar o Envelope Híbrido (header público + payload cifrado).
 * 
 * @patent-safe Este módulo é parte do dossiê de Patente de Invenção FORGE.
 * @see e2eEncryptionService.ts para derivação de chave por aluno (PBKDF2).
 */

/** Algoritmo de cifra simétrica */
const ALGORITHM = 'AES-GCM';
/** Comprimento da chave simétrica em bits */
const KEY_LENGTH = 256;

export interface EncryptedPayload {
    data: string; // Base64 encoded ciphertext
    iv: string;   // Base64 encoded initialization vector
}

export const cryptoService = {

    generateExamKey: async (): Promise<JsonWebKey> => {
        const key = await window.crypto.subtle.generateKey(
            {
                name: ALGORITHM,
                length: KEY_LENGTH
            },
            true,
            ['encrypt', 'decrypt']
        );
        return await window.crypto.subtle.exportKey('jwk', key);
    },

    /**
     * Generates a SHA-256 hash for data integrity.
     */
    generateSHA256Hash: async (data: any): Promise<string> => {
        const encodedData = new TextEncoder().encode(JSON.stringify(data));
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Imports a JWK key string back into a CryptoKey object.
     */
    importKey: async (jwk: JsonWebKey): Promise<CryptoKey> => {
        return await window.crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Encrypts any JSON object using the provided key.
     * Returns a base64 encoded payload and IV.
     */
    encryptData: async (data: any, key: CryptoKey): Promise<EncryptedPayload> => {
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
        const encodedData = new TextEncoder().encode(JSON.stringify(data));

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            key,
            encodedData
        );

        return {
            data: arrayBufferToBase64(encryptedBuffer),
            iv: arrayBufferToBase64(iv.buffer) // Send IV separately
        };
    },


    /**
     * Decrypts a payload using the provided key.
     */
    decryptData: async (payload: EncryptedPayload, key: CryptoKey): Promise<any> => {
        const encryptedData = base64ToArrayBuffer(payload.data);
        const iv = base64ToArrayBuffer(payload.iv);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            key,
            encryptedData
        );

        const decodedString = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decodedString);
    },

    /**
     * Helper to encrypt a single student answer securely.
     * Useful for sending individual answers to the server.
     */
    encryptAnswer: async (answerPayload: any, key: CryptoKey): Promise<string> => {
        const result = await cryptoService.encryptData(answerPayload, key);
        // Pack IV and Data together for simpler transmission: "IV:DATA"
        return `${result.iv}:${result.data}`;
    },

    // --- PHASE 9: PKI (RSA-OAEP) ---

    /**
     * Generates a persistent RSA-OAEP Key Pair (2048-bit) for User Identity.
     */
    generateIdentityKeyPair: async (): Promise<CryptoKeyPair> => {
        if (!window.crypto || !window.crypto.subtle) {
            console.error("Web Crypto API (window.crypto.subtle) is not available. Context may be insecure (http vs https).");
            throw new Error("Ambiente inseguro: Criptografia indisponível. Use HTTPS ou Localhost.");
        }
        return await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true, // Exportable for storage in LocalStorage/IndexedDB
            ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
        );
    },

    /**
     * Exports a Key (Public or Symmetric) to JWK for storage/transmission.
     */
    exportKey: async (key: CryptoKey): Promise<JsonWebKey> => {
        return await window.crypto.subtle.exportKey("jwk", key);
    },

    /**
     * Imports a Public Key (RSA) from JWK.
     */
    importPublicKey: async (jwk: JsonWebKey): Promise<CryptoKey> => {
        return await window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["wrapKey", "encrypt"]
        );
    },

    /**
     * Imports a Private Key (RSA) from JWK.
     * NOTE: In a strictly secure env, Private Key should never leave IndexedDB.
     */
    importPrivateKey: async (jwk: JsonWebKey): Promise<CryptoKey> => {
        return await window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["unwrapKey", "decrypt"]
        );
    },

    /**
     * WRAP: Encrypts the Exam AES Key using the Student's Public RSA Key.
     * Use this when the Professor sends the key to a specific student.
     */
    wrapKey: async (aesKey: CryptoKey, studentPublicKey: CryptoKey): Promise<string> => {
        const wrappedBuffer = await window.crypto.subtle.wrapKey(
            "raw", // AES keys are wrapped as raw bytes
            aesKey,
            studentPublicKey,
            "RSA-OAEP"
        );
        return arrayBufferToBase64(wrappedBuffer);
    },

    /**
     * UNWRAP: Decrypts the Encrypted AES Key using the Student's Private RSA Key.
     * Use this when the Student receives the sealed exam.
     */
    unwrapKey: async (wrappedKeyB64: string, studentPrivateKey: CryptoKey): Promise<CryptoKey> => {
        const wrappedBuffer = base64ToArrayBuffer(wrappedKeyB64);
        return await window.crypto.subtle.unwrapKey(
            "raw",
            wrappedBuffer,
            studentPrivateKey,
            "RSA-OAEP",
            { name: "AES-GCM", length: 256 }, // Algorithm of the key being unwrapped
            false,
            ["encrypt", "decrypt"]
        );
    }
};

// --- Utilities ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Aliases for compatibility with CoordinatorApp
export const encryptPackage = cryptoService.encryptData;
export const generateEventKey = cryptoService.generateExamKey;
