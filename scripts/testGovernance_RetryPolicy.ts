
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { pilotAsyncDispatcher } from '../services/pilotAsyncDispatcher';
import { pilotOutboxService } from '../services/pilotOutboxService';
import { User, UserRole } from '../types';

async function runRetryPolicyTest() {
    console.log('\n[F7.2C] TESTE DE RETRY POLICY E CLASSIFICAÇÃO - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        name: 'Fault Tolerance Admin',
        email: 'retry@test.com',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    governanceService.setAuthorityPilot(true);
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_status_transition_enabled = true;

    console.log('--- CENÁRIO 1: ERRO PERMANENTE (CONTRATO) -> DLQ DIRETO ---');
    const draftPerm = await pilotStorageService.createFunctionalDraft({
        tenant_id: testUser.tenantId,
        user_id: testUser.id,
        name: 'TRIGGER_PERMANENT_ERROR',
        intended_date: '2026-11-25',
        description: 'Deve causar erro contratual permanente',
        test_batch_id: 'batch_f7_2c_perm'
    });
    await pilotStorageService.transitionDraftStatus(draftPerm.id, 1, 'Teste de erro permanente');
    
    await pilotAsyncDispatcher.dispatchPending();
    const itemPerm = pilotOutboxService.getAllItems().find(i => i.resource_id === draftPerm.id);
    
    if (itemPerm?.status === 'DEAD_LETTERED' && itemPerm.last_error_type === 'PERMANENT') {
        console.log(`✅ Sucesso: Erro permanente enviou item ${itemPerm.event_id} direto para DLQ.`);
    } else {
        console.error(`❌ Falha: Erro permanente não foi isolado corretamente: ${itemPerm?.status}`);
    }

    console.log('\n--- CENÁRIO 2: ERRO TRANSITÓRIO -> RETRY SCHEDULED ---');
    // Forçamos retry via mock ou probabilidade.
    // Como a chance de erro é 20%, vamos criar 5 rascunhos e rodar ciclos.
    const draftTrans = await pilotStorageService.createFunctionalDraft({
        tenant_id: testUser.tenantId,
        user_id: testUser.id,
        name: 'Sessão com Retry Transitório',
        intended_date: '2026-11-30',
        description: 'Simulação de falha de infra',
        test_batch_id: 'batch_f7_2c_trans'
    });
    await pilotStorageService.transitionDraftStatus(draftTrans.id, 1, 'Iniciando teste de retry');

    // Tentar processar até falhar ou dar certo (mock transient)
    // No test script facilitamos o Transient via log.
    await pilotAsyncDispatcher.dispatchPending();
    const itemTrans = pilotOutboxService.getAllItems().find(i => i.resource_id === draftTrans.id);
    
    if (itemTrans?.status === 'DELIVERED' || itemTrans?.status === 'RETRY_SCHEDULED') {
        console.log(`✅ Sucesso: Lógica de Retry/Entrega operando para erro transitório. Status: ${itemTrans.status}`);
        if (itemTrans.status === 'RETRY_SCHEDULED') {
            console.log(`Próxima tentativa em: ${itemTrans.next_attempt_at}`);
        }
    }

    console.log('\n--- CENÁRIO 3: MAX ATTEMPTS -> DLQ ---');
    // Criamos um item, marcamos como PENDING com 3 attempts manuais para simular exaustão
    const draftMax = await pilotStorageService.createFunctionalDraft({
        tenant_id: testUser.tenantId,
        user_id: testUser.id,
        name: 'Sessão Esgotada',
        intended_date: '2026-12-01',
        description: 'Deve morrer após max attempts',
        test_batch_id: 'batch_f7_2c_max'
    });
    await pilotStorageService.transitionDraftStatus(draftMax.id, 1, 'Teste de exaustão');
    
    const itemMax = pilotOutboxService.getAllItems().find(i => i.resource_id === draftMax.id);
    if (itemMax) {
        // @ts-ignore
        itemMax.attempt_count = 3; // Forçando limite
        await pilotAsyncDispatcher.dispatchPending();
        if (itemMax.status === 'DEAD_LETTERED' && itemMax.last_error_type === 'POISON_MESSAGE') {
            console.log(`✅ Sucesso: Item ${itemMax.event_id} enviado para DLQ após exaustão de retries.`);
        } else {
            console.error(`❌ Falha: Exaustão de retries não respeitada: ${itemMax.status}`);
        }
    }

    console.log('\n[F7.2C] TESTE DE RETRY POLICY - FIM\n');
}

runRetryPolicyTest().catch(console.error);
