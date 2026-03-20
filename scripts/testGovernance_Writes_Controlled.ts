
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runWriteControlledTest() {
    console.log('\n[F5.1] TESTE DE ESCRITA CONTROLADA - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    const context = governanceService.resolveLegacyContext(testUser);
    const testBatchId = `batch_${Date.now()}`;

    // 1. Setup: Ativar Pilot e Flag de Escrita
    governanceService.setAuthorityPilot(true);
    // @ts-ignore - Acesso a propriedade privada para teste
    governanceService.authorityPilotConfig.authority_pilot_writes_controlled_create_enabled = true;

    console.log('--- CENÁRIO 1: CREATE AUTORIZADO (Local Tenant) ---');
    const canCreateLocal = governanceService.can('PilotExecutionLog', 'CREATE', context, false);
    if (canCreateLocal) {
        await pilotStorageService.createLog({
            tenant_id: context.activeOrganizationId,
            correlation_id: 'corr_123',
            reason_code: 'PILOT_CONTROLLED_CREATE_OK',
            actor_type: 'PILOT_TEST',
            actor_id: testUser.id,
            phase: 'F5',
            step: 'Step1',
            decision_source: 'authority_pilot',
            payload_summary: 'Teste de Escrita Autorizada',
            test_batch_id: testBatchId
        });
        console.log('✅ Sucesso: CREATE autorizado e persistido.');
    } else {
        console.error('❌ Falha: CREATE deveria ser autorizado.');
    }

    console.log('\n--- CENÁRIO 2: EDIT BLOQUEADO (Fora do Escopo) ---');
    const canEdit = governanceService.can('PilotExecutionLog', 'EDIT', context, true);
    if (!canEdit) {
        console.log('✅ Sucesso: EDIT bloqueado (Fail-closed ativo).');
    } else {
        console.error('❌ Falha: EDIT deveria estar bloqueado.');
    }

    console.log('\n--- CENÁRIO 3: CREATE BLOQUEADO (Recurso Não-Alvo) ---');
    const canCreateOther = governanceService.can('Analytics', 'CREATE', context, true);
    if (!canCreateOther) {
        console.log('✅ Sucesso: CREATE em Analytics bloqueado.');
    } else {
        console.error('❌ Falha: CREATE em Analytics deveria estar bloqueado.');
    }

    console.log('\n--- CENÁRIO 4: CREATE BLOQUEADO (Cross-Tenant) ---');
    const crossContext = { ...context, targetOrganizationId: 'canoas_organization' };
    const canCreateCross = governanceService.can('PilotExecutionLog', 'CREATE', crossContext, false);
    if (!canCreateCross) {
        console.log('✅ Sucesso: CREATE cross-tenant bloqueado.');
    } else {
        console.error('❌ Falha: CREATE cross-tenant deveria estar bloqueado.');
    }

    console.log('\n--- CENÁRIO 5: ROLLBACK POR LOTE ---');
    const beforePurge = pilotStorageService.getLogs().length;
    console.log(`Logs antes do rollback: ${beforePurge}`);
    pilotStorageService.purgeBatch(testBatchId);
    const afterPurge = pilotStorageService.getLogs().length;
    console.log(`Logs após rollback: ${afterPurge}`);
    
    if (afterPurge === 0 && beforePurge > 0) {
        console.log('✅ Sucesso: Rollback por lote executado corretamente.');
    } else {
        console.error('❌ Falha: Erro no rollback.');
    }

    console.log('\n--- TELEMETRIA FINAL ---');
    console.log(JSON.stringify(governanceService.getAuthorityPilotStatus().telemetry, null, 2));

    console.log('\n[F5.1] TESTE DE ESCRITA CONTROLADA - FIM\n');
}

runWriteControlledTest().catch(console.error);
