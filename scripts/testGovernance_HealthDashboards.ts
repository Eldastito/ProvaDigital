
import { pilotMonitoringService } from '../services/pilotMonitoringService';
import { pilotDashboardService } from '../services/pilotDashboardService';
import { governanceService } from '../services/governanceService';

async function runHealthDashboardTest() {
    console.log('\n[F10.3] TESTE DE DASHBOARDS DE SAÚDE E DRILL-DOWN - INÍCIO\n');

    governanceService.setAuthorityPilot(true);

    console.log('--- SETUP: Gerando Telemetria para Múltiplos Contextos ---');
    // Escola A, Sala 01: Saudável
    pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'success', tenant_id: 'school_A', room_id: 'room_01' });
    pilotMonitoringService.emitMetric('pilot_sync_delta_bytes', 512, { tenant_id: 'school_A', room_id: 'room_01' });

    // Escola B, Sala 02: Degradada (Falhas)
    pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'failure', tenant_id: 'school_B', room_id: 'room_02' });
    pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'failure', tenant_id: 'school_B', room_id: 'room_02' });

    console.log('\n--- CENÁRIO 1: VISÃO EXECUTIVA GLOBAL ---');
    const global = pilotDashboardService.getGlobalHealth();
    console.log('Global Summary:', global);
    if (global.handshake_success_rate < 100 && global.total_sync_bytes > 0) {
        console.log('✅ Sucesso: KPI global reflete a agregação de múltiplos tenants.');
    } else {
        console.error('❌ Falha: Erro na agregação global.');
    }

    console.log('\n--- CENÁRIO 2: DRILL-DOWN POR SALA (RED Pattern) ---');
    const health01 = pilotDashboardService.getRoomHealth('room_01');
    const health02 = pilotDashboardService.getRoomHealth('room_02');

    console.log(`Saúde Sala 01: ${health01.status} (Rate: ${health01.error_rate}%)`);
    console.log(`Saúde Sala 02: ${health02.status} (Rate: ${health02.error_rate}%)`);

    if (health01.status === 'HEALTHY' && health02.status === 'DOWN') {
        console.log('✅ Sucesso: Drill-down identificou corretamente isolamento de falha por sala.');
    } else {
        console.error('❌ Falha: Erro no drill-down operacional.');
    }

    console.log('\n[F10.3] TESTE DE DASHBOARDS DE SAÚDE - FIM\n');
}

runHealthDashboardTest().catch(console.error);
