import { Item } from '../types';
import { supabase } from './supabaseClient';

// Local types moved to types.ts
import { ItemUsageRecord } from '../types';

/**
 * Filtros para busca no banco de itens
 */
export interface QuestionFilters {
    subject?: string;
    difficulty?: string;
    bnccCodes?: string[];
    status?: 'available' | 'used' | 'new';
    excludeUsedInYear?: number;
}

/**
 * Serviço de gerenciamento do banco de itens (Server-Side Sync)
 * Agora sincronizado com Supabase para garantir inedismo entre professores/escolas
 */
class ItemBankService {
    private usageRecords: ItemUsageRecord[] = [];
    private lastSync: number = 0;
    private readonly SYNC_TTL = 1000 * 60 * 5; // 5 minutos de cache

    constructor() {
        // Inicializa vazio, sync deve ser chamado explicitamente ou via lazy load
    }

    /**
     * Sincroniza registros de uso do servidor
     */
    async syncWithServer(schoolId: string): Promise<void> {
        const now = Date.now();
        if (now - this.lastSync < this.SYNC_TTL && this.usageRecords.length > 0) {
            return; // Cache hit
        }

        try {
            const currentYear = new Date().getFullYear();
            const startDate = `${currentYear}-01-01T00:00:00.000Z`;

            const { data, error } = await supabase
                .from('question_usage_logs')
                .select('question_id, school_id, exam_id, used_at')
                .eq('school_id', schoolId)
                .gte('used_at', startDate);

            if (error) throw error;

            if (data) {
                this.usageRecords = data.map(row => ({
                    questionId: row.question_id,
                    schoolId: row.school_id,
                    examId: row.exam_id,
                    year: new Date(row.used_at).getFullYear(),
                    usedAt: row.used_at,
                    studentsCount: 0 // Simplificação, count real exigiria join mais pesado
                }));
                this.lastSync = now;
                console.log(`[ItemBankService] Sincronizado ${this.usageRecords.length} registros de uso para escola ${schoolId}`);
            }
        } catch (error) {
            console.error('[ItemBankService] Erro ao sincronizar registros:', error);
            // Fallback silencioso para não travar a UI, mas loga erro
        }
    }

    /**
     * Verifica se uma questão pode ser usada (regra de inedismo)
     * Uma questão não pode ser reutilizada na mesma escola no mesmo ano
     */
    canUseQuestion(
        questionId: string,
        schoolId: string,
        currentYear: number = new Date().getFullYear()
    ): boolean {
        // Verifica no cache local (que deve ser populado via syncWithServer nas telas de listagem)
        const wasUsedThisYear = this.usageRecords.some(
            record =>
                record.questionId === questionId &&
                record.schoolId === schoolId &&
                record.year === currentYear
        );

        return !wasUsedThisYear;
    }

    /**
     * Registra o uso de uma questão no Supabase
     */
    async registerQuestionUsage(
        questionId: string,
        schoolId: string,
        examId: string,
        studentsCount: number = 0
    ): Promise<void> {
        const currentYear = new Date().getFullYear();
        const usedAt = new Date().toISOString();

        // 1. Atualiza Cache Local Otimista
        const record: ItemUsageRecord = {
            questionId,
            schoolId,
            examId,
            year: currentYear,
            usedAt,
            studentsCount
        };
        this.usageRecords.push(record);

        // 2. Persiste no Supabase (Fire and Forget ou Await dependendo da criticidade)
        try {
            const { error } = await supabase.from('question_usage_logs').insert({
                school_id: schoolId,
                question_id: questionId,
                exam_id: examId,
                used_at: usedAt
            });

            if (error) {
                console.error('[ItemBankService] Falha ao persistir uso no servidor:', error);
                // Em caso de erro real, idealmente teríamos uma fila de retry (offline-first),
                // mas para este MVP assumimos conexão estável ou erro logado.
            }
        } catch (err) {
            console.error('[ItemBankService] Erro de conexão:', err);
        }
    }

    /**
     * Obtém questões disponíveis (não usadas este ano na escola)
     */
    getAvailableQuestions(
        allQuestions: Item[],
        schoolId: string,
        filters?: QuestionFilters
    ): Item[] {
        const currentYear = new Date().getFullYear();

        // Importante: syncWithServer deve ter sido chamado antes pelo componente (useEffect)
        // para garantir que this.usageRecords esteja atualizado.

        return allQuestions.filter(question => {
            // Verificar inedismo
            const isAvailable = this.canUseQuestion(question.id, schoolId, currentYear);
            if (!isAvailable) return false;

            // Aplicar filtros adicionais
            if (filters) {
                if (filters.subject && question.subject !== filters.subject) {
                    return false;
                }
                if (filters.difficulty && question.difficulty !== filters.difficulty) {
                    return false;
                }
                if (filters.bnccCodes && filters.bnccCodes.length > 0) {
                    const hasMatchingCode = question.bnccCode && filters.bnccCodes.includes(question.bnccCode);
                    if (!hasMatchingCode) return false;
                }
            }

            return true;
        });
    }

    /**
     * Obtém estatísticas de uso de uma questão
     */
    getQuestionStats(questionId: string, schoolId?: string): {
        timesUsed: number;
        lastUsedAt?: string;
        usedInExams: Array<{
            examId: string;
            date: string;
            studentsCount: number;
        }>;
    } {
        const records = schoolId
            ? this.usageRecords.filter(r => r.questionId === questionId && r.schoolId === schoolId)
            : this.usageRecords.filter(r => r.questionId === questionId);

        return {
            timesUsed: records.length,
            lastUsedAt: records.length > 0
                ? records.map(r => r.usedAt).sort().reverse()[0]
                : undefined,
            usedInExams: records.map(r => ({
                examId: r.examId,
                date: r.usedAt,
                studentsCount: r.studentsCount
            }))
        };
    }

    /**
     * Obtém estatísticas gerais do banco
     */
    getBankStats(allQuestions: Item[], schoolId: string): {
        total: number;
        available: number;
        used: number;
        new: number;
    } {
        const currentYear = new Date().getFullYear();
        const available = this.getAvailableQuestions(allQuestions, schoolId);

        const used = allQuestions.filter(q =>
            !this.canUseQuestion(q.id, schoolId, currentYear)
        );

        // Questões "novas" são aquelas criadas nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newQuestions = allQuestions.filter(q => {
            const createdAt = new Date(q.createdAt || 0);
            return createdAt > sevenDaysAgo;
        });

        return {
            total: allQuestions.length,
            available: available.length,
            used: used.length,
            new: newQuestions.length
        };
    }
}

// Exportar instância singleton
export const itemBankService = new ItemBankService();
