
import { governanceService } from '../services/governanceService';
import { pilotPrivacyService } from '../services/pilotPrivacyService';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runPIIMaskingTest() {
    console.log('\n[F8.1] TESTE DE MASCARAMENTO PII (LGPD) - INÍCIO\n');

    const admin: User = { id: 'admin_dpo', tenantId: 'poa_organization', name: 'DPO Office', email: 'dpo@test.com', role: UserRole.TENANT_ADMIN };
    const attacker: User = { id: 'user_malicious', tenantId: 'poa_organization', name: 'Curious Teacher', email: 'teacher@test.com', role: UserRole.TEACHER };

    governanceService.setAuthorityPilot(true);

    console.log('--- CENÁRIO 1: MASCARAMENTO AUTOMÁTICO EM LOGS ---');
    const realStudentId = 'student_real_vincenzo_99';
    const log = await pilotStorageService.createLog({
        tenant_id: 'poa_organization',
        correlation_id: 'corr_lgpd_1',
        reason_code: 'TEST_PII',
        actor_type: 'SYSTEM',
        actor_id: 'pilot_engine',
        phase: '8',
        step: '1',
        decision_source: 'PILOT',
        payload_summary: 'Teste de proteção de dados',
        student_id: realStudentId, // ID REAL enviado para o storage
        test_batch_id: 'batch_f8_1'
    });

    console.log('ID Original Enviado:', realStudentId);
    console.log('ID Persistido no Log:', log.student_id);

    if (log.student_id !== realStudentId && log.student_id?.startsWith('spid_')) {
        console.log('✅ Sucesso: ID do estudante foi pseudonimizado automaticamente no log.');
    } else {
        console.error('❌ Falha: ID real vazou ou não foi mascarado corretamente.');
    }

    console.log('\n--- CENÁRIO 2: BLOOD TEST (REVEAL NÃO AUTORIZADO) ---');
    // Simular tentativa de reveal por um professor (TEACHER não deve ter REVEAL_PII por padrão na baseline)
    const canAttackerReveal = governanceService.can('STUDENT_DATA', 'REVEAL_PII', governanceService.resolveLegacyContext(attacker), false);
    
    if (!canAttackerReveal) {
        console.log('✅ Sucesso: Acesso ao ID real bloqueado para papéis não autorizados.');
    } else {
        console.error('❌ Falha de Segurança: Ator não autorizado possui permissão de REVEAL_PII!');
    }

    console.log('\n--- CENÁRIO 3: REVEAL AUTORIZADO E AUDIT TRACE ---');
    // Para simplificar o teste, assumimos que ADMIN pode (ou forçamos na config)
    // @ts-ignore
    governanceService.authorityPilotConfig.pilot_pii_reveal_count++; // Simulando counter do core
    
    const internalId = pilotPrivacyService.reveal(log.student_id!, { actorId: admin.id, reason: 'Investigação de Auditoria LGPD' });
    
    if (internalId === realStudentId) {
        console.log('✅ Sucesso: ID real recuperado com sucesso pelo DPO.');
        const audit = pilotPrivacyService.getAuditTrail(admin.id)[0];
        if (audit && audit.reason === 'Investigação de Auditoria LGPD') {
            console.log(`✅ Sucesso: Reveal registrado mandatoriamente no Audit Trail LGPD (ID: ${audit.reveal_id}).`);
        } else {
            console.error('❌ Falha de Auditoria: Reveal não foi registrado ou motivo está incorreto.');
        }
    } else {
        console.error('❌ Falha: Reveal retornou ID incorreto.');
    }

    console.log('\n[F8.1] TESTE DE MASCARAMENTO PII - FIM\n');
}

runPIIMaskingTest().catch(console.error);
