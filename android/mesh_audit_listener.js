const dgram = require('dgram');
const crypto = require('crypto');

const PORT = 8888;
const SECRET_KEY_B64 = 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
const SECRET_KEY = Buffer.from(SECRET_KEY_B64, 'base64');
const server = dgram.createSocket('udp4');

console.log('🚀 Mesh Audit Listener iniciado na porta 8888. Aguardando pacotes protegidos...');

server.on('message', (msg, rinfo) => {
    try {
        const envelope = JSON.parse(msg.toString());
        const { pv, rid, ts, src, iv, ct } = envelope;
        
        console.log(`\n--- NOVO PACOTE RECEBIDO (${rinfo.address}) ---`);
        console.log(`[ENVELOPE CLARO] RID: ${rid}, TS: ${ts}, SRC: ${src}`);

        // Reconstituição do AAD (Additional Authenticated Data)
        const aadString = `${pv}|${rid}|${ts}|${src}`;
        const aad = Buffer.from(aadString, 'utf8');
        
        const ivBuffer = Buffer.from(iv, 'base64');
        const ctBuffer = Buffer.from(ct, 'base64');
        
        // No Node crypto, o GCM Auth Tag é passado individualmente
        const tag = ctBuffer.subarray(ctBuffer.length - 16);
        const data = ctBuffer.subarray(0, ctBuffer.length - 16);
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, ivBuffer);
        decipher.setAuthTag(tag);
        decipher.setAAD(aad);
        
        let decrypted = decipher.update(data, 'binary', 'utf8');
        decrypted += decipher.final('utf8');
        
        // Verificação final de integridade e auditoria
        console.log(`✅ [AUDITORIA OK] Integridade e Confidencialidade Validadas`);
        console.log(`📡 PAYLOAD DECIFRADO: ${decrypted}`);
        console.log(`🛡️  AAD AUTENTICADO: ${aadString}`);

    } catch (e) {
        console.error(`❌ [REJEIÇÃO CRÍTICA] Erro de Integridade ou Decriptação: ${e.message}`);
        console.error(`DICA: Tag Mismatch ou AAD Adulterado detectado.`);
    }
});

server.bind(PORT);
