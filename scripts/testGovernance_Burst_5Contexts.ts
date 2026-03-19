
import { governanceService, GovernanceContext, OrganizationType } from '../services/governanceService';
import { User, UserRole } from '../types';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Script de Burst Simultâneo (Fase 4)
 * Objetivo: Estressar a governança contextual em 5 municípios ativos.
 */

// --- CONFIGURAÇÃO E THRESHOLDS ---
const ORGS: string[] = ['poa_organization', 'canoas_organization', 'alvorada_organization', 'viamao_organization', 'gravatai_organization'];

const TARGETS = {
    whitelisted_read_targets: ['ANALYTICS', 'SCHOOL_AGGREGATE_DATA', 'INSTITUTIONAL_METADATA'],
    sensitive_read_targets: ['STUDENT_PEDAGOGICAL_DATA'],
    forbidden_write_targets: ['EXAMEPAD_OPS', 'SAAS_PLATFORM', 'FINANCE'],
    cross_org_targets: ORGS
};

const THRESHOLDS = {
    p95_L1_L2: 5.0,
    p95_L3: 7.0,
    p99: 10.0,
    error_rate_max: 0.001, // 0.1%
    recovery_delta_max_pct: 10.0
};

const PHASE_CONFIG = {
    warmup: { concurrency: 5, durationMs: 60000 }, // 1 min warm-up
    L1: { concurrency: 20, durationMs: 120000 },   // 2 min (reduzido para execução rápida em dev)
    L2: { concurrency: 50, durationMs: 120000 },   // 2 min
    L3: { concurrency: 100, durationMs: 120000 },  // 2 min
    recovery: { concurrency: 5, durationMs: 60000 } // 1 min recovery
};

// --- ESTRUTURAS DE DADOS ---
interface RequestResult {
    orgId: string;
    resource: string;
    action: string;
    latency: number;
    decision: boolean;
    error: boolean;
    type: 'OPERATIONAL' | 'ADVERSARIAL_CROSS' | 'ADVERSARIAL_SENSITIVE' | 'ADVERSARIAL_WRITE';
}

interface PhaseMetrics {
    phase: string;
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    avgLatency: number;
    p50: number;
    p95: number;
    p99: number;
    governance: {
        fallbackCount: number;
        autoDisableCount: number;
        crossOrgLeak: number;
        writeEscape: number;
        readonly_block_count: number;
        shadow_delegation_count: number;
        mutation_delegation_count: number;
        legacy_allow_count_for_mutations: number;
        denyHistogram: Record<string, number>;
    };
    infra: {
        cpuLoad: number | 'unavailable';
        memUsageMB: number | 'unavailable';
        dbLatencyAvg: number | 'unavailable';
        poolUsage: number | 'unavailable';
    };
}

// --- UTILS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getPercentile(data: number[], percentile: number): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.ceil(percentile * sorted.length) - 1;
    return sorted[index];
}

function getInfraMetrics() {
    try {
        const load = os.loadavg()[0];
        const mem = process.memoryUsage().rss / 1024 / 1024;
        return {
            cpuLoad: load,
            memUsageMB: mem,
            dbLatencyAvg: 'unavailable' as const, // Simulado como indisponível conforme regra
            poolUsage: 'unavailable' as const
        };
    } catch (e) {
        return {
            cpuLoad: 'unavailable' as const,
            memUsageMB: 'unavailable' as const,
            dbLatencyAvg: 'unavailable' as const,
            poolUsage: 'unavailable' as const
        };
    }
}

// --- CORE TEST LOGIC ---
async function runPhase(phaseName: string, config: typeof PHASE_CONFIG.L1, profile: 'operational' | 'adversarial', seed: number): Promise<PhaseMetrics> {
    console.log(`\n[${phaseName}] Iniciando burst (${profile}) - Concorrência: ${config.concurrency}...`);
    
    const results: RequestResult[] = [];
    const startTime = performance.now();
    const endTime = startTime + config.durationMs;
    
    const governBaseline = governanceService.getAuthorityPilotStatus();
    let crossOrgLeaks = 0;
    let writeEscapes = 0;
    const denyHistogram: Record<string, number> = {};

    while (performance.now() < endTime) {
        const batch: Promise<RequestResult>[] = [];
        
        for (let i = 0; i < config.concurrency; i++) {
            batch.push((async () => {
                const orgId = ORGS[Math.floor(Math.random() * ORGS.length)];
                let resource: string;
                let action: string = 'VIEW';
                let targetOrgId: string | undefined = undefined;
                let type: RequestResult['type'] = 'OPERATIONAL';

                // Distribuição de Perfil
                const rand = Math.random();
                if (profile === 'operational') {
                    resource = TARGETS.whitelisted_read_targets[Math.floor(Math.random() * TARGETS.whitelisted_read_targets.length)];
                    type = 'OPERATIONAL';
                } else {
                    // Adversarial Profile: 70/15/10/5
                    if (rand < 0.70) {
                        resource = TARGETS.whitelisted_read_targets[Math.floor(Math.random() * TARGETS.whitelisted_read_targets.length)];
                        type = 'OPERATIONAL';
                    } else if (rand < 0.85) {
                        resource = TARGETS.whitelisted_read_targets[Math.floor(Math.random() * TARGETS.whitelisted_read_targets.length)];
                        targetOrgId = ORGS.find(o => o !== orgId);
                        type = 'ADVERSARIAL_CROSS';
                    } else if (rand < 0.95) {
                        resource = TARGETS.sensitive_read_targets[Math.floor(Math.random() * TARGETS.sensitive_read_targets.length)];
                        type = 'ADVERSARIAL_SENSITIVE';
                    } else {
                        resource = TARGETS.forbidden_write_targets[Math.floor(Math.random() * TARGETS.forbidden_write_targets.length)];
                        action = 'CREATE';
                        type = 'ADVERSARIAL_WRITE';
                    }
                }

                const context: GovernanceContext = {
                    activeOrganizationId: orgId,
                    activeMembershipId: `user_${orgId}_${i}`,
                    activeScopeType: 'ORG',
                    roleId: 'municipal_secretariat_admin',
                    organizationType: 'municipal_secretariat',
                    targetOrganizationId: targetOrgId
                };

                const reqStart = performance.now();
                let decision = false;
                let error = false;
                
                try {
                    decision = governanceService.can(resource, action, context, true, 'BURST_TEST');
                    
                    // Validação de Escapes
                    if (type === 'ADVERSARIAL_CROSS' && decision === true) crossOrgLeaks++;
                    if (type === 'ADVERSARIAL_WRITE' && decision === true) writeEscapes++;
                    if (decision === false) {
                        const reason = `${resource}:${action}`;
                        denyHistogram[reason] = (denyHistogram[reason] || 0) + 1;
                    }

                } catch (e) {
                    error = true;
                }
                const reqEnd = performance.now();

                return {
                    orgId,
                    resource,
                    action,
                    latency: reqEnd - reqStart,
                    decision,
                    error,
                    type
                };
            })());
        }

        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        
        // Pacing: Pequeno delay para evitar saturação instantânea do event loop sem controle
        await delay(50); 
    }

    const latencies = results.map(r => r.latency);
    const finalGovern = governanceService.getAuthorityPilotStatus();

    return {
        phase: phaseName,
        totalRequests: results.length,
        successRequests: results.filter(r => !r.error).length,
        errorRequests: results.filter(r => r.error).length,
        avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
        p50: getPercentile(latencies, 0.50),
        p95: getPercentile(latencies, 0.95),
        p99: getPercentile(latencies, 0.99),
        infra: getInfraMetrics(),
        governance: {
            fallbackCount: finalGovern.fallbackCount - governBaseline.fallbackCount,
            autoDisableCount: finalGovern.enabled === false && governBaseline.enabled === true ? 1 : 0,
            crossOrgLeak: crossOrgLeaks,
            writeEscape: writeEscapes,
            readonly_block_count: (finalGovern as any).telemetry.readonly_block_count - (governBaseline as any).telemetry.readonly_block_count,
            shadow_delegation_count: (finalGovern as any).telemetry.shadow_delegation_count - (governBaseline as any).telemetry.shadow_delegation_count,
            mutation_delegation_count: (finalGovern as any).telemetry.mutation_delegation_count - (governBaseline as any).telemetry.mutation_delegation_count,
            legacy_allow_count_for_mutations: (finalGovern as any).telemetry.legacy_allow_count_for_mutations - (governBaseline as any).telemetry.legacy_allow_count_for_mutations,
            denyHistogram
        }
    };
}

async function main() {
    const args = process.argv.slice(2);
    const profile = (args.find(a => a.startsWith('--profile='))?.split('=')[1] || 'operational') as 'operational' | 'adversarial';
    const seed = parseInt(args.find(a => a.startsWith('--seed='))?.split('=')[1] || '42');
    
    console.log(`[BURST_TEST] Iniciando Profile: ${profile.toUpperCase()} | Seed: ${seed}`);
    
    // Gate: Preflight
    console.log(`[PREFLIGHT] Ativando Pilot Mode...`);
    governanceService.setAuthorityPilot(true);

    const report: PhaseMetrics[] = [];
    
    try {
        // Sequência de Fases
        report.push(await runPhase('WARMUP', PHASE_CONFIG.warmup, 'operational', seed));
        report.push(await runPhase('LEVEL_1', PHASE_CONFIG.L1, profile, seed));
        report.push(await runPhase('LEVEL_2', PHASE_CONFIG.L2, profile, seed));
        report.push(await runPhase('LEVEL_3', PHASE_CONFIG.L3, profile, seed));
        report.push(await runPhase('RECOVERY', PHASE_CONFIG.recovery, 'operational', seed));

        // Avaliação GO/NO-GO
        const l1 = report.find(r => r.phase === 'LEVEL_1')!;
        const l3 = report.find(r => r.phase === 'LEVEL_3')!;
        const recovery = report.find(r => r.phase === 'RECOVERY')!;
        const warmup = report.find(r => r.phase === 'WARMUP')!;

        let exitCode = 0;
        let reason = 'Aprovado por performance e governança.';

        const totalLeaks = report.reduce((a, b) => a + b.governance.crossOrgLeak, 0);
        const totalEscapes = report.reduce((a, b) => a + b.governance.writeEscape, 0);

        if (totalLeaks > 0 || totalEscapes > 0) {
            exitCode = 2;
            reason = 'Falha de Governança: Vazamento detectado.';
        } else if (l1.p95 > THRESHOLDS.p95_L1_L2 || l3.p95 > THRESHOLDS.p95_L3) {
            exitCode = 1;
            reason = 'Falha de Performance: Threshold de p95 excedido.';
        } else if (l1.errorRequests / l1.totalRequests > THRESHOLDS.error_rate_max) {
            exitCode = 1;
            reason = 'Falha de Performance: Taxa de erro alta.';
        }

        // Geração de Artefatos
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = path.join(process.cwd(), 'artifacts', `burst_5contexts_${timestamp}.json`);
        const mdPath = path.join(process.cwd(), 'docs', `REPORT_BURST_5_CONTEXTS.md`);

        if (!fs.existsSync(path.join(process.cwd(), 'artifacts'))) fs.mkdirSync(path.join(process.cwd(), 'artifacts'));

        fs.writeFileSync(jsonPath, JSON.stringify({ profile, seed, THRESHOLDS, results: report, finalDecision: reason, exitCode }, null, 2));

        const mdContent = `
# Relatório de Burst: 5 Contextos Simultâneos (Fase 4)

**Profile:** ${profile.toUpperCase()}
**Timestamp:** ${new Date().toISOString()}
**Decision:** ${exitCode === 0 ? '✅ GO' : '❌ NO-GO'} - ${reason}

## 📊 Performance por Fase

| Fase | Requests | p50 | p95 | p99 | Erros | CPU (avg) | Mem (avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${report.map(r => `| ${r.phase} | ${r.totalRequests} | ${r.p50.toFixed(2)}ms | **${r.p95.toFixed(2)}ms** | ${r.p99.toFixed(2)}ms | ${r.errorRequests} | ${r.infra.cpuLoad === 'unavailable' ? 'N/A' : r.infra.cpuLoad.toFixed(2)} | ${r.infra.memUsageMB === 'unavailable' ? 'N/A' : r.infra.memUsageMB.toFixed(0)}MB |`).join('\n')}

## 🛡️ Integridade de Governança

| Fase | Leak | Escape | Block (RO) | Shadow | Mut. Del. | Legacy M. Allow | Fallback |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${report.map(r => `| ${r.phase} | ${r.governance.crossOrgLeak} | ${r.governance.writeEscape} | ${r.governance.readonly_block_count} | ${r.governance.shadow_delegation_count} | ${r.governance.mutation_delegation_count} | ${r.governance.legacy_allow_count_for_mutations} | ${r.governance.fallbackCount} |`).join('\n')}

## 🛑 Histograma de Deny (Top 5)
${Object.entries(report.reduce((acc, r) => {
    Object.entries(r.governance.denyHistogram).forEach(([k, v]) => acc[k] = (acc[k] || 0) + v);
    return acc;
}, {} as Record<string, number>))
.sort((a, b) => b[1] - a[1])
.slice(0, 5)
.map(([k, v]) => `- ${k}: ${v} denies`).join('\n')}

## 🏁 Veredito Final
**Exit Code:** ${exitCode}
**Justificativa:** ${reason}
`;

        fs.writeFileSync(mdPath, mdContent);
        console.log(`\n[BURST_TEST] Relatórios gerados em:\n- ${jsonPath}\n- ${mdPath}`);
        
        process.exit(exitCode);

    } catch (e) {
        console.error(`[FATAL_ERROR] Falha na execução do burst.`, e);
        process.exit(3);
    }
}

main();
