import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface DataLakeJob {
    id: string;
    type: 'full_dump' | 'incremental';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    fileUrl?: string;
    recordCount: number;
}

export const dataLakeService = {
    /**
     * Inicia um job de extração FULL DUMP para o Data Lake
     * Extrai Escolas, Turmas e Alunos e consolida em um arquivo JSONL
     */
    startFullExtraction: async (): Promise<DataLakeJob> => {
        const jobId = uuidv4();
        const startTime = new Date().toISOString();

        // Simula registro do Job (em produção seria uma tabela 'data_lake_jobs')
        console.log(`[DataLake] Starting Job ${jobId} (FULL_DUMP)...`);

        try {
            // 1. Extract (E)
            const { data: schools } = await supabase.from('schools').select('*');
            const { data: classes } = await supabase.from('classes').select('*');
            const { data: students } = await supabase.from('users').select('*').eq('role', 'student');

            if (!schools || !classes || !students) throw new Error("Failed to fetch source data");

            // 2. Transform (T) -> NDJSON (JSON Lines)
            let jsonlContent = '';

            schools.forEach(s => {
                jsonlContent += JSON.stringify({ ...s, _type: 'school', _job: jobId, _extracted_at: startTime }) + '\n';
            });

            classes.forEach(c => {
                jsonlContent += JSON.stringify({ ...c, _type: 'class', _job: jobId, _extracted_at: startTime }) + '\n';
            });

            students.forEach(s => {
                jsonlContent += JSON.stringify({ ...s, _type: 'student', _job: jobId, _extracted_at: startTime }) + '\n';
            });

            const blob = new Blob([jsonlContent], { type: 'application/x-ndjson' });
            const recordCount = schools.length + classes.length + students.length;

            // 3. Load (L) -> Upload to Staging Bucket
            const fileName = `dumps/full_dump_${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('data-lake-stage')
                .upload(fileName, blob, {
                    contentType: 'application/x-ndjson',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage.from('data-lake-stage').getPublicUrl(fileName);

            console.log(`[DataLake] Job ${jobId} Completed. records=${recordCount}`);

            return {
                id: jobId,
                type: 'full_dump',
                status: 'completed',
                startedAt: startTime,
                completedAt: new Date().toISOString(),
                fileUrl: publicUrlData.publicUrl,
                recordCount
            };

        } catch (error) {
            console.error(`[DataLake] Job ${jobId} Failed:`, error);
            return {
                id: jobId,
                type: 'full_dump',
                status: 'failed',
                startedAt: startTime,
                recordCount: 0
            };
        }
    },

    /**
     * Inicia extração incremental de eventos (Logs e Resultados)
     */
    startIncrementalExtraction: async (since: Date): Promise<DataLakeJob> => {
        const jobId = uuidv4();
        const startTime = new Date().toISOString();
        console.log(`[DataLake] Starting Job ${jobId} (INCREMENTAL since ${since.toISOString()})...`);

        try {
            // 1. Extract (E)
            const { data: logs } = await supabase
                .from('audit_logs')
                .select('*')
                .gt('timestamp', since.toISOString());

            const { data: results } = await supabase
                .from('exam_results')
                .select('*')
                .gt('submitted_at', since.toISOString());

            const safeLogs = logs || [];
            const safeResults = results || [];

            // 2. Transform (T)
            let jsonlContent = '';

            safeLogs.forEach(l => {
                jsonlContent += JSON.stringify({ ...l, _type: 'audit_log', _job: jobId }) + '\n';
            });

            safeResults.forEach(r => {
                jsonlContent += JSON.stringify({ ...r, _type: 'exam_result', _job: jobId }) + '\n';
            });

            const blob = new Blob([jsonlContent], { type: 'application/x-ndjson' });
            const recordCount = safeLogs.length + safeResults.length;

            // 3. Load (L)
            const fileName = `incremental/${new Date().getFullYear()}/${new Date().getMonth() + 1}/inc_${Date.now()}.jsonl`;

            const { error: uploadError } = await supabase.storage
                .from('data-lake-stage')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage.from('data-lake-stage').getPublicUrl(fileName);

            return {
                id: jobId,
                type: 'incremental',
                status: 'completed',
                startedAt: startTime,
                completedAt: new Date().toISOString(),
                fileUrl: publicUrlData.publicUrl,
                recordCount
            };

        } catch (error) {
            console.error(`[DataLake] Job ${jobId} Failed:`, error);
            throw error;
        }
    }
};
