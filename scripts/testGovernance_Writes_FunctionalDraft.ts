
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runFunctionalDraftTest() {
    console.log('\n[F5.3] TESTE DE ESCRITA FUNCIONAL DRAFT - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        name: 'Test Pilot User',
        email: 'pilot@test.com',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    const context = governanceService.resolveLegacyContext(testUser);
    const testBatchId = `batch_f5_step3_${Date.now()}`;

    // 1. Setup: Ativar Pilot e Flag do Step 3
    governanceService.setAuthorityPilot(true);
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_writes_functional_draft_enabled = true;

    console.log('--- CENÁRIO 1: CREATE DRAFT AUTORIZADO (Local Tenant) ---');
    const canCreate = governanceService.can('PilotTestSessionDraft', 'CREATE', context, false);
    if (canCreate) {
        await pilotStorageService.createFunctionalDraft({
            tenant_id: context.activeOrganizationId,
            user_id: testUser.id,
            name: 'Simulado de Treinamento Pilot',
            intended_date: '2026-05-20',
            test_batch_id: testBatchId
        });
        console.log('✅ Sucesso: Draft funcional criado e auditado.');
    }

    console.log('\n--- CENÁRIO 2: UPDATE BLOQUEADO (Fail-Closed) ---');
    const canUpdate = governanceService.can('PilotTestSessionDraft', 'UPDATE', context, true);
    if (!canUpdate) {
        console.log('✅ Sucesso: UPDATE bloqueado no recurso funcional.');
    } else {
        console.error('❌ Falha: UPDATE deveria estar bloqueado.');
    }

    console.log('\n--- CENÁRIO 3: CROSS-TENANT BLOCK (Isolamento Funcional) ---');
    const crossContext = { ...context, targetOrganizationId: 'canoas_organization' };
    const canCross = governanceService.can('PilotTestSessionDraft', 'CREATE', crossContext, false);
    
    const status = governanceService.getAuthorityPilotStatus();
    console.log(`Cross-tenant Block Count: ${status.telemetry.cross_tenant_mutation_block_count}`);

    if (!canCross && status.telemetry.cross_tenant_mutation_block_count >= 1) {
        console.log('✅ Sucesso: Isolamento preservado em recurso funcional.');
    }

    console.log('\n--- CENÁRIO 4: ROLLBACK FUNCIONAL ---');
    const before = pilotStorageService.getFunctionalDrafts(context.activeOrganizationId).length;
    pilotStorageService.purgeBatch(testBatchId);
    const after = pilotStorageService.getFunctionalDrafts(context.activeOrganizationId).length;
    
    if (before === 1 && after === 0) {
        console.log('✅ Sucesso: Rollback funcional completo.');
    }

    console.log('\n--- TELEMETRIA FINAL ---');
    console.log(JSON.stringify(governanceService.getAuthorityPilotStatus().telemetry, null, 2));

    console.log('\n[F5.3] TESTE DE ESCRITA FUNCIONAL DRAFT - FIM\n');
}

runFunctionalDraftTest().catch(console.error);
