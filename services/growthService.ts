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
        // Implementação futura para dashboards de rede
        return { classId, avgDelta: 0 };
    }
};
