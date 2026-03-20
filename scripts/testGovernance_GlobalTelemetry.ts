
import { pilotMonitoringService } from '../services/pilotMonitoringService';
import { governanceService } from '../services/governanceService';

async function runGlobalTelemetryTest() {
    console.log('\n[F10.1] TESTE DE TELEMETRIA GLOBAL E CORRELAÇÃO - INÍCIO\n');

    governanceService.setAuthorityPilot(true);

    const correlationId = 'corr_test_9999';

    console.log('--- CENÁRIO 1: EMISSÃO DE MÉTRICAS CRÍTICAS ---');
    pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'success', peer_id: 'peer_alpha' });
    pilotMonitoringService.emitMetric('pilot_mesh_handshake_total', 1, { status: 'failure', peer_id: 'peer_attacker' });
    pilotMonitoringService.emitMetric('pilot_sync_delta_bytes', 1024, { batch_id: 'b1', tenant_id: 'school_01' });

    console.log('\n--- CENÁRIO 2: TRACE CORRELACIONADO (Sync Flow) ---');
    const rootTrace = pilotMonitoringService.startSpan('mesh_sync_root', correlationId, undefined, { tenant: 'school_01' });
    
    // Simulação de sub-processamento
    const subSpan = pilotMonitoringService.startSpan('manifest_comparison', rootTrace.trace_id, rootTrace.span_id, { batch: 'b1' });
    await new Promise(resolve => setTimeout(resolve, 50));
    pilotMonitoringService.endSpan(subSpan, 50);

    const subSpan2 = pilotMonitoringService.startSpan('causal_reconciliation', rootTrace.trace_id, rootTrace.span_id, { conflicts: '2' });
    await new Promise(resolve => setTimeout(resolve, 30));
    pilotMonitoringService.endSpan(subSpan2, 30);

    pilotMonitoringService.endSpan(rootTrace, 80);

    console.log('\n--- CENÁRIO 3: AUDITORIA DE SEMANTIC CONVENTIONS ---');
    const latest = pilotMonitoringService.getLatestMetrics();
    const hasCorrectLabels = latest.every(m => m.labels.app === 'authority_pilot' && m.labels.env === 'production');
    
    if (hasCorrectLabels) {
        console.log('✅ Sucesso: Todas as métricas seguem as Semantic Conventions padronizadas.');
    } else {
        console.error('❌ Falha: Inconsistência nas labels globais de telemetria.');
    }

    console.log('\n[F10.1] TESTE DE TELEMETRIA GLOBAL - FIM\n');
}

runGlobalTelemetryTest().catch(console.error);
