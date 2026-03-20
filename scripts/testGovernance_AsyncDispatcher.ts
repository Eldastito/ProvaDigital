
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { pilotAsyncDispatcher } from '../services/pilotAsyncDispatcher';
import { pilotOutboxService } from '../services/pilotOutboxService';
import { User, UserRole } from '../types';

async function runAsyncDispatcherTest() {
    console.log('\n[F7.2B] TESTE DE ASYNC DISPATCHER - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        name: 'Reliability Engineer',
        email: 'dispatcher@test.com',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    const context = governanceService.resolveLegacyContext(testUser);
    governanceService.setAuthorityPilot(true);
    // @ts-ignore
    governanceService.authorityPilotConfig.authority_pilot_status_transition_enabled = true;

    console.log('--- CENÁRIO 1: ENTREGA BEM SUCEDIDA ---');
    // Criar draft e transicionar para reviewed (isso gera o item de outbox)
    const draft = await pilotStorageService.createFunctionalDraft({
        tenant_id: context.activeOrganizationId,
        user_id: testUser.id,
        name: 'Sessão para Despacho Limpo',
        intended_date: '2026-11-20',
        description: 'Teste de processamento assíncrono',
        test_batch_id: 'batch_f7_2b'
    });
    await pilotStorageService.transitionDraftStatus(draft.id, 1, 'Pronto para disparo');

    // Executar o dispatcher
    const result = await pilotAsyncDispatcher.dispatchPending();
    
    const items = pilotOutboxService.getAllItems();
    const event = items.find(i => i.resource_id === draft.id);

    if (event?.status === 'DELIVERED') {
        console.log(`✅ Sucesso: Evento ${event.event_id} entregue com sucesso.`);
        console.log(`Data de Processamento: ${event.processed_at}`);
    } else if (event?.status === 'RETRY_SCHEDULED') {
        console.log(`ℹ️ Retry: Evento ${event.event_id} agendado para re-tentativa (Simulação de erro transitório).`);
    } else {
        console.error(`❌ Falha: Evento em estado inesperado: ${event?.status}`);
    }

    console.log('\n--- CENÁRIO 2: FILTRAGEM DE ITENS JÁ PROCESSADOS ---');
    // Rodar o dispatcher de novo. Ele não deve processar o mesmo item.
    const secondResult = await pilotAsyncDispatcher.dispatchPending();
    if (secondResult.success === 0) {
        console.log('✅ Sucesso: Dispatcher não re-processou itens entregues.');
    } else {
        console.error('❌ Falha: Dispatcher re-processou itens já marcados como DELIVERED.');
    }

    console.log('\n[F7.2B] TESTE DE ASYNC DISPATCHER - FIM\n');
}

runAsyncDispatcherTest().catch(console.error);
