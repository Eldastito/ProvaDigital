/**
 * Tablet Optimization Service
 * 
 * Calcula o número otimizado de tablets necessários para um evento,
 * considerando reutilização entre turnos e reserva técnica.
 * 
 * Lógica:
 * 1. Agrupa provas por escola e dia
 * 2. Identifica turnos (manhã/tarde/noite)
 * 3. Calcula PICO de alunos por turno
 * 4. Verifica se há intervalo mínimo (1h) para reutilização
 * 5. Adiciona reserva técnica (15% alunos e infra)
 */

export interface ExamSchedule {
    id: string;
    examId: string;
    examName: string;
    schoolId: string;
    schoolName: string;
    classId: string;
    className: string;
    studentCount: number;
    date: string;
    startTime: string; // HH:mm
    duration: number; // minutos
    professorId: string;
    professorName: string;
}

export interface TabletRequirement {
    role: 'ROUTER' | 'PROFESSOR' | 'COORDINATOR' | 'STUDENT';
    quantity: number;
    reuseCount: number; // Quantas vezes será reutilizado no dia
}

export interface SchoolOptimization {
    schoolId: string;
    schoolName: string;
    date: string;

    // Todas as provas da escola neste dia
    exams: ExamSchedule[];

    // Análise de turnos
    turns: {
        morning: ExamSchedule[]; // 06:00-11:59
        afternoon: ExamSchedule[]; // 12:00-17:59
        night: ExamSchedule[]; // 18:00-23:59
    };

    // PICO de alunos
    peakStudentCount: number;
    peakExam: ExamSchedule;

    // Tablets necessários (já com reserva)
    tablets: {
        router: TabletRequirement;
        professor: TabletRequirement;
        coordinator: TabletRequirement;
        student: TabletRequirement;
    };

    // Total otimizado
    totalTablets: number;

    // Economia vs não otimizado
    withoutOptimization: number;
    savedTablets: number;
    savingPercentage: number;
}

export interface DayOptimization {
    date: string;
    schools: SchoolOptimization[];
    totalTablets: number;
    totalWithoutOptimization: number;
    totalSaved: number;
}

export class TabletOptimizationService {

    /**
     * Otimiza tablets para um dia completo
     */
    static optimizeDay(schedules: ExamSchedule[]): DayOptimization {
        // Agrupar por data
        const dateGroups = this.groupByDate(schedules);

        const results: DayOptimization[] = [];

        for (const [date, examsInDay] of Object.entries(dateGroups)) {
            // Agrupar por escola
            const schoolGroups = this.groupBySchool(examsInDay);

            const schoolOptimizations: SchoolOptimization[] = [];

            for (const [schoolId, schoolExams] of Object.entries(schoolGroups)) {
                const optimization = this.optimizeSchool(schoolId, date, schoolExams);
                schoolOptimizations.push(optimization);
            }

            // Totais do dia
            const totalTablets = schoolOptimizations.reduce((sum, s) => sum + s.totalTablets, 0);
            const totalWithoutOpt = schoolOptimizations.reduce((sum, s) => sum + s.withoutOptimization, 0);

            results.push({
                date,
                schools: schoolOptimizations,
                totalTablets,
                totalWithoutOptimization: totalWithoutOpt,
                totalSaved: totalWithoutOpt - totalTablets
            });
        }

        return results[0]; // Assumindo um dia por vez
    }

    /**
     * Otimiza tablets para uma escola em um dia específico
     */
    private static optimizeSchool(
        schoolId: string,
        date: string,
        exams: ExamSchedule[]
    ): SchoolOptimization {

        // 1. Classificar por turno
        const turns = this.classifyByTurn(exams);

        // 2. Encontrar PICO de alunos
        const { peak, peakExam } = this.findPeak(exams);

        // 3. Verificar possibilidade de reutilização
        const canReuse = this.canReuseTablets(exams);
        const reuseCount = canReuse ? exams.length : 1;

        // 4. Calcular tablets necessários
        const studentTablets = this.calculateStudentTablets(peak);
        const infraTablets = this.calculateInfraTablets(exams, canReuse);

        // 5. Total otimizado
        const totalOptimized = studentTablets + infraTablets.total;

        // 6. Total sem otimização (soma de todas as turmas)
        const totalWithoutOpt = exams.reduce((sum, exam) => {
            return sum + this.calculateWithoutOptimization(exam.studentCount);
        }, 0);

        return {
            schoolId,
            schoolName: exams[0].schoolName,
            date,
            exams,
            turns,
            peakStudentCount: peak,
            peakExam,
            tablets: {
                router: {
                    role: 'ROUTER',
                    quantity: infraTablets.router,
                    reuseCount
                },
                professor: {
                    role: 'PROFESSOR',
                    quantity: infraTablets.professor,
                    reuseCount
                },
                coordinator: {
                    role: 'COORDINATOR',
                    quantity: infraTablets.coordinator,
                    reuseCount
                },
                student: {
                    role: 'STUDENT',
                    quantity: studentTablets,
                    reuseCount
                }
            },
            totalTablets: totalOptimized,
            withoutOptimization: totalWithoutOpt,
            savedTablets: totalWithoutOpt - totalOptimized,
            savingPercentage: ((totalWithoutOpt - totalOptimized) / totalWithoutOpt) * 100
        };
    }

    /**
     * Classifica provas por turno
     */
    private static classifyByTurn(exams: ExamSchedule[]) {
        const turns = {
            morning: [] as ExamSchedule[],
            afternoon: [] as ExamSchedule[],
            night: [] as ExamSchedule[]
        };

        exams.forEach(exam => {
            const hour = parseInt(exam.startTime.split(':')[0]);

            if (hour >= 6 && hour < 12) {
                turns.morning.push(exam);
            } else if (hour >= 12 && hour < 18) {
                turns.afternoon.push(exam);
            } else {
                turns.night.push(exam);
            }
        });

        return turns;
    }

    /**
     * Encontra o pico de alunos
     */
    private static findPeak(exams: ExamSchedule[]): { peak: number; peakExam: ExamSchedule } {
        let peak = 0;
        let peakExam = exams[0];

        exams.forEach(exam => {
            if (exam.studentCount > peak) {
                peak = exam.studentCount;
                peakExam = exam;
            }
        });

        return { peak, peakExam };
    }

    /**
     * Verifica se tablets podem ser reutilizados entre provas
     * Condição: intervalo mínimo de 1 hora entre fim de uma prova e início da próxima
     */
    private static canReuseTablets(exams: ExamSchedule[]): boolean {
        if (exams.length <= 1) return false;

        // Ordenar por horário
        const sorted = [...exams].sort((a, b) => {
            return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
        });

        // Verificar intervalo entre todas as provas consecutivas
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            const currentEnd = this.timeToMinutes(current.startTime) + current.duration;
            const nextStart = this.timeToMinutes(next.startTime);

            const gap = nextStart - currentEnd;

            // Intervalo mínimo: 60 minutos
            if (gap < 60) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calcula tablets de alunos com reserva técnica (20%)
     */
    private static calculateStudentTablets(peakStudents: number): number {
        return Math.ceil(peakStudents * 1.15);
    }

    /**
     * Calcula tablets de infraestrutura com reserva técnica (10%)
     */
    private static calculateInfraTablets(exams: ExamSchedule[], canReuse: boolean) {
        // Se pode reutilizar, precisa apenas 1 conjunto (+ reserva)
        // Se não pode, precisa 1 conjunto por prova simultânea

        const simultaneousExams = canReuse ? 1 : this.findMaxSimultaneous(exams);

        return {
            router: Math.ceil(simultaneousExams * 1.15),
            professor: Math.ceil(simultaneousExams * 1.15),
            coordinator: Math.ceil(1 * 1.15), // 1 por escola, sempre
            total: Math.ceil(simultaneousExams * 1.15) * 2 + Math.ceil(1 * 1.15)
        };
    }

    /**
     * Encontra número máximo de provas simultâneas
     */
    private static findMaxSimultaneous(exams: ExamSchedule[]): number {
        // Criar eventos de início e fim
        const events: { time: number; type: 'start' | 'end' }[] = [];

        exams.forEach(exam => {
            events.push({
                time: this.timeToMinutes(exam.startTime),
                type: 'start'
            });
            events.push({
                time: this.timeToMinutes(exam.startTime) + exam.duration,
                type: 'end'
            });
        });

        // Ordenar por tempo
        events.sort((a, b) => a.time - b.time);

        let current = 0;
        let max = 0;

        events.forEach(event => {
            if (event.type === 'start') {
                current++;
                max = Math.max(max, current);
            } else {
                current--;
            }
        });

        return max;
    }

    /**
     * Calcula total sem otimização
     */
    private static calculateWithoutOptimization(studentCount: number): number {
        const students = Math.ceil(studentCount * 1.15);
        const infra = 1 + 1 + 1; // Router + Professor + Coordenador
        return students + infra;
    }

    /**
     * Converte HH:mm para minutos
     */
    private static timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Agrupa schedules por data
     */
    private static groupByDate(schedules: ExamSchedule[]): Record<string, ExamSchedule[]> {
        return schedules.reduce((acc, schedule) => {
            if (!acc[schedule.date]) {
                acc[schedule.date] = [];
            }
            acc[schedule.date].push(schedule);
            return acc;
        }, {} as Record<string, ExamSchedule[]>);
    }

    /**
     * Agrupa schedules por escola
     */
    private static groupBySchool(schedules: ExamSchedule[]): Record<string, ExamSchedule[]> {
        return schedules.reduce((acc, schedule) => {
            if (!acc[schedule.schoolId]) {
                acc[schedule.schoolId] = [];
            }
            acc[schedule.schoolId].push(schedule);
            return acc;
        }, {} as Record<string, ExamSchedule[]>);
    }

    /**
     * Gera relatório legível
     */
    static generateReport(optimization: DayOptimization): string {
        let report = `📅 RELATÓRIO DE OTIMIZAÇÃO - ${optimization.date}\n\n`;

        optimization.schools.forEach(school => {
            report += `🏫 ${school.schoolName}\n`;
            report += `   📚 Provas: ${school.exams.length}\n`;
            report += `   👥 Pico de alunos: ${school.peakStudentCount} (${school.peakExam.className})\n`;
            report += `   📱 Tablets necessários: ${school.totalTablets}\n`;
            report += `   💰 Economia: ${school.savedTablets} tablets (${school.savingPercentage.toFixed(1)}%)\n`;
            report += `\n`;
            report += `   Distribuição:\n`;
            report += `   🟠 Roteadores: ${school.tablets.router.quantity} (reutilizado ${school.tablets.router.reuseCount}x)\n`;
            report += `   🟢 Professores: ${school.tablets.professor.quantity} (reutilizado ${school.tablets.professor.reuseCount}x)\n`;
            report += `   🔵 Coordenador: ${school.tablets.coordinator.quantity}\n`;
            report += `   ⚪ Alunos: ${school.tablets.student.quantity} (reutilizado ${school.tablets.student.reuseCount}x)\n`;
            report += `\n`;
        });

        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📊 TOTAL DO DIA:\n`;
        report += `   Tablets otimizados: ${optimization.totalTablets}\n`;
        report += `   Sem otimização: ${optimization.totalWithoutOptimization}\n`;
        report += `   💰 ECONOMIA TOTAL: ${optimization.totalSaved} tablets\n`;

        return report;
    }
}
