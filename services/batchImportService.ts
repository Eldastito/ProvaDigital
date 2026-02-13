import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { mapImportColumns } from './geminiService';
import { enrollmentService } from './enrollmentService';
import { UserRole, TenantType } from '../types';
import { supabase } from './supabaseClient';

export interface ImportMapping {
    name: string;
    email: string;
    registrationNumber?: string;
    phone?: string;
    role?: string;
    classId?: string;
    schoolId?: string;
}

export interface ImportCandidate {
    rawData: any;
    normalizedData: {
        name: string;
        email: string;
        registrationNumber: string;
        phone: string;
        role: UserRole;
        classId?: string;
        schoolId?: string;
    };
    status: 'PENDING' | 'VALID' | 'ERROR';
    errors: string[];
}

export class BatchImportService {
    /**
     * Extrai dados de um arquivo CSV ou XLSX
     */
    async parseFile(file: File): Promise<{ headers: string[], rows: any[] }> {
        return new Promise((resolve, reject) => {
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        resolve({
                            headers: results.meta.fields || [],
                            rows: results.data
                        });
                    },
                    error: (err) => reject(err)
                });
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];
                    resolve({
                        headers,
                        rows: jsonData
                    });
                };
                reader.onerror = (err) => reject(err);
                reader.readAsArrayBuffer(file);
            } else {
                reject(new Error("Formato de arquivo não suportado. Use CSV ou XLSX."));
            }
        });
    }

    /**
     * Normaliza dados individuais (Proper Case, Phone, etc)
     */
    normalizeData(value: any, field: keyof ImportMapping): string {
        if (!value) return '';
        const str = String(value).trim();

        switch (field) {
            case 'name':
                // Proper Case: maria silva -> Maria Silva
                return str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
            case 'phone':
                // Apenas números e garantir +55 se faltar
                const digits = str.replace(/\D/g, '');
                if (digits.length === 11) return `+55${digits}`;
                if (digits.length === 13 && digits.startsWith('55')) return `+${digits}`;
                return digits;
            case 'email':
                return str.toLowerCase();
            default:
                return str;
        }
    }

    /**
     * Processa o lote completo usando o mapeamento identificado
     */
    async prepareBatch(
        rows: any[],
        mapping: ImportMapping,
        tenantId: string,
        tenantType: TenantType
    ): Promise<ImportCandidate[]> {
        return rows.map(row => {
            const errors: string[] = [];
            const name = this.normalizeData(row[mapping.name], 'name');
            const email = this.normalizeData(row[mapping.email], 'email');

            // Matrícula: Prioriza a do arquivo, se não houver, gera uma nova
            let regNumber = mapping.registrationNumber ? String(row[mapping.registrationNumber] || '').trim() : '';
            if (!regNumber) {
                regNumber = enrollmentService.generateRegistrationNumber(tenantType);
            }

            const phone = mapping.phone ? this.normalizeData(row[mapping.phone], 'phone') : '';

            // Validações básicas
            if (!name) errors.push("Nome é obrigatório");
            if (!email || !email.includes('@')) errors.push("E-mail inválido");

            // Role padrão: ALUNO se não mapeado ou inválido
            let role: UserRole = UserRole.ALUNO;
            if (mapping.role && row[mapping.role]) {
                const mappedRole = String(row[mapping.role]).toUpperCase();
                if (Object.values(UserRole).includes(mappedRole as UserRole)) {
                    role = mappedRole as UserRole;
                }
            }

            return {
                rawData: row,
                normalizedData: {
                    name,
                    email,
                    registrationNumber: regNumber,
                    phone,
                    role,
                    classId: mapping.classId ? row[mapping.classId] : undefined,
                    schoolId: mapping.schoolId ? row[mapping.schoolId] : undefined,
                    tenantId
                },
                status: errors.length > 0 ? 'ERROR' : 'VALID',
                errors
            } as any;
        });
    }

    /**
     * Executa a importação no banco (Supabase)
     */
    async commitBatch(candidates: ImportCandidate[]): Promise<{ success: number, failed: number }> {
        const validOnes = candidates.filter(c => c.status === 'VALID');
        let successCount = 0;
        let failCount = 0;

        for (const candidate of validOnes) {
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .upsert({
                        email: candidate.normalizedData.email,
                        name: candidate.normalizedData.name,
                        role: candidate.normalizedData.role,
                        phone: candidate.normalizedData.phone,
                        registration_number: candidate.normalizedData.registrationNumber,
                        school_id: candidate.normalizedData.schoolId,
                        class_ids: candidate.normalizedData.classId ? [candidate.normalizedData.classId] : [],
                        tenant_id: (candidate.normalizedData as any).tenantId,
                        status: 'PENDING_CLAIM' // Status para o fluxo de resgate seguro
                    }, { onConflict: 'email' })
                    .select()
                    .single();

                if (userError) throw userError;

                successCount++;
            } catch (err) {
                console.error("Erro ao importar linha:", err, candidate);
                failCount++;
            }
        }

        return { success: successCount, failed: failCount };
    }
}

export const batchImportService = new BatchImportService();
