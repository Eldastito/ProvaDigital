/**
 * @module Gerador de Hash SHA-256
 * @description Calcula hash SHA-256 de cada arquivo dos módulos inventivos
 * para congelar a baseline do código-fonte para o Registro de Software (INPI).
 * 
 * O hash garante integridade e autenticidade do código depositado,
 * servindo como "impressão digital" do software registrado.
 * 
 * Uso: node benchmarks/generate-hashes.js
 * 
 * @patent-safe Evidência de integridade para Registro de Software.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Módulos prioritários para hashing (núcleos inventivos + suporte) */
const PATENT_MODULES = [
    // Núcleo 1: Mesh Offline
    'services/meshNetworkService.ts',
    'services/localServerService.ts',
    'services/webrtcClient.ts',
    'services/bluetoothMeshService.ts',
    'services/wifiHotspotService.ts',
    'services/pilotMeshService.ts',
    'services/telemetryService.ts',
    
    // Núcleo 2: Cold Boot Determinístico
    'services/sessionIsolationService.ts',
    'services/persistenceGateway.ts',
    'services/offlineDb.ts',
    
    // Núcleo 3: Envelope Híbrido Criptográfico
    'services/security/e2eEncryptionService.ts',
    'services/cryptoService.ts',
    
    // Núcleo 4: Governança Multi-Escopo
    'services/governanceService.ts',
    
    // Suporte: Classificação de Segurança
    'constants/securityClassification.ts',
    
    // Tipos canônicos
    'types.ts',
];

/** Módulos de registro de software (funcionalidades gerais) */
const SOFTWARE_REGISTRY_MODULES = [
    // Analytics
    'modules/analytics/AnalyticsDashboard.tsx',
    'modules/analytics/PredictiveRiskDashboard.tsx',
    'modules/analytics/PedagogicalDashboard.tsx',
    'modules/analytics/NetworkDashboardView.tsx',
    'modules/analytics/GeoMap.tsx',
    
    // Builder
    'modules/builder/ExamBuilderView.tsx',
    'modules/builder/AIQuestionGeneratorView.tsx',
    
    // Coordinator
    'modules/coordinator/CommandCenter.tsx',
    'modules/coordinator/RedundancyMonitorView.tsx',
    'modules/coordinator/ExamScheduler.tsx',
    
    // Runner
    'modules/runner/student-app/StudentApp.tsx',
    'modules/runner/student-app/ProfessorApp.tsx',
    'modules/runner/student-app/CoordinatorApp.tsx',
    
    // Student Portal
    'modules/student-portal/StudentDashboardView.tsx',
    'modules/student-portal/OwlTutorView.tsx',
    'modules/student-portal/StudentBattleView.tsx',
    'modules/student-portal/ArcadeView.tsx',
    'modules/student-portal/SurvivalView.tsx',
    
    // Gamification
    'modules/gamification/GamifiedEventsManager.tsx',
    
    // Neuro Screening
    'modules/neuro-screening/NeuroScreeningView.tsx',
    
    // Communication
    'modules/communication/CommunicationView.tsx',
    
    // School Management
    'modules/school-management/ManagementView.tsx',
];

function calculateSHA256(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function generateHashes() {
    const rootDir = path.resolve(__dirname, '..');
    const allModules = [...PATENT_MODULES, ...SOFTWARE_REGISTRY_MODULES];
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  FORGE — Hash SHA-256 de Integridade (Baseline)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log(`  Arquivos: ${allModules.length}`);
    console.log('───────────────────────────────────────────────────────────\n');
    
    const results = {
        generatedAt: new Date().toISOString(),
        algorithm: 'SHA-256',
        rootDirectory: rootDir,
        patentModules: {},
        softwareRegistryModules: {},
        summary: {
            totalFiles: 0,
            totalBytes: 0,
            patentFiles: 0,
            registryFiles: 0,
        },
    };
    
    // Hash módulos de patente
    console.log('📋 MÓDULOS DE PATENTE (Núcleos Inventivos):');
    for (const mod of PATENT_MODULES) {
        const fullPath = path.join(rootDir, mod);
        if (fs.existsSync(fullPath)) {
            const hash = calculateSHA256(fullPath);
            const stat = fs.statSync(fullPath);
            results.patentModules[mod] = {
                sha256: hash,
                sizeBytes: stat.size,
                lastModified: stat.mtime.toISOString(),
            };
            results.summary.patentFiles++;
            results.summary.totalFiles++;
            results.summary.totalBytes += stat.size;
            console.log(`  ✅ ${mod}`);
            console.log(`     SHA-256: ${hash}`);
            console.log(`     Tamanho: ${stat.size} bytes`);
        } else {
            console.log(`  ⚠️ ${mod} — ARQUIVO NÃO ENCONTRADO`);
            results.patentModules[mod] = { error: 'FILE_NOT_FOUND' };
        }
    }
    
    console.log('\n📋 MÓDULOS DE REGISTRO DE SOFTWARE:');
    for (const mod of SOFTWARE_REGISTRY_MODULES) {
        const fullPath = path.join(rootDir, mod);
        if (fs.existsSync(fullPath)) {
            const hash = calculateSHA256(fullPath);
            const stat = fs.statSync(fullPath);
            results.softwareRegistryModules[mod] = {
                sha256: hash,
                sizeBytes: stat.size,
                lastModified: stat.mtime.toISOString(),
            };
            results.summary.registryFiles++;
            results.summary.totalFiles++;
            results.summary.totalBytes += stat.size;
            console.log(`  ✅ ${mod}`);
            console.log(`     SHA-256: ${hash}`);
        } else {
            console.log(`  ⚠️ ${mod} — ARQUIVO NÃO ENCONTRADO`);
            results.softwareRegistryModules[mod] = { error: 'FILE_NOT_FOUND' };
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  RESUMO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Arquivos de Patente: ${results.summary.patentFiles}`);
    console.log(`  Arquivos de Registro: ${results.summary.registryFiles}`);
    console.log(`  Total: ${results.summary.totalFiles} arquivos, ${(results.summary.totalBytes / 1024).toFixed(1)} KB`);
    
    // Salvar JSON
    const outputPath = path.join(rootDir, 'REPORTS', 'HASH_INTEGRIDADE_BASELINE.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📁 Hashes salvos em: ${outputPath}`);
    
    return results;
}

generateHashes();
