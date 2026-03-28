
import { getLocalServer } from './localServerService';
import { envConfig } from './environmentConfig';

async function startGateway() {
    console.log('\n\x1b[36m%s\x1b[0m', '🚀 EXAMEPAD - LOGISTICS GATEWAY (Local Mesh Hub)');
    
    // 1. Validação de Boot Mode-Aware
    const validation = envConfig.validateBoot();
    if (!validation.isValid) {
        console.error('\x1b[31m%s\x1b[0m', `❌ ERRO DE BOOT: ${validation.error}`);
        process.exit(1);
    }

    console.log('\x1b[33m%s\x1b[0m', `Modo: ${envConfig.getMode()} - Iniciando servidor de sinalização...\n`);

    const server = getLocalServer();

    // Forçamos o ambiente como "Native" para permitir o uso de Express/Socket.io no Node.js
    (global as any).isNativeApp = true;

    try {
        const config = envConfig.getNetworkConfig();
        await server.start({
            port: config.port, // Versão consolidada (SST)
            corsOrigins: ['*']
        });

        console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------');
        console.log('\x1b[32m%s\x1b[0m', '✅ GATEWAY ATIVO - Wi-Fi Nativo Habilitado');
        console.log('\x1b[32m%s\x1b[0m', `📍 Interface: ${config.host} (SST)`);
        console.log('\x1b[32m%s\x1b[0m', `🔌 Porta: ${config.port}`);
        console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------');
        console.log('\n\x1b[37m%s\x1b[0m', 'Mantenha esta janela aberta durante o processo de carga.\n');

    } catch (e) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Falha ao iniciar Gateway:', e);
        process.exit(1);
    }
}

startGateway();
