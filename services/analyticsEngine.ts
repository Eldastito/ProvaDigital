import {
    ExamResult,
    Item,
    Exam,
    User,
    PerformanceMetrics,
    BNCCCompetency,
    SubjectPerformance,
    PerformanceDataPoint,
    TrendAnalysis,
    AnalyticsFilter,
    CompetencyRadarData
} from '../types';

/**
 * Analytics Engine - Phase 11
 * Provides data aggregation, statistical analysis, and performance calculations
 */

// ============================================
// Statistical Helper Functions
// ============================================

export const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
};

export const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
};

export const calculateStandardDeviation = (values: number[]): number => {
    if (values.length === 0) return 0;
    const avg = calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const variance = calculateAverage(squaredDiffs);
    return Math.sqrt(variance);
};

export const calculatePercentile = (values: number[], percentile: number): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

// ============================================
// Performance Metrics Calculation
// ============================================

export const calculatePerformanceMetrics = (
    results: ExamResult[],
    passingThreshold: number = 60
): PerformanceMetrics => {
    if (results.length === 0) {
        return {
            averageScore: 0,
            medianScore: 0,
            standardDeviation: 0,
            completionRate: 0,
            improvementRate: 0,
            totalStudents: 0,
            passRate: 0
        };
    }

    const scores = results.map(r => r.totalScore);
    const maxScores = results.map(r => r.totalScore); // Assuming totalScore is already percentage
    const percentageScores = scores.map((score, idx) =>
        maxScores[idx] > 0 ? (score / maxScores[idx]) * 100 : 0
    );

    const passedStudents = percentageScores.filter(score => score >= passingThreshold).length;

    return {
        averageScore: calculateAverage(scores),
        medianScore: calculateMedian(scores),
        standardDeviation: calculateStandardDeviation(scores),
        completionRate: (results.filter(r => r.answers.length > 0).length / results.length) * 100,
        improvementRate: 0, // Calculated separately with historical data
        totalStudents: results.length,
        passRate: (passedStudents / results.length) * 100
    };
};

// ============================================
// BNCC Competency Analysis
// ============================================

export const analyzeBNCCCompetencies = (
    results: ExamResult[],
    items: Item[],
    exams: Exam[]
): BNCCCompetency[] => {
    const competencyMap = new Map<string, {
        scores: number[];
        totalQuestions: number;
        description: string;
    }>();

    results.forEach(result => {
        const exam = exams.find(e => e.id === result.examId);
        if (!exam) return;

        result.answers.forEach(answer => {
            const item = items.find(i => i.id === answer.itemId);
            if (!item || !item.bnccCode) return;

            if (!competencyMap.has(item.bnccCode)) {
                competencyMap.set(item.bnccCode, {
                    scores: [],
                    totalQuestions: 0,
                    description: item.bnccCode // Could be enhanced with actual BNCC descriptions
                });
            }

            const comp = competencyMap.get(item.bnccCode)!;
            comp.scores.push(answer.scoreObtained);
            comp.totalQuestions++;
        });
    });

    return Array.from(competencyMap.entries()).map(([code, data]) => {
        const avgScore = calculateAverage(data.scores);
        const masteryLevel: 'low' | 'medium' | 'high' =
            avgScore >= 70 ? 'high' : avgScore >= 50 ? 'medium' : 'low';

        const classAverage = avgScore;
        const studentsAboveAverage = data.scores.filter(s => s > classAverage).length;
        const studentsBelowAverage = data.scores.filter(s => s <= classAverage).length;

        return {
            code,
            description: data.description,
            averageScore: avgScore,
            questionsCount: data.totalQuestions,
            masteryLevel,
            studentsAboveAverage,
            studentsBelowAverage
        };
    }).sort((a, b) => b.averageScore - a.averageScore);
};

// ============================================
// Subject Performance Analysis
// ============================================

export const analyzeSubjectPerformance = (
    results: ExamResult[],
    items: Item[],
    exams: Exam[]
): SubjectPerformance[] => {
    const subjectMap = new Map<string, {
        scores: number[];
        questionsCount: number;
        examsSet: Set<string>;
    }>();

    results.forEach(result => {
        const exam = exams.find(e => e.id === result.examId);
        if (!exam) return;

        result.answers.forEach(answer => {
            const item = items.find(i => i.id === answer.itemId);
            if (!item) return;

            if (!subjectMap.has(item.subject)) {
                subjectMap.set(item.subject, {
                    scores: [],
                    questionsCount: 0,
                    examsSet: new Set()
                });
            }

            const subj = subjectMap.get(item.subject)!;
            subj.scores.push(answer.scoreObtained);
            subj.questionsCount++;
            subj.examsSet.add(result.examId);
        });
    });

    return Array.from(subjectMap.entries()).map(([subject, data]) => {
        const avgScore = calculateAverage(data.scores);

        // Simple trend calculation (could be enhanced with time-series analysis)
        const trend: 'improving' | 'stable' | 'declining' = 'stable';

        return {
            subject,
            averageScore: avgScore,
            questionsCount: data.questionsCount,
            examsCount: data.examsSet.size,
            trend
        };
    }).sort((a, b) => b.averageScore - a.averageScore);
};

// ============================================
// Performance Evolution Tracking
// ============================================

export const getPerformanceEvolution = (
    studentId: string,
    results: ExamResult[],
    exams: Exam[]
): PerformanceDataPoint[] => {
    const studentResults = results
        .filter(r => r.studentId === studentId)
        .sort((a, b) => new Date(a.submittedAt || '').getTime() - new Date(b.submittedAt || '').getTime());

    return studentResults.map(result => {
        const exam = exams.find(e => e.id === result.examId);
        return {
            date: result.submittedAt || new Date().toISOString(),
            score: result.totalScore,
            examTitle: exam?.title || 'Prova',
            subject: exam?.subject || 'Geral'
        };
    });
};

// ============================================
// Trend Analysis with Linear Regression
// ============================================

export const calculateTrendAnalysis = (
    dataPoints: PerformanceDataPoint[],
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): TrendAnalysis => {
    if (dataPoints.length < 2) {
        return {
            period,
            dataPoints,
            trendLine: [],
            growthRate: 0
        };
    }

    // Simple linear regression
    const n = dataPoints.length;
    const xValues = dataPoints.map((_, idx) => idx);
    const yValues = dataPoints.map(dp => dp.score);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, idx) => sum + x * yValues[idx], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendLine = xValues.map(x => slope * x + intercept);
    const growthRate = ((yValues[yValues.length - 1] - yValues[0]) / yValues[0]) * 100;
    const prediction = slope * n + intercept;

    return {
        period,
        dataPoints,
        trendLine,
        growthRate,
        prediction
    };
};

// ============================================
// Competency Radar Data
// ============================================

export const generateCompetencyRadarData = (
    studentResults: ExamResult[],
    classResults: ExamResult[],
    items: Item[]
): CompetencyRadarData[] => {
    const competencies = new Set<string>();
    items.forEach(item => {
        if (item.bnccCode) competencies.add(item.bnccCode);
    });

    return Array.from(competencies).map(competency => {
        const competencyItems = items.filter(i => i.bnccCode === competency);
        const itemIds = competencyItems.map(i => i.id);

        // Student scores
        const studentScores = studentResults.flatMap(r =>
            r.answers.filter(a => itemIds.includes(a.itemId)).map(a => a.scoreObtained)
        );

        // Class average
        const classScores = classResults.flatMap(r =>
            r.answers.filter(a => itemIds.includes(a.itemId)).map(a => a.scoreObtained)
        );

        return {
            competency,
            studentScore: calculateAverage(studentScores),
            classAverage: calculateAverage(classScores),
            maxScore: 100
        };
    });
};

// ============================================
// Filter Application
// ============================================

export const applyAnalyticsFilter = (
    results: ExamResult[],
    exams: Exam[],
    items: Item[],
    filter: AnalyticsFilter
): ExamResult[] => {
    return results.filter(result => {
        const exam = exams.find(e => e.id === result.examId);
        if (!exam) return false;

        // Date range filter
        if (filter.dateRange) {
            const resultDate = new Date(result.submittedAt || '');
            const startDate = new Date(filter.dateRange.start);
            const endDate = new Date(filter.dateRange.end);
            if (resultDate < startDate || resultDate > endDate) return false;
        }

        // Class filter
        if (filter.classIds && filter.classIds.length > 0) {
            if (!filter.classIds.includes(result.classId || '')) return false;
        }

        // Subject filter
        if (filter.subjects && filter.subjects.length > 0) {
            if (!filter.subjects.includes(exam.subject)) return false;
        }

        // Exam IDs filter
        if (filter.examIds && filter.examIds.length > 0) {
            if (!filter.examIds.includes(result.examId)) return false;
        }

        return true;
    });
};
