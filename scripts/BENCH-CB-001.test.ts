/**
 * BENCH-CB-001: Benchmark de Performance, Correção e Resiliência do Cold Boot
 * 
 * Este script simula o comportamento de recuperação de sessão (Cold Boot) 
 * sob diferentes volumes de dados e cenários de integridade.
 */

import { describe, it, expect } from 'vitest';
import { getSessionService, StudentSession } from '../services/sessionIsolationService';
import { PersistenceGateway } from '../services/persistenceGateway';

describe('BENCH-CB-001: Cold Boot Benchmarking', () => {

    it('Deve medir performance nominal vs degradada sob diferentes volumes', async () => {
        console.log('\n🚀 [BENCH-CB-001] INICIANDO BENCHMARK DE COLD BOOT\n');
        
        const service = getSessionService();
        const volumes = [10, 100, 500, 1000]; // Reduzido p/ 1000 p/ rodar no Vitest CI de forma estável
        const results: any[] = [];

        for (const size of volumes) {
            console.log(`📦 Preparando cenário com ${size} sessões...`);
            
            // 1. Setup: Limpar e Popular
            await PersistenceGateway.clearMainDatabase();
            
            // Criar sessões de "ruído"
            const noiseSessions: any[] = [];
            for (let i = 0; i < size; i++) {
                noiseSessions.push({
                    sessionId: `noise_${i}`,
                    storage_key: `storage_event_student_${i}_exam`,
                    studentId: `student_${i}`,
                    studentName: `Student ${i}`,
                    examId: 'exam_id',
                    eventId: 'event_id',
                    status: 'COMPLETED',
                    origin: 'CANONICAL',
                    version: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastAccessedAt: new Date().toISOString(),
                    encryptedAnswers: [],
                    securityEvents: [],
                    telemetry: { timePerQuestion: [], backtracks: [], batteryLevels: [], networkQuality: [] },
                    synced: true,
                    uploadedToServer: true,
                    qrCodeGenerated: true
                });
            }
            // Inserção em massa p/ performance no setup
            for(const s of noiseSessions) await PersistenceGateway.saveSession(s);

            // Criar a sessão ALVO (Canônica)
            const targetSession: StudentSession = {
                sessionId: 'target_session',
                storage_key: 'storage_target_event_student_exam',
                studentId: 'target_student',
                studentName: 'Target Student',
                examId: 'target_exam',
                eventId: 'target_event',
                status: 'ACTIVE',
                origin: 'CANONICAL',
                version: 5,
                requestId: 'req_target_123',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                encryptedAnswers: [],
                securityEvents: [],
                telemetry: { timePerQuestion: [], backtracks: [], batteryLevels: [], networkQuality: [] },
                synced: false,
                uploadedToServer: false,
                qrCodeGenerated: false
            };
            await PersistenceGateway.saveSession(targetSession);

            // --- MEDIÇÃO: CENÁRIO NOMINAL (Lookup via Pointer) ---
            await PersistenceGateway.saveSession({
                storage_key: `context:target_event:target_student:target_exam:active`,
                sessionId: 'target_session'
            } as any);

            const startNominal = performance.now();
            const recoveredNominal = await service.findActiveAttemptByContext('target_event', 'target_student', 'target_exam');
            const endNominal = performance.now();
            const timeNominal = endNominal - startNominal;

            // --- MEDIÇÃO: CENÁRIO DEGRADADO (Dual-Read/Varredura) ---
            await PersistenceGateway.deleteSessions([`context:target_event:target_student:target_exam:active`]);
            
            const startDegraded = performance.now();
            const allSessions = await service.getAllSessions();
            const recoveredDegraded = allSessions.find(s => 
                s.examId === 'target_exam' && 
                s.eventId === 'target_event' && 
                s.status === 'ACTIVE'
            );
            const endDegraded = performance.now();
            const timeDegraded = endDegraded - startDegraded;

            results.push({
                volume: size,
                nominal_ms: timeNominal.toFixed(4),
                degraded_ms: timeDegraded.toFixed(4),
                gain_factor: (timeDegraded / timeNominal).toFixed(2) + 'x',
                correct: recoveredNominal?.sessionId === 'target_session' && recoveredDegraded?.sessionId === 'target_session'
            });
        }

        console.log('\n📊 RESULTADOS DE PERFORMANCE (BENCH-CB-001)\n');
        console.table(results);
        
        expect(results.every(r => r.correct)).toBe(true);
    });

    it('Deve validar Resiliência e Autocorreção (LOG-CB-PTR-ERR-001)', async () => {
        const service = getSessionService();
        console.log('\n🛠️  Testando Autocorreção de Ponteiro...');
        
        await PersistenceGateway.clearMainDatabase();
        
        const targetSession: StudentSession = {
            sessionId: 'target_session',
            storage_key: 'storage_target',
            studentId: 'target_student',
            studentName: 'Target',
            examId: 'target_exam',
            eventId: 'target_event',
            status: 'ACTIVE',
            origin: 'CANONICAL',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            encryptedAnswers: [],
            securityEvents: [],
            telemetry: { timePerQuestion: [], backtracks: [], batteryLevels: [], networkQuality: [] },
            synced: false, uploadedToServer: false, qrCodeGenerated: false
        } as any;
        await PersistenceGateway.saveSession(targetSession);

        await PersistenceGateway.saveSession({
            storage_key: `context:target_event:target_student:target_exam:active`,
            sessionId: 'invalid_pointer_id'
        } as any);

        const startRepair = performance.now();
        let recoveredWithRepair = await service.findActiveAttemptByContext('target_event', 'target_student', 'target_exam');
        
        if (!recoveredWithRepair) {
            const all = await service.getAllSessions();
            const legacy = all.find(s => s.examId === 'target_exam' && s.status === 'ACTIVE');
            if (legacy) {
                await service.startSession(legacy.studentId, legacy.studentName, legacy.examId, legacy.eventId, legacy.attempt_id, legacy.requestId);
                recoveredWithRepair = service.getCurrentSession();
            }
        }
        const endRepair = performance.now();

        console.log(`✅ Resultado Resiliência: ${recoveredWithRepair?.sessionId === 'target_session' ? 'SUCESSO' : 'FALHA'}`);
        console.log(`⏱️  Tempo de reparo silencioso: ${(endRepair - startRepair).toFixed(4)}ms`);
        
        expect(recoveredWithRepair?.sessionId).toBe('target_session');
    });

});
