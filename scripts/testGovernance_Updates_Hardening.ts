
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runUpdateHardeningTest() {
    console.log('\n[F6.1] TESTE DE UPDATE E HARDENING - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        name: 'Hardening Tester',
        email: 'hardening@test.com',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    const context = governanceService.resolveLegacyContext(testUser);
    const testBatchId = `batch_f6_step1_${Date.now()}`;

    // 1. Setup: Ativar Pilot e Flags
    governanceService.setAuthorityPilot(true);
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_writes_functional_draft_enabled = true;
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_updates_draft_attributes_enabled = true;

    console.log('--- CENÁRIO 1: CREATE DRAFT (Baseline) ---');
    const draft = await pilotStorageService.createFunctionalDraft({
        tenant_id: context.activeOrganizationId,
        user_id: testUser.id,
        name: 'Sessão Original',
        intended_date: '2026-06-01',
        test_batch_id: testBatchId
    });
    console.log(`✅ Draft criado: ${draft.id} v${draft.version}`);

    console.log('\n--- CENÁRIO 2: UPDATE WHITELISTED (name/description) ---');
    const canUpdate = governanceService.can('PilotTestSessionDraft', 'UPDATE', context, false);
    if (canUpdate) {
        const updated = await pilotStorageService.updateFunctionalDraft(draft.id, {
            name: 'Sessão Evoluída',
            description: 'Descrição de hardening'
        }, draft.version);
        console.log(`✅ Sucesso: Atributos whitelisted atualizados para v${updated.version}.`);
    }

    console.log('\n--- CENÁRIO 3: BLOQUEIO DE ATRIBUTO MESTRE (status) ---');
    try {
        await pilotStorageService.updateFunctionalDraft(draft.id, {
            status: 'active' as any
        }, 2);
        console.error('❌ Falha: UPDATE de status deveria ter sido bloqueado pelo Storage.');
    } catch (e: any) {
        console.log(`✅ Sucesso: Storage bloqueou tentativa operacional. (${e.message})`);
    }

    console.log('\n--- CENÁRIO 4: CONCORRÊNCIA OTIMISTA (Version Conflict) ---');
    try {
        // Tentando atualizar usando versão 1 quando ela já é 2
        await pilotStorageService.updateFunctionalDraft(draft.id, { name: 'Concorrência' }, 1);
        console.error('❌ Falha: Sobrescrita silenciosa permitida (versão ignorada).');
    } catch (e: any) {
        console.log(`✅ Sucesso: Concorrência otimista impediu sobrescrita. (${e.message})`);
    }

    console.log('\n--- CENÁRIO 5: ISOLAMENTO CROSS-TENANT EM UPDATE ---');
    const crossContext = { ...context, targetOrganizationId: 'canoas_organization' };
    const canCrossUpdate = governanceService.can('PilotTestSessionDraft', 'UPDATE', crossContext, false);
    
    const status = governanceService.getAuthorityPilotStatus();
    if (!canCrossUpdate && status.telemetry.cross_tenant_mutation_block_count >= 1) {
        console.log('✅ Sucesso: UPDATE cross-tenant bloqueado pelo Core.');
    }

    console.log('\n--- TELEMETRIA FINAL ---');
    console.log(JSON.stringify(governanceService.getAuthorityPilotStatus().telemetry, null, 2));

    console.log('\n[F6.1] TESTE DE UPDATE E HARDENING - FIM\n');
}

runUpdateHardeningTest().catch(console.error);
