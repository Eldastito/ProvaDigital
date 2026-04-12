/**
 * @module Benchmark: Cold Boot Determinístico
 * @description Script de benchmark para medir performance da retomada de sessão
 * via Context Pointer canônico do SessionIsolationService.
 * 
 * Métricas coletadas:
 * - Latência p50/p95/p99 de retomada direta (sessão ACTIVE encontrada)
 * - Latência de novo início (sem sessão anterior)
 * - Latência de lookup do Context Pointer
 * - Throughput de operações de persistência
 * 
 * Uso: npx ts-node benchmarks/benchmark-cold-boot.ts
 * 
 * @patent-safe Evidência formal EV-DET-CB-001 para dossiê de patente.
 */

import { SessionIsolationService } from '../services/sessionIsolationService';
import { PersistenceGateway } from '../services/persistenceGateway';

interface BenchmarkResult {
    scenario: string;
    iterations: number;
    latencies: number[];
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    min: number;
    max: number;
    unit: 'ms';
    timestamp: string;
}

function calculatePercentile(arr: number[], percentile: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

function buildResult(scenario: string, latencies: number[]): BenchmarkResult {
    return {
        scenario,
        iterations: latencies.length,
        latencies,
        p50: calculatePercentile(latencies, 50),
        p95: calculatePercentile(latencies, 95),
        p99: calculatePercentile(latencies, 99),
        mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        min: Math.min(...latencies),
        max: Math.max(...latencies),
        unit: 'ms',
        timestamp: new Date().toISOString(),
    };
}

async function benchmarkNewSession(iterations: number): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const service = new SessionIsolationService();

    for (let i = 0; i < iterations; i++) {
        const studentId = `bench_student_${i}`;
        const eventId = `bench_event_${i}`;
        const examId = `bench_exam_${i}`;
        const requestId = `bench_req_${i}`;

        const start = performance.now();
        await service.startSession(studentId, `Aluno ${i}`, examId, eventId, undefined, requestId);
        const end = performance.now();

        latencies.push(end - start);
        service.logout();
    }

    return buildResult('NEW_SESSION_CREATION', latencies);
}

async function benchmarkResumeFromRAM(iterations: number): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const service = new SessionIsolationService();

    // Criar uma sessão primeiro
    await service.startSession('ram_student', 'RAM Student', 'ram_exam', 'ram_event');

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await service.startSession('ram_student', 'RAM Student', 'ram_exam', 'ram_event');
        const end = performance.now();
        latencies.push(end - start);
    }

    service.logout();
    return buildResult('RESUME_FROM_RAM', latencies);
}

async function benchmarkIdempotency(iterations: number): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const service = new SessionIsolationService();
    const requestId = 'idempotent_req_001';

    // Criar sessão com requestId
    await service.startSession('idemp_student', 'Idemp Student', 'idemp_exam', 'idemp_event', undefined, requestId);

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await service.startSession('idemp_student', 'Idemp Student', 'idemp_exam', 'idemp_event', undefined, requestId);
        const end = performance.now();
        latencies.push(end - start);
    }

    service.logout();
    return buildResult('IDEMPOTENCY_CHECK_RAM', latencies);
}

async function benchmarkContextPointerLookup(iterations: number): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const service = new SessionIsolationService();

    // Criar sessão para criar o context pointer
    await service.startSession('ptr_student', 'Ptr Student', 'ptr_exam', 'ptr_event');
    service.logout(); // Limpar RAM para forçar lookup via persistência

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await service.findActiveAttemptByContext('ptr_event', 'ptr_student', 'ptr_exam');
        const end = performance.now();
        latencies.push(end - start);
    }

    return buildResult('CONTEXT_POINTER_LOOKUP_O1', latencies);
}

async function benchmarkSaveAnswer(iterations: number): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    const service = new SessionIsolationService();
    await service.startSession('ans_student', 'Ans Student', 'ans_exam', 'ans_event');

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await service.saveAnswer(i + 1, `Resposta ${i}`);
        const end = performance.now();
        latencies.push(end - start);
    }

    service.logout();
    return buildResult('SAVE_ANSWER_PERSISTENCE', latencies);
}

async function benchmarkFinishSession(iterations: number): Promise<BenchmarkResult> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const service = new SessionIsolationService();
        await service.startSession(`fin_student_${i}`, `Fin ${i}`, `fin_exam_${i}`, `fin_event_${i}`);
        await service.saveAnswer(1, 'A');

        const start = performance.now();
        await service.finishSession();
        const end = performance.now();

        latencies.push(end - start);
    }

    return buildResult('FINISH_SESSION_TRANSITION', latencies);
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function runBenchmarks() {
    const ITERATIONS = 100;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  FORGE — Benchmark Cold Boot Determinístico (EV-DET-CB-001)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Iterações por cenário: ${ITERATIONS}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log('───────────────────────────────────────────────────────────\n');

    const results: BenchmarkResult[] = [];

    console.log('🔄 Cenário 1: Criação de nova sessão...');
    results.push(await benchmarkNewSession(ITERATIONS));

    console.log('🔄 Cenário 2: Retomada da RAM...');
    results.push(await benchmarkResumeFromRAM(ITERATIONS));

    console.log('🔄 Cenário 3: Checagem de idempotência (RAM)...');
    results.push(await benchmarkIdempotency(ITERATIONS));

    console.log('🔄 Cenário 4: Context Pointer Lookup O(1)...');
    results.push(await benchmarkContextPointerLookup(ITERATIONS));

    console.log('🔄 Cenário 5: Salvar resposta (persistência)...');
    results.push(await benchmarkSaveAnswer(ITERATIONS));

    console.log('🔄 Cenário 6: Finalização de sessão (transição COMPLETED)...');
    results.push(await benchmarkFinishSession(ITERATIONS));

    // Relatório
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  RESULTADOS');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const r of results) {
        console.log(`📊 ${r.scenario}`);
        console.log(`   p50: ${r.p50.toFixed(2)}ms | p95: ${r.p95.toFixed(2)}ms | p99: ${r.p99.toFixed(2)}ms`);
        console.log(`   mean: ${r.mean.toFixed(2)}ms | min: ${r.min.toFixed(2)}ms | max: ${r.max.toFixed(2)}ms`);
        console.log('');
    }

    // Output JSON para evidência formal
    const evidence = {
        id: 'EV-DET-CB-001',
        description: 'Benchmark Cold Boot Determinístico — Context Pointer Canônico',
        platform: 'FORGE/ExamePad',
        iterations: ITERATIONS,
        environment: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        timestamp: new Date().toISOString(),
        results: results.map(({ latencies, ...rest }) => rest),
    };

    console.log('\n📋 EVIDÊNCIA FORMAL (JSON):');
    console.log(JSON.stringify(evidence, null, 2));

    return evidence;
}

// Executar se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
    runBenchmarks().catch(console.error);
}

export { runBenchmarks, BenchmarkResult };
