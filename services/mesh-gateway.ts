
import { getLocalServer } from './localServerService';

async function startGateway() {
    console.log('\n\x1b[36m%s\x1b[0m', '🚀 EXAMEPAD - LOGISTICS GATEWAY (Local Mesh Hub)');
    console.log('\x1b[33m%s\x1b[0m', 'Iniciando servidor de sinalização para rede local...\n');

    const server = getLocalServer();

    // Forçamos o ambiente como "Native" para permitir o uso de Express/Socket.io no Node.js
    (global as any).isNativeApp = true;

    try {
        await server.start({
            port: 3001,
            corsOrigins: ['*']
        });

        console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------');
        console.log('\x1b[32m%s\x1b[0m', '✅ GATEWAY ATIVO - Wi-Fi Nativo Habilitado');
        console.log('\x1b[32m%s\x1b[0m', '📍 Interface: Wi-Fi Hotspot (Windows)');
        console.log('\x1b[32m%s\x1b[0m', '🔌 Porta: 3001');
        console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------');
        console.log('\n\x1b[37m%s\x1b[0m', 'Mantenha esta janela aberta durante o processo de carga.\n');

    } catch (e) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Falha ao iniciar Gateway:', e);
        process.exit(1);
    }
}

startGateway();
