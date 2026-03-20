
import { pilotOutboxService } from '../services/pilotOutboxService';
import { pilotAsyncDispatcher } from '../services/pilotAsyncDispatcher';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runRedriveTest() {
    console.log('\n[F7.2D] TESTE DE DLQ REDRIVE - INÍCIO\n');

    const testUser: User = { id: 'user_poa_1', tenantId: 'poa_organization', name: 'Ops Admin', email: 'ops@test.com', role: UserRole.TENANT_ADMIN };
    
    console.log('--- SETUP: Criando item que vai para DLQ (Permanente) ---');
    const draft = await pilotStorageService.createFunctionalDraft({
        tenant_id: testUser.tenantId,
        user_id: testUser.id,
        name: 'TRIGGER_PERMANENT_ERROR',
        intended_date: '2026-12-10',
        description: 'Mock de falha fatal',
        test_batch_id: 'batch_f7_2d'
    });
    // @ts-ignore
    await pilotStorageService.transitionDraftStatus(draft.id, 1, 'Iniciando teste de redrive');
    
    // 1. Matar o item
    await pilotAsyncDispatcher.dispatchPending();
    const item = pilotOutboxService.getAllItems().find(i => i.resource_id === draft.id);
    console.log(`Status inicial: ${item?.status}`);

    if (item?.status !== 'DEAD_LETTERED') {
        throw new Error('Falha no setup: Item não foi para DLQ.');
    }

    console.log('\n--- CENÁRIO 1: EXECUÇÃO DO REDRIVE ---');
    // Para mitigar o erro permanente no redrive em um teste real, o admin corrigiria o dado.
    // Aqui testamos a transição de status do REDRIVE para PENDING.
    pilotOutboxService.redriveItem(item.event_id);
    
    if (item.status === 'PENDING' && item.attempt_count === 0) {
        console.log('✅ Sucesso: Item resgatado da DLQ e resetado para PENDING.');
    } else {
        console.error(`❌ Falha: Redrive não resetou o item corretamente: ${item.status}`);
    }

    console.log('\n--- CENÁRIO 2: RE-PROCESSAMENTO PÓS-REDRIVE ---');
    // Agora o dispatcher deve ver o item de novo. 
    // Como ainda tem o nome que causa erro, ele vai falhar, mas testamos se o dispatcher o consome.
    const result = await pilotAsyncDispatcher.dispatchPending();
    if (result.failed === 1 || result.success === 1) {
        console.log('✅ Sucesso: Dispatcher consumiu o item re-enfileirado pelo Redrive.');
    } else {
        console.error('❌ Falha: Dispatcher ignorou o item em PENDING pós-redrive.');
    }

    console.log('\n[F7.2D] TESTE DE DLQ REDRIVE - FIM\n');
}

runRedriveTest().catch(console.error);
