
import { pilotSyncService, SyncItem } from '../services/pilotSyncService';
import { governanceService } from '../services/governanceService';

async function runMeshSyncTest() {
    console.log('\n[F9.3] TESTE DE SINCRONIZAÇÃO E RECONCILIAÇÃO MESH - INÍCIO\n');

    governanceService.setAuthorityPilot(true);

    const resourceId = 'session_alpha_01';

    console.log('--- CENÁRIO 1: RECONCILIAÇÃO POR DOMINÂNCIA DE ESTADO (Status) ---');
    const localDraft: SyncItem = {
        id: resourceId, version: 1, payload_hash: 'h1', causal_ctx: 'peer_1:1',
        data: { id: resourceId, status: 'draft', name: 'Original' }
    };
    const inboundReviewed: SyncItem = {
        id: resourceId, version: 2, payload_hash: 'h2', causal_ctx: 'peer_2:2',
        data: { id: resourceId, status: 'reviewed', name: 'Revisado' }
    };

    const resultState = pilotSyncService.reconcile(localDraft, inboundReviewed, { localPeerRank: 5, remotePeerRank: 5 });
    if (resultState.data.status === 'reviewed') {
        console.log('✅ Sucesso: Status "reviewed" dominou "draft" (State-Machine Rule).');
    } else {
        console.error('❌ Falha: Regra de dominância de estado não foi aplicada.');
    }

    console.log('\n--- CENÁRIO 2: CONFLITO CONCORRENTE RESOLVIDO POR PEER RANK ---');
    // Mesma versão, hashes diferentes (Concorrência real)
    const localTeacher: SyncItem = {
        id: 'obs_01', version: 3, payload_hash: 'h_a', causal_ctx: 'peer_t:3',
        data: { text: 'Nota do Professor' }
    };
    const inboundCoordinator: SyncItem = {
        id: 'obs_01', version: 3, payload_hash: 'h_b', causal_ctx: 'peer_c:3',
        data: { text: 'Nota do Coordenador' }
    };

    const resultRank = pilotSyncService.reconcile(localTeacher, inboundCoordinator, { localPeerRank: 50, remotePeerRank: 100 });
    if (resultRank.data.text === 'Nota do Coordenador') {
        console.log('✅ Sucesso: Conflito resolvido pelo maior Peer-Rank (Coordenador > Professor).');
    } else {
        console.error('❌ Falha: Peer-Rank não decidiu o conflito corretamente.');
    }

    console.log('\n--- CENÁRIO 3: DETECÇÃO DE MANIFESTO DIFERENCIAL ---');
    const items = [localTeacher, localDraft];
    const manifest = pilotSyncService.generateManifest('batch_93', items);
    
    console.log(`Manifesto gerado para ${items.length} itens.`);
    if (manifest.items_summary['obs_01'].hash === 'h_a') {
        console.log('✅ Sucesso: Manifesto reflete fielmente o estado do lote.');
    } else {
        console.error('❌ Falha: Erro na geração do sumário de hashes.');
    }

    console.log('\n[F9.3] TESTE DE SINCRONIZAÇÃO MESH - FIM\n');
}

runMeshSyncTest().catch(console.error);
