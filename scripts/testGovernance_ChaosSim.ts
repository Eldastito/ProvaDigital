
import { pilotMonitoringService } from '../services/pilotMonitoringService';
import { pilotAlertService } from '../services/pilotAlertService';

/**
 * ChaosPilotSim - Injetor de Falhas para Simulação de Crise
 */
async function runChaosSimulation() {
    console.log('\n[F11.2] INICIANDO WAR GAME OPERACIONAL (CHAOS SIM) - VAI!\n');

    const scenario = process.argv[2] || 'MESH';

    console.log(`--- EXECUTANDO CENÁRIO: ${scenario} ---`);

    if (scenario === 'MESH') {
        console.log('Injetando falha massiva de Mesh...');
        for (let i = 0; i < 15; i++) {
            pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'failure', room_id: 'room_war_01' });
        }
    } else if (scenario === 'PRIVACY') {
        console.log('Injetando anomalia de Reveal PII...');
        pilotMonitoringService.emitMetric('pilot_pii_reveal_total', 50, { user: 'rogue_user_007' });
    } else if (scenario === 'SYNC') {
        console.log('Injetando Stall no Outbox/DLQ...');
        pilotMonitoringService.emitMetric('pilot_outbox_lag', 500, { tenant_id: 'critical_school' });
    }

    console.log('\n--- AGUARDANDO REAÇÃO DOS DASHBOARDS/ALERTAS ---');
    const alerts = pilotAlertService.evaluateRules();
    
    if (alerts.length > 0) {
        console.log('🔥 Alertas Ativos:', alerts.map(a => `[${a.severity}] ${a.title}`).join(', '));
        console.log('✅ Chaos Sim: Sinais injetados. Verifique os dashboards e siga o RUNBOOK!');
    } else {
        console.warn('⚠️ Alerta: Nenhum alerta disparado. Verifique os thresholds de SLO.');
    }

    console.log('\n[F11.2] CHAOS SIM FINALIZADO. Mantenha o sistema aberto para o exercício operacional.\n');
}

runChaosSimulation().catch(console.error);
