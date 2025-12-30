
import { EncryptedPackage, EventKey } from "../types";

// Implementação de Criptografia AES-GCM (Galois/Counter Mode)
// Garante confidencialidade E integridade.

// 1. Gerar uma chave simétrica para o evento
export const generateEventKey = async (eventId: string): Promise<EventKey> => {
    const key = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true, // extractable (precisamos exportar para salvar no backend/transferir)
        ["encrypt", "decrypt"]
    );

    const jwk = await window.crypto.subtle.exportKey("jwk", key);
    return { eventId, keyMaterial: jwk };
};

// 2. Importar a chave JWK de volta para CryptoKey
const importKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
};

// Helper: ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Helper: Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// 3. Criptografar Objeto (JSON) -> Pacote - REMOVED AS UNUSED
// export const encryptPackage = async (data: any, keyJwk: JsonWebKey): Promise<EncryptedPackage> => {
//     const key = await importKey(keyJwk);
//     const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes standard for GCM IV
    
//     const encodedData = new TextEncoder().encode(JSON.stringify(data));

//     const encryptedBuffer = await window.crypto.subtle.encrypt(
//         {
//             name: "AES-GCM",
//             iv: iv
//         },
//         key,
//         encodedData
//     );

//     return {
//         iv: arrayBufferToBase64(iv.buffer),
//         data: arrayBufferToBase64(encryptedBuffer)
//     };
// };

// 4. Descriptografar Pacote -> Objeto
export const decryptPackage = async (pkg: EncryptedPackage, keyJwk: JsonWebKey): Promise<any> => {
    try {
        const key = await importKey(keyJwk);
        const iv = base64ToArrayBuffer(pkg.iv);
        const data = base64ToArrayBuffer(pkg.data);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        );

        const decodedString = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decodedString);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Falha na integridade ou chave incorreta.");
    }
};
