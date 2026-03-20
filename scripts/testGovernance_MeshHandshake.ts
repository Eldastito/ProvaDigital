
import { pilotMeshService } from '../services/pilotMeshService';
import { pilotHandshakeService } from '../services/pilotHandshakeService';
import { governanceService } from '../services/governanceService';

async function runMeshHandshakeTest() {
    console.log('\n[F9.1] TESTE DE HANDSHAKE SEGURO (MESH) - INÍCIO\n');

    governanceService.setAuthorityPilot(true);

    const deviceTeacher = 'dev_teacher_pad_01';
    const deviceAttacker = 'dev_malicious_spy';

    console.log('--- SETUP: Registrando Dispositivo Confiável ---');
    pilotMeshService.registerTrustedDevice(deviceTeacher, 'pubkey_teacher_01');

    console.log('\n--- CENÁRIO 1: HANDSHAKE BEM SUCEDIDO ---');
    try {
        const session = await pilotHandshakeService.performHandshake(deviceTeacher);
        console.log(`✅ Sucesso: Sessão estabelecida: ${session.session_id}`);
        // @ts-ignore (Telemetria)
        governanceService.authorityPilotConfig.pilot_mesh_session_count++;
    } catch (e: any) {
        console.error(`❌ Falha: Handshake legítimo falhou: ${e.message}`);
    }

    console.log('\n--- CENÁRIO 2: DISPOSITIVO NÃO CONFIÁVEL (SPOOFING) ---');
    try {
        await pilotHandshakeService.performHandshake(deviceAttacker);
        console.error('❌ Falha Crítica: Handshake com dispositivo malicioso foi aceito!');
    } catch (e: any) {
        console.log(`✅ Sucesso: Dispositivo estranho bloqueado: ${e.message}`);
    }

    console.log('\n--- CENÁRIO 3: PROTEÇÃO CONTRA REPLAY ATTACK ---');
    // Forçar uso de um challenge já utilizado
    try {
        const challenge = 'REPLAY_CHALLENGE';
        const sig1 = `${challenge}_SIGNED_BY_${deviceTeacher}`;
        
        console.log('Primeiro uso do challenge...');
        pilotMeshService.establishSession(deviceTeacher, challenge, sig1);
        
        console.log('Tentativa de Replay do mesmo challenge/signature...');
        pilotMeshService.establishSession(deviceTeacher, challenge, sig1);
        console.error('❌ Falha Crítica: Replay attack foi bem sucedido!');
    } catch (e: any) {
        console.log(`✅ Sucesso: Ataque de Replay detectado e bloqueado: ${e.message}`);
    }

    console.log('\n[F9.1] TESTE DE HANDSHAKE SEGURO - FIM\n');
}

runMeshHandshakeTest().catch(console.error);
