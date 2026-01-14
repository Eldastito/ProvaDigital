
import { v4 as uuidv4 } from 'uuid';

// AES-GCM Configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

export interface EncryptedPayload {
    data: string; // Base64 encoded ciphertext
    iv: string;   // Base64 encoded initialization vector
}

export const cryptoService = {

    /**
     * Generates a random 256-bit key for exam encryption.
     * Returns the key exported as a JWK (JSON Web Key) string for storage.
     */
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
            iv: arrayBufferToBase64(iv) // Send IV separately
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
