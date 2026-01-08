
import Papa from 'papaparse';
import { supabase } from './supabaseClient';

export type ImportType = 'STUDENTS' | 'CLASSES' | 'SCHOOLS';

export interface ImportResult {
    total: number;
    success: number;
    errors: Array<{ row: number; message: string; data: any }>;
}

export const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

export const validateAndImportData = async (
    data: any[],
    type: ImportType,
    tenantId: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        total: data.length,
        success: 0,
        errors: [],
    };

    const validBatch: any[] = [];

    // 1. Validation Logic
    data.forEach((row, index) => {
        const rowNum = index + 2; // Header is 1
        let isValid = true;
        let errorMessage = '';

        try {
            if (type === 'STUDENTS') {
                if (!row.name || !row.registration_number || !row.school_id || !row.class_id) {
                    isValid = false;
                    errorMessage = 'Campos obrigatórios: name, registration_number, school_id, class_id';
                }
                // Enrich with system data
                row.tenant_id = tenantId;
            } else if (type === 'CLASSES') {
                if (!row.name || !row.school_id || !row.series) {
                    isValid = false;
                    errorMessage = 'Campos obrigatórios: name, school_id, series';
                }
            }
            // Add more types here
        } catch (e: any) {
            isValid = false;
            errorMessage = e.message;
        }

        if (isValid) {
            validBatch.push(row);
        } else {
            result.errors.push({ row: rowNum, message: errorMessage, data: row });
        }
    });

    // 2. Batch Insert Logic (Supabase)
    if (validBatch.length > 0) {
        let tableName = '';
        if (type === 'STUDENTS') tableName = 'students';
        if (type === 'CLASSES') tableName = 'classes';
        if (type === 'SCHOOLS') tableName = 'schools';

        const { error } = await supabase.from(tableName).upsert(validBatch);

        if (error) {
            // Serious batch error
            result.errors.push({ row: 0, message: `Erro fatal no Supabase: ${error.message}`, data: null });
        } else {
            result.success = validBatch.length;
        }
    }

    return result;
};

export const getTemplateUrl = (type: ImportType) => {
    // In a real app, generate a Blob URL or link to a static asset
    const headers = {
        STUDENTS: 'name,registration_number,email,class_id,school_id',
        CLASSES: 'name,series,shift,school_id',
        SCHOOLS: 'name,inep'
    };
    const content = headers[type] || '';
    const blob = new Blob([content], { type: 'text/csv' });
    return URL.createObjectURL(blob);
};
