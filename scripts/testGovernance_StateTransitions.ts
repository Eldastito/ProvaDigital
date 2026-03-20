
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runStateTransitionTest() {
    console.log('\n[F6.2] TESTE DE TRANSIÇÃO DE ESTADO - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        name: 'Workflow Auditor',
        email: 'auditor@test.com',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    const context = governanceService.resolveLegacyContext(testUser);
    const testBatchId = `batch_f6_step2_${Date.now()}`;

    // 1. Setup: Ativar Pilot e Flags
    governanceService.setAuthorityPilot(true);
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_writes_functional_draft_enabled = true;
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_status_transition_enabled = true;

    console.log('--- CENÁRIO 1: TRANSIÇÃO DRAFT -> REVIEWED (Workflow Feliz) ---');
    const draft = await pilotStorageService.createFunctionalDraft({
        tenant_id: context.activeOrganizationId,
        user_id: testUser.id,
        name: 'Sessão Completa para Review',
        description: 'Todo conteúdo pedagógico validado.',
        intended_date: '2026-07-01',
        test_batch_id: testBatchId
    });

    const canTransition = governanceService.can('PilotTestSessionDraft', 'UPDATE_STATUS', context, false);
    if (canTransition) {
        const reviewed = await pilotStorageService.transitionDraftStatus(draft.id, draft.version, 'Revisão final de infraestrutura');
        console.log(`✅ Sucesso: Transição efetuada. Status: ${reviewed.status}, Versão: ${reviewed.version}`);
    }

    console.log('\n--- CENÁRIO 2: ERRO DE PRE-CONDITIONS (Incompletude) ---');
    const incomplete = await pilotStorageService.createFunctionalDraft({
        tenant_id: context.activeOrganizationId,
        user_id: testUser.id,
        name: '', // Nome vazio violando pre-condition
        intended_date: '2026-07-02',
        test_batch_id: testBatchId
    });

    try {
        await pilotStorageService.transitionDraftStatus(incomplete.id, incomplete.version, 'Tentativa inválida');
        console.error('❌ Falha: Transição deveria ter sido bloqueada por falta de nome.');
    } catch (e: any) {
        console.log(`✅ Sucesso: Bloqueio por pre-condition confirmado. (${e.message})`);
    }

    console.log('\n--- CENÁRIO 3: ERRO DE VERSÃO (CAS Breach) ---');
    try {
        // Tentando transicionar o primeiro draft usando a versão v1 (quando ele já é v2)
        await pilotStorageService.transitionDraftStatus(draft.id, 1, 'Tentativa de replay');
        console.error('❌ Falha: Replay de versão permitida.');
    } catch (e: any) {
        console.log(`✅ Sucesso: Concorrência otimista (CAS) barrou a transição. (${e.message})`);
    }

    console.log('\n--- CENÁRIO 4: TRANSIÇÃO PROIBIDA (reviewed -> draft) ---');
    // Simular tentativa forçada no storage para ver o guardrail da máquina de estados
    try {
        await pilotStorageService.transitionDraftStatus(draft.id, 2, 'Tentativa de rollback de status');
        console.error('❌ Falha: Transição ilegal permitida.');
    } catch (e: any) {
        console.log(`✅ Sucesso: Máquina de estados bloqueou transição não linear. (${e.message})`);
    }

    console.log('\n--- TELEMETRIA FINAL ---');
    console.log(JSON.stringify(governanceService.getAuthorityPilotStatus().telemetry, null, 2));

    console.log('\n[F6.2] TESTE DE TRANSIÇÃO DE ESTADO - FIM\n');
}

runStateTransitionTest().catch(console.error);
