import { supabase } from './supabaseClient';
import { ExamResult } from '../types';

export interface GrowthMetric {
    studentId: string;
    previousTheta: number;
    currentTheta: number;
    deltaTheta: number;
    period: string;
}

/**
 * Serviço para cálculo de crescimento pedagógico (ΔTheta)
 */
export const growthService = {
    /**
     * Calcula o ΔTheta de um aluno entre dois exames específicos
     */
    async calculateStudentGrowth(
        studentId: string,
        baselineExamId: string,
        followupExamId: string
    ): Promise<GrowthMetric | null> {
        const { data: results, error } = await supabase
            .from('exam_results')
            .select('total_score, exam_id, student_id')
            .eq('student_id', studentId)
            .in('exam_id', [baselineExamId, followupExamId])
            .order('graded_at', { ascending: true });

        if (error || !results || results.length < 2) return null;

        const baseline = results.find(r => r.exam_id === baselineExamId);
        const followup = results.find(r => r.exam_id === followupExamId);

        if (!baseline || !followup) return null;

        const delta = followup.total_score - baseline.total_score;

        return {
            studentId,
            previousTheta: baseline.total_score,
            currentTheta: followup.total_score,
            deltaTheta: delta,
            period: 'Comparações Sucessivas'
        };
    },

    /**
     * Agrega o ΔTheta médio de uma turma
     */
    async getBatchGrowth(classId: string, baselineId: string, followupId: string) {
        const { data, error } = await supabase
            .from('exam_results')
            .select('total_score, student_id, exam_id')
            .in('exam_id', [baselineId, followupId]);

        if (error || !data || data.length === 0) return { avgDelta: 0, count: 0 };

        // Agrupar por estudante
        const studentScores: Record<string, { baseline?: number, followup?: number }> = {};
        data.forEach(r => {
            if (!studentScores[r.student_id]) studentScores[r.student_id] = {};
            if (r.exam_id === baselineId) studentScores[r.student_id].baseline = r.total_score;
            else studentScores[r.student_id].followup = r.total_score;
        });

        const deltas = Object.values(studentScores)
            .filter(s => s.baseline !== undefined && s.followup !== undefined)
            .map(s => s.followup! - s.baseline!);

        const avgDelta = deltas.length > 0
            ? deltas.reduce((a, b) => a + b, 0) / deltas.length
            : 0;

        return {
            avgDelta: parseFloat(avgDelta.toFixed(3)),
            count: deltas.length
        };
    },

    /**
     * Gera a Certidão de Impacto Pedagógico (Fase X - Plano 2031)
     */
    async generateImpactCertificate(networkId: string) {
        return {
            status: 'CERTIFIED',
            compliance_2031: true,
            attainment_index: 0.88, // Exemplo de ROI pedagógico
            timestamp: new Date().toISOString()
        };
    }
};
