/**
 * TEST-CB-IDEMP-001: Teste de Idempotência e Concorrência da Sessão
 * 
 * Este script valida as travas de integridade (requestId e Version Check) 
 * implementadas na Fase 2 da FORGE.
 */

import { describe, it, expect } from 'vitest';
import { getSessionService } from '../services/sessionIsolationService';
import { PersistenceGateway } from '../services/persistenceGateway';

describe('TEST-CB-IDEMP-001: Idempotency Locks', () => {

    it('Deve garantir idempotência por requestId no mesmo contexto', async () => {
        const service = getSessionService();
        const eventId = 'event_123';
        const studentId = 'student_456';
        const examId = 'exam_789';

        await PersistenceGateway.clearMainDatabase();
        
        const reqId1 = 'request_alpha_1';
        
        // Primeira criação
        const s1 = await service.startSession(studentId, 'Student A', examId, eventId, 'att_1', reqId1);
        const id1 = s1.sessionId;
        const v1 = s1.version;

        // Segunda chamada (Retry Silencioso)
        const s2 = await service.startSession(studentId, 'Student A', examId, eventId, 'att_1', reqId1);
        
        expect(s2.sessionId).toBe(id1);
        expect(s2.version).toBe(v1);
        console.log(`✅ Idempotência bloqueou duplicata e manteve v${s2.version}.`);
    });

    it('Deve permitir nova tentativa (SUPERSEDED) com novo requestId', async () => {
        const service = getSessionService();
        const eventId = 'event_123';
        const studentId = 'student_456';
        const examId = 'exam_789';
        
        const s1 = await service.findActiveAttemptByContext(eventId, studentId, examId);
        const id1 = s1?.sessionId;

        const reqId2 = 'request_beta_2';
        const s3 = await service.startSession(studentId, 'Student A', examId, eventId, 'att_2', reqId2);
        
        expect(s3.sessionId).not.toBe(id1);
        
        const oldSession = await PersistenceGateway.getSessionById(id1!);
        expect(oldSession?.status).toBe('SUPERSEDED');
        expect(oldSession?.supersededByAttemptId).toBe(s3.sessionId);
        console.log('✅ Sessão anterior marcada como SUPERSEDED corretamente.');
    });

    it('Deve lidar com concorrência básica via Promise.all', async () => {
        const service = getSessionService();
        service.logout(); // Limpar RAM
        const eventId = 'race_event';
        const studentId = 'race_student';
        const examId = 'race_exam';

        const reqId3_A = 'race_req_A';
        const reqId3_B = 'race_req_B';

        const results = await Promise.all([
            service.startSession(studentId, 'Student A', examId, eventId, 'att_A', reqId3_A),
            service.startSession(studentId, 'Student A', examId, eventId, 'att_B', reqId3_B)
        ]);

        const finalActive = await service.findActiveAttemptByContext(eventId, studentId, examId);
        expect(finalActive?.status).toBe('ACTIVE');
        console.log(`📌 Ponteiro final aponta para: ${finalActive?.sessionId}`);
    });

});
