/**
 * @module Benchmark: E2E Encryption Performance
 * @description Script de benchmark para medir performance criptográfica
 * do E2EEncryptionService e CryptoService.
 * 
 * Métricas coletadas:
 * - Derivação de chave PBKDF2 (100K iterações SHA-256)
 * - Cifra/Decifra AES-256-GCM para payloads de 1KB, 10KB, 100KB
 * - Assinatura/Verificação HMAC-SHA256
 * - Geração de Token Mesh (JTI + Assinatura)
 * - Wrap/Unwrap de chave RSA-OAEP (2048-bit)
 * 
 * Uso: npx ts-node benchmarks/benchmark-encryption.ts
 * 
 * @patent-safe Evidência formal EV-SEC-ENV-001 para dossiê de patente.
 */

import { E2EEncryptionService } from '../services/security/e2eEncryptionService';
import { cryptoService } from '../services/cryptoService';

interface CryptoBenchmarkResult {
    scenario: string;
    payloadSize?: string;
    iterations: number;
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

function buildResult(scenario: string, latencies: number[], payloadSize?: string): CryptoBenchmarkResult {
    return {
        scenario,
        payloadSize,
        iterations: latencies.length,
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

function generatePayload(sizeKB: number): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    const charsPerField = 100;
    const fieldsNeeded = Math.ceil((sizeKB * 1024) / charsPerField);
    for (let i = 0; i < fieldsNeeded; i++) {
        data[`field_${i}`] = 'x'.repeat(charsPerField);
    }
    return data;
}

async function benchmarkKeyDerivation(iterations: number): Promise<CryptoBenchmarkResult> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await E2EEncryptionService.deriveStudentKey(`event_${i}`, `student_${i}`);
        const end = performance.now();
        latencies.push(end - start);
    }

    return buildResult('PBKDF2_KEY_DERIVATION_100K_SHA256', latencies);
}

async function benchmarkEncryptDecrypt(iterations: number, sizeKB: number): Promise<CryptoBenchmarkResult[]> {
    const results: CryptoBenchmarkResult[] = [];
    const payload = generatePayload(sizeKB);
    const key = await E2EEncryptionService.deriveStudentKey('bench_event', 'bench_student');

    // Encrypt benchmark
    const encLatencies: number[] = [];
    let lastEncrypted;
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        lastEncrypted = await E2EEncryptionService.encryptData(payload, key);
        const end = performance.now();
        encLatencies.push(end - start);
    }
    results.push(buildResult(`AES_256_GCM_ENCRYPT`, encLatencies, `${sizeKB}KB`));

    // Decrypt benchmark
    if (lastEncrypted) {
        const decLatencies: number[] = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await E2EEncryptionService.decryptData(lastEncrypted, key);
            const end = performance.now();
            decLatencies.push(end - start);
        }
        results.push(buildResult(`AES_256_GCM_DECRYPT`, decLatencies, `${sizeKB}KB`));
    }

    return results;
}

async function benchmarkHMAC(iterations: number): Promise<CryptoBenchmarkResult[]> {
    const results: CryptoBenchmarkResult[] = [];
    const data = JSON.stringify({ studentId: 'test', answers: Array(50).fill('A') });
    const secret = 'bench_secret_key';

    // Sign
    const signLatencies: number[] = [];
    let lastSignature = '';
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        lastSignature = await E2EEncryptionService.signPayload(data, secret);
        const end = performance.now();
        signLatencies.push(end - start);
    }
    results.push(buildResult('HMAC_SHA256_SIGN', signLatencies));

    // Verify
    const verifyLatencies: number[] = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await E2EEncryptionService.verifySignature(data, lastSignature, secret);
        const end = performance.now();
        verifyLatencies.push(end - start);
    }
    results.push(buildResult('HMAC_SHA256_VERIFY', verifyLatencies));

    return results;
}

async function benchmarkMeshToken(iterations: number): Promise<CryptoBenchmarkResult> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await E2EEncryptionService.createMeshToken(
            `student_${i}`, `tablet_${i}`, `event_${i}`, 'STUDENT', 'bench_mesh_secret'
        );
        const end = performance.now();
        latencies.push(end - start);
    }

    return buildResult('MESH_TOKEN_CREATION_JTI_HMAC', latencies);
}

async function benchmarkRSAKeyGen(iterations: number): Promise<CryptoBenchmarkResult> {
    const latencies: number[] = [];

    for (let i = 0; i < Math.min(iterations, 10); i++) { // RSA keygen is slow
        const start = performance.now();
        await cryptoService.generateKeyPair();
        const end = performance.now();
        latencies.push(end - start);
    }

    return buildResult('RSA_OAEP_2048_KEYGEN', latencies);
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function runCryptoBenchmarks() {
    const ITERATIONS = 100;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  FORGE — Benchmark E2E Encryption (EV-SEC-ENV-001)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Iterações por cenário: ${ITERATIONS}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log('───────────────────────────────────────────────────────────\n');

    const results: CryptoBenchmarkResult[] = [];

    console.log('🔐 Cenário 1: Derivação de chave PBKDF2...');
    results.push(await benchmarkKeyDerivation(ITERATIONS));

    console.log('🔐 Cenário 2: AES-256-GCM (1KB)...');
    results.push(...await benchmarkEncryptDecrypt(ITERATIONS, 1));

    console.log('🔐 Cenário 3: AES-256-GCM (10KB)...');
    results.push(...await benchmarkEncryptDecrypt(ITERATIONS, 10));

    console.log('🔐 Cenário 4: AES-256-GCM (100KB)...');
    results.push(...await benchmarkEncryptDecrypt(ITERATIONS, 100));

    console.log('🔐 Cenário 5: HMAC-SHA256 (Sign + Verify)...');
    results.push(...await benchmarkHMAC(ITERATIONS));

    console.log('🔐 Cenário 6: Mesh Token (JTI + HMAC)...');
    results.push(await benchmarkMeshToken(ITERATIONS));

    console.log('🔐 Cenário 7: RSA-OAEP 2048 KeyGen (10 iterações)...');
    results.push(await benchmarkRSAKeyGen(ITERATIONS));

    // Relatório
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  RESULTADOS');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const r of results) {
        const size = r.payloadSize ? ` [${r.payloadSize}]` : '';
        console.log(`📊 ${r.scenario}${size}`);
        console.log(`   p50: ${r.p50.toFixed(2)}ms | p95: ${r.p95.toFixed(2)}ms | p99: ${r.p99.toFixed(2)}ms`);
        console.log(`   mean: ${r.mean.toFixed(2)}ms | min: ${r.min.toFixed(2)}ms | max: ${r.max.toFixed(2)}ms`);
        console.log('');
    }

    // Output JSON para evidência formal
    const evidence = {
        id: 'EV-SEC-ENV-001',
        description: 'Benchmark E2E Encryption — Envelope Híbrido Criptográfico',
        platform: 'FORGE/ExamePad',
        iterations: ITERATIONS,
        environment: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        timestamp: new Date().toISOString(),
        results,
    };

    console.log('\n📋 EVIDÊNCIA FORMAL (JSON):');
    console.log(JSON.stringify(evidence, null, 2));

    return evidence;
}

if (typeof require !== 'undefined' && require.main === module) {
    runCryptoBenchmarks().catch(console.error);
}

export { runCryptoBenchmarks, CryptoBenchmarkResult };
