import { Item } from '../types';

/**
 * Metadata de questão para rastreamento de fonte e auditoria
 */
export interface QuestionMetadata {
    // Fonte
    source?: {
        type: 'manual' | 'ai_upload' | 'ai_context' | 'ai_topic';
        fileName?: string;
        fileType?: string;
        uploadDate?: Date;
        pageRange?: string;
        extractedContext?: string;
    };

    // Geração
    generatedBy: 'professor' | 'ai';
    aiModel?: string;
    promptVersion?: string;
    generatedAt: Date;

    // Uso
    timesUsed?: number;
    lastUsedAt?: Date;
    usedInExams?: Array<{
        examId: string;
        examName: string;
        date: Date;
        studentsCount: number;
    }>;
}

/**
 * Registro de uso de questão no banco de itens
 */
export interface ItemUsageRecord {
    questionId: string;
    schoolId: string;
    examId: string;
    year: number;
    usedAt: Date;
    studentsCount: number;
}

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
 * Serviço de gerenciamento do banco de itens
 */
class ItemBankService {
    private usageRecords: ItemUsageRecord[] = [];
    private readonly STORAGE_KEY = 'item_bank_usage';

    constructor() {
        this.loadUsageRecords();
    }

    /**
     * Carrega registros de uso do localStorage
     */
    private loadUsageRecords(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.usageRecords = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Erro ao carregar registros de uso:', error);
            this.usageRecords = [];
        }
    }

    /**
     * Salva registros de uso no localStorage
     */
    private saveUsageRecords(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.usageRecords));
        } catch (error) {
            console.error('Erro ao salvar registros de uso:', error);
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
        const wasUsedThisYear = this.usageRecords.some(
            record =>
                record.questionId === questionId &&
                record.schoolId === schoolId &&
                record.year === currentYear
        );

        return !wasUsedThisYear;
    }

    /**
     * Registra o uso de uma questão
     */
    registerQuestionUsage(
        questionId: string,
        schoolId: string,
        examId: string,
        studentsCount: number = 0
    ): void {
        const currentYear = new Date().getFullYear();

        const record: ItemUsageRecord = {
            questionId,
            schoolId,
            examId,
            year: currentYear,
            usedAt: new Date(),
            studentsCount
        };

        this.usageRecords.push(record);
        this.saveUsageRecords();
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
                    const hasMatchingCode = question.bnccCodes?.some(code =>
                        filters.bnccCodes!.includes(code)
                    );
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
        lastUsedAt?: Date;
        usedInExams: Array<{
            examId: string;
            date: Date;
            studentsCount: number;
        }>;
    } {
        const records = schoolId
            ? this.usageRecords.filter(r => r.questionId === questionId && r.schoolId === schoolId)
            : this.usageRecords.filter(r => r.questionId === questionId);

        return {
            timesUsed: records.length,
            lastUsedAt: records.length > 0
                ? new Date(Math.max(...records.map(r => new Date(r.usedAt).getTime())))
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

    /**
     * Limpa registros antigos (opcional - manutenção)
     */
    cleanOldRecords(yearsToKeep: number = 3): void {
        const currentYear = new Date().getFullYear();
        const cutoffYear = currentYear - yearsToKeep;

        this.usageRecords = this.usageRecords.filter(
            record => record.year >= cutoffYear
        );

        this.saveUsageRecords();
    }
}

// Exportar instância singleton
export const itemBankService = new ItemBankService();
