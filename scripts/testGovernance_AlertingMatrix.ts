
import { pilotMonitoringService } from '../services/pilotMonitoringService';
import { pilotAlertService } from '../services/pilotAlertService';
import { governanceService } from '../services/governanceService';

async function runAlertingMatrixTest() {
    console.log('\n[F10.2] TESTE DE MATRIZ DE ALERTAS (P0/P1) - INÍCIO\n');

    governanceService.setAuthorityPilot(true);

    console.log('--- CENÁRIO 1: DISPARO DE ALERTA P0 (MESH DOWN) ---');
    // Simular 6 falhas consecutivas de handshake
    for (let i = 0; i < 6; i++) {
        pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'failure', peer_id: `attacker_${i}` });
    }

    let alerts = pilotAlertService.evaluateRules();
    const meshAlert = alerts.find(a => a.id === 'MESH_DOWN_MASSIVE');
    if (meshAlert && meshAlert.severity === 'P0') {
        console.log('✅ Sucesso: Alerta P0 disparado corretamente para falha de malha.');
    } else {
        console.error('❌ Falha: Alerta de Mesh Down não detectado.');
    }

    console.log('\n--- CENÁRIO 2: DISPARO DE ALERTA P0 (PRIVACY BREACH) ---');
    // Simular pico de Reveal PII
    pilotMonitoringService.emitMetric('pilot_pii_reveal_total', 15, { user: 'suspicious_actor' });
    
    alerts = pilotAlertService.evaluateRules();
    const privacyAlert = alerts.find(a => a.id === 'PRIVACY_BREACH_SUSPECT');
    if (privacyAlert && privacyAlert.severity === 'P0') {
        console.log('✅ Sucesso: Alerta P0 disparado para suspeita de vazamento de PII.');
    } else {
        console.error('❌ Falha: Alerta de Privacidade falhou.');
    }

    console.log('\n--- CENÁRIO 3: DEDUPLICAÇÃO DE ALERTAS ---');
    const initialCount = alerts.length;
    pilotAlertService.evaluateRules(); // Tentar disparar de novo
    if (pilotAlertService.evaluateRules().length === initialCount) {
        console.log('✅ Sucesso: Alertas ativos foram corretamente desduplicados.');
    } else {
        console.error('❌ Falha: Ruído detectado; alertas não foram desduplicados.');
    }

    console.log('\n[F10.2] TESTE DE MATRIZ DE ALERTAS - FIM\n');
}

runAlertingMatrixTest().catch(console.error);
