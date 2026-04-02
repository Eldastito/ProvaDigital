/**
 * TEST-CB-STATE-001: Validação da Matriz de Transição de Estados (Fase 2)
 * 
 * Este script garante que o ciclo de vida da sessão respeite as regras 
 * de autoridade e impossibilidade de regressão definidas no STATE_TRANSITION_MATRIX.md.
 */

import { describe, it, expect } from 'vitest';
import { getSessionService } from '../services/sessionIsolationService';
import { PersistenceGateway } from '../services/persistenceGateway';

describe('TEST-CB-STATE-001: State Transition Matrix', () => {

    it('Deve garantir transição válida ACTIVE -> COMPLETED', async () => {
        const service = getSessionService();
        const eventId = 'st_event_1';
        const studentId = 'st_student_1';
        const examId = 'st_exam_1';

        await PersistenceGateway.clearMainDatabase();
        
        const s1 = await service.startSession(studentId, 'Tester', examId, eventId, 'att_1', 'req_1');
        const id1 = s1.sessionId;
        const v1 = s1.version;
        
        expect(s1.status).toBe('ACTIVE');

        const completed = await service.finishSession();
        expect(completed.status).toBe('COMPLETED');
        expect(completed.version).toBe(v1 + 1);
        console.log(`✅ Sucesso: Transição efetuada (v${v1} -> v${completed.version}).`);
    });

    it('Deve bloquear regressão COMPLETED -> ACTIVE no lookup', async () => {
        const service = getSessionService();
        const eventId = 'st_event_1';
        const studentId = 'st_student_1';
        const examId = 'st_exam_1';

        const recovered = await service.findActiveAttemptByContext(eventId, studentId, examId);
        expect(recovered).toBeNull();
        console.log('✅ Sucesso: findActiveAttemptByContext NÃO retornou sessão COMPLETED (Correto).');
    });

    it('Deve garantir transição válida ACTIVE -> SUPERSEDED', async () => {
        const service = getSessionService();
        const eventId = 'st_event_1';
        const studentId = 'st_student_1';
        const examId = 'st_exam_1';

        // Criar uma nova ativa
        const s2 = await service.startSession(studentId, 'Tester', examId, eventId, 'att_2', 'req_2');
        expect(s2.status).toBe('ACTIVE');

        // Criar uma terceira para supersede s2
        const s3 = await service.startSession(studentId, 'Tester', examId, eventId, 'att_3', 'req_3');
        
        const oldActive = await PersistenceGateway.getSessionById(s2.sessionId);
        expect(oldActive?.status).toBe('SUPERSEDED');
        expect(oldActive?.supersededByAttemptId).toBe(s3.sessionId);
        console.log(`✅ Sucesso: ACTIVE #${s2.sessionId} movida para SUPERSEDED pela #${s3.sessionId}.`);
    });

});
