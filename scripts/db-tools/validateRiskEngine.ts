/**
 * Script de Validação do Motor de Risco
 * 
 * Testa o algoritmo com dados reais e gera relatório
 */

import { useAppStore } from '../store/useAppStore';
import { calculateRiskScore, calculateSchoolRisk } from './riskDetectionEngine';
import { RiskLevel } from '../types';

export const validateRiskEngine = () => {
    const state = useAppStore.getState();

    console.log('🔍 VALIDAÇÃO DO MOTOR DE DETECÇÃO DE RISCO\n');
    console.log('='.repeat(80));

    // Testar com alguns alunos
    const sampleStudents = state.students.slice(0, 10);

    console.log(`\n📊 Analisando ${sampleStudents.length} alunos...\n`);

    const assessments = sampleStudents.map(student => {
        const studentResults = state.results.filter(r => r.studentId === student.id);
        const assessment = calculateRiskScore(student, studentResults);

        console.log(`\n👤 ${assessment.studentName} (${student.registrationNumber})`);
        console.log(`   Score de Risco: ${assessment.riskScore}/100`);
        console.log(`   Nível: ${assessment.riskLevel}`);

        if (assessment.factors.length > 0) {
            console.log(`   Fatores de Risco:`);
            assessment.factors.forEach(factor => {
                console.log(`     • ${factor.name} (${factor.severity}): ${factor.value}`);
                console.log(`       → ${factor.recommendation}`);
            });
        } else {
            console.log(`   ✅ Sem fatores de risco identificados`);
        }

        if (assessment.interventions.length > 0) {
            console.log(`   Intervenções Sugeridas:`);
            assessment.interventions.slice(0, 2).forEach(intervention => {
                console.log(`     ${intervention.priority === 'URGENT' ? '🚨' : '⚠️'} ${intervention.action} (${intervention.target})`);
            });
        }

        return assessment;
    });

    // Estatísticas gerais
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 ESTATÍSTICAS GERAIS\n');

    const highRisk = assessments.filter(a => a.riskLevel === RiskLevel.HIGH).length;
    const mediumRisk = assessments.filter(a => a.riskLevel === RiskLevel.MEDIUM).length;
    const lowRisk = assessments.filter(a => a.riskLevel === RiskLevel.LOW).length;

    console.log(`   🔴 Risco ALTO: ${highRisk} alunos (${(highRisk / sampleStudents.length * 100).toFixed(1)}%)`);
    console.log(`   🟡 Risco MÉDIO: ${mediumRisk} alunos (${(mediumRisk / sampleStudents.length * 100).toFixed(1)}%)`);
    console.log(`   🟢 Risco BAIXO: ${lowRisk} alunos (${(lowRisk / sampleStudents.length * 100).toFixed(1)}%)`);

    const avgScore = assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length;
    console.log(`\n   Média de Score: ${avgScore.toFixed(1)}/100`);

    // Fatores mais comuns
    const allFactors = assessments.flatMap(a => a.factors);
    const factorCounts: Record<string, number> = {};
    allFactors.forEach(f => {
        factorCounts[f.name] = (factorCounts[f.name] || 0) + 1;
    });

    console.log(`\n   Fatores Mais Comuns:`);
    Object.entries(factorCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
            console.log(`     • ${name}: ${count} alunos`);
        });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Validação concluída!\n');

    return {
        totalAnalyzed: sampleStudents.length,
        highRisk,
        mediumRisk,
        lowRisk,
        avgScore,
        assessments
    };
};

// Exportar para uso no console do navegador
if (typeof window !== 'undefined') {
    (window as any).validateRiskEngine = validateRiskEngine;
}
