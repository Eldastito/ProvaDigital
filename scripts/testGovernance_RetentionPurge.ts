
import { pilotStorageService } from '../services/pilotStorageService';
import { pilotRetentionService, PurposeClass } from '../services/pilotRetentionService';
import { governanceService } from '../services/governanceService';
import { User, UserRole } from '../types';

async function runRetentionPurgeTest() {
    console.log('\n[F8.2] TESTE DE RETENÇÃO E EXPURGO ATÔMICO - INÍCIO\n');

    const admin: User = { id: 'admin_audit', tenantId: 'poa_organization', name: 'Compliance Officer', email: 'audit@test.com', role: UserRole.TENANT_ADMIN };
    governanceService.setAuthorityPilot(true);

    console.log('--- SETUP: Criando logs com datas variadas e classes ---');
    
    // 1. Log de Debug "Velho" (Elegível)
    const oldDebugDate = new Date();
    oldDebugDate.setDate(oldDebugDate.getDate() - 10); // TTL debug = 7 dias
    
    // @ts-ignore (Manual injection para teste de data)
    const oldLog = await pilotStorageService.createLog({
        tenant_id: 'poa_organization', correlation_id: 'old_1', reason_code: 'DEBUG_OLD',
        purpose_class: PurposeClass.DEBUG, actor_id: 'sys', actor_type: 'SYS', status: 'OK', 
        phase: '8', step: '2', decision_source: 'PILOT', payload_summary: 'Troubleshooting antigo', test_batch_id: 'batch_old'
    });
    // @ts-ignore
    oldLog.created_at = oldDebugDate.toISOString();

    // 2. Log de Segurança "Velho" sob LEGAL HOLD (NÃO Elegível)
    const oldSecurityDate = new Date();
    oldSecurityDate.setDate(oldSecurityDate.getDate() - 400); // TTL security = 365 dias
    
    // @ts-ignore
    const holdLog = await pilotStorageService.createLog({
        tenant_id: 'poa_organization', correlation_id: 'hold_1', reason_code: 'SEC_AUDIT',
        purpose_class: PurposeClass.SECURITY_AUDIT, actor_id: 'sys', actor_type: 'SYS', status: 'OK', 
        phase: '8', step: '2', decision_source: 'PILOT', payload_summary: 'Incidente em investigação', test_batch_id: 'batch_incident'
    });
    // @ts-ignore
    holdLog.created_at = oldSecurityDate.toISOString();
    pilotRetentionService.setLegalHold(holdLog.id, 'Investigação de Incidente #123');

    console.log('\n--- CENÁRIO 1: EXECUÇÃO DO PURGE ATÔMICO ---');
    const logsBefore = pilotStorageService.getLogs().length;
    const purged = await pilotStorageService.purgeLogs(admin.id);
    const logsAfter = pilotStorageService.getLogs().length;

    console.log(`Logs antes: ${logsBefore} | Eliminados: ${purged} | Logs depois: ${logsAfter}`);

    if (purged >= 1) {
        console.log('✅ Sucesso: Logs elegíveis foram eliminados.');
    } else {
        console.error('❌ Falha: Nenhum log foi eliminado (check TTL/logic).');
    }

    console.log('\n--- CENÁRIO 2: RESPEITO AO LEGAL HOLD ---');
    const stillExists = pilotStorageService.getLogs().find(l => l.id === holdLog.id);
    if (stillExists) {
        console.log('✅ Sucesso: Registro sob Legal Hold foi PRESERVADO, mesmo vencido pelo TTL.');
    } else {
        console.error('❌ Falha de Governança: Registro sob Legal Hold foi expurgado indevidamente!');
    }

    console.log('\n--- CENÁRIO 3: GERAÇÃO DE PROVA DE ELIMINAÇÃO ---');
    const proofs = pilotRetentionService.getProofs();
    if (proofs.length > 0) {
        console.log(`✅ Sucesso: ${proofs.length} prova(s) de eliminação gerada(s) mandatoriamente.`);
        console.log(`Prova ID: ${proofs[0].proof_id} | Classe: ${proofs[0].purpose_class} | Autorizado por: ${proofs[0].authorized_by}`);
    } else {
        console.error('❌ Falha: Nenhuma prova de eliminação foi registrada.');
    }

    console.log('\n[F8.2] TESTE DE RETENÇÃO E EXPURGO - FIM\n');
}

runRetentionPurgeTest().catch(console.error);
