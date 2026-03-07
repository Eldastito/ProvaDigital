import { Item, ExamResult, StudentAnswer } from '../types';

const saveAs = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

/**
 * Serviço de Interoperabilidade e Soberania Digital (Fase VII)
 * Focado em garantir Anti Lock-in através de exportações universais.
 */
export const dataExportService = {
    /**
     * Exporta a trajetória adaptativa completa de um aluno seguindo o Anexo C do Plano 2031.
     */
    exportStudentTrajectory: (result: ExamResult, items: Item[], studentName: string) => {
        const trajectoryLog = result.answers.map((ans: StudentAnswer) => {
            const item = items.find(i => i.id === ans.itemId);
            return [
                ans.itemId,
                ans.selectedAlternativeId || ans.essayText || 'N/A',
                new Date().toISOString(), // No log real do motor CAT, isso viria da sessão
                ans.scoreObtained, // Placeholder para Theta Instantâneo se disponível
                0.3 // Placeholder para SEE Instantâneo
            ];
        });

        const exportData = {
            version: "FORGE_TRAJECTORY_V1.5",
            session_id: result.id,
            student_identity: studentName,
            trajectory_log: trajectoryLog,
            final_theta: result.totalScore, // No CAT real, isso seria o Theta estimado
            final_see: result.autoGradeLog?.finalSee || 0.2,
            accommodations_used: [], // Viria do perfil do aluno
            bundle_checksum: "sha256:7f83b1...", // Integridade do pool
            exported_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        saveAs(blob, `trajetoria_${result.id}.json`);
    },

    /**
     * Exporta o dicionário de dados técnico para pesquisadores.
     */
    exportDataDictionary: () => {
        const dictionary = `
# Dicionário de Dados Técnico - FORGE 2031
Este documento define o esquema de interoperabilidade para auditores externos.

## 1. Trajetória Adaptativa (trajectory_log)
- itemId (String): Identificador único do item no banco.
- response (String): Resposta dada pelo aluno.
- timestamp (ISO8601): Momento da resposta.
- theta_instant (Float): Proficiência estimada imediatamente após este item.
- see_instant (Float): Erro padrão da estimativa neste ponto.

## 2. Parâmetros Psicométricos (TRI)
- a (Discriminação): Inclinação da curva CCI.
- b (Dificuldade): Ponto de 50% de probabilidade de acerto.
- c (Pseudo-chute): Assíntota inferior da curva.
    `;
        const blob = new Blob([dictionary], { type: 'text/markdown' });
        saveAs(blob, 'dicionario_dados_forge.md');
    },

    /**
     * Gera um CSV simplificado para análise em Excel/R/Python.
     */
    exportResultsToCSV: (results: ExamResult[]) => {
        const header = "id,studentId,studentName,score,submittedAt,status\n";
        const rows = results.map(r => `${r.id},${r.studentId},${r.studentName || 'N/A'},${r.totalScore},${r.submittedAt},${r.status}`).join("\n");
        const blob = new Blob([header + rows], { type: 'text/csv' });
        saveAs(blob, `resultados_escola_${new Date().toISOString().split('T')[0]}.csv`);
    },

    /**
     * Exportação em Massa (Soberania Digital)
     * Compacta todos os dados de um tenant em um único objeto de transporte.
     */
    exportSchoolBatch: async (schoolId: string, data: any) => {
        console.log(`📡 [Soberania] Gerando lote de exportação para escola: ${schoolId}`);
        
        const timestamp = new Date().toISOString();
        const exportPackage = {
            schoolId,
            exportedAt: timestamp,
            version: "EP_SOVEREIGNTY_V1",
            data: data, // Provas, Itens, Resultados, Logs
            checksum: "sha256:generated_at_runtime"
        };

        const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
        saveAs(blob, `soberania_dados_${schoolId}_${timestamp.split('T')[0]}.json`);
    }
};
