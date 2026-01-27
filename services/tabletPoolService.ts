/**
 * Tablet Pool Service
 * 
 * Gerencia o inventário global e disponibilidade de tablets.
 * Rastreia status, bloqueia agendamentos e gera relatórios.
 */

export type TabletRole = 'ROUTER' | 'PROFESSOR' | 'COORDINATOR' | 'STUDENT' | 'AVAILABLE';
export type TabletStatus = 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'CHARGING' | 'MAINTENANCE';

export interface Tablet {
    id: string;
    serialNumber: string;
    model: string;

    // Estado atual
    status: TabletStatus;
    role: TabletRole;
    batteryLevel: number;

    // Evento atual (se reservado/em uso)
    currentEventId?: string;
    currentEventDate?: string;
    assignedSchoolId?: string;

    // Histórico
    lastUsed?: string;
    totalUsageCount: number;

    // Manutenção
    needsMaintenance: boolean;
    maintenanceReason?: string;
}

export interface PoolStats {
    total: number;
    available: number;
    reserved: number;
    inUse: number;
    charging: number;
    maintenance: number;

    // Por papel
    byRole: {
        router: number;
        professor: number;
        coordinator: number;
        student: number;
        available: number;
    };
}

export interface ReservationRequest {
    eventId: string;
    date: string;
    schoolId: string;
    requirements: {
        router: number;
        professor: number;
        coordinator: number;
        student: number;
    };
}

export interface ReservationResult {
    success: boolean;
    reserved?: Tablet[];
    reason?: string;
    suggestedDates?: string[];
}

export class TabletPoolService {
    private tablets: Map<string, Tablet> = new Map();
    private reservations: Map<string, Tablet[]> = new Map(); // eventId -> tablets

    constructor(initialPool: Tablet[] = []) {
        initialPool.forEach(tablet => {
            this.tablets.set(tablet.id, tablet);
        });
    }

    /**
     * Obtém estatísticas do pool
     */
    getStats(): PoolStats {
        const tablets = Array.from(this.tablets.values());

        return {
            total: tablets.length,
            available: tablets.filter(t => t.status === 'AVAILABLE').length,
            reserved: tablets.filter(t => t.status === 'RESERVED').length,
            inUse: tablets.filter(t => t.status === 'IN_USE').length,
            charging: tablets.filter(t => t.status === 'CHARGING').length,
            maintenance: tablets.filter(t => t.status === 'MAINTENANCE').length,

            byRole: {
                router: tablets.filter(t => t.role === 'ROUTER').length,
                professor: tablets.filter(t => t.role === 'PROFESSOR').length,
                coordinator: tablets.filter(t => t.role === 'COORDINATOR').length,
                student: tablets.filter(t => t.role === 'STUDENT').length,
                available: tablets.filter(t => t.role === 'AVAILABLE').length
            }
        };
    }

    /**
     * Tenta reservar tablets para um evento
     */
    reserveTablets(request: ReservationRequest): ReservationResult {
        const totalNeeded =
            request.requirements.router +
            request.requirements.professor +
            request.requirements.coordinator +
            request.requirements.student;

        const available = this.getAvailableTablets();

        // Verificar se há tablets suficientes
        if (available.length < totalNeeded) {
            return {
                success: false,
                reason: `Pool insuficiente: ${available.length}/${totalNeeded} disponíveis`,
                suggestedDates: this.suggestAlternativeDates(request.date)
            };
        }

        // Reservar tablets
        const reserved: Tablet[] = [];

        // 1. Roteadores
        for (let i = 0; i < request.requirements.router; i++) {
            const tablet = available.pop()!;
            this.assignTablet(tablet, request, 'ROUTER');
            reserved.push(tablet);
        }

        // 2. Professores
        for (let i = 0; i < request.requirements.professor; i++) {
            const tablet = available.pop()!;
            this.assignTablet(tablet, request, 'PROFESSOR');
            reserved.push(tablet);
        }

        // 3. Coordenadores
        for (let i = 0; i < request.requirements.coordinator; i++) {
            const tablet = available.pop()!;
            this.assignTablet(tablet, request, 'COORDINATOR');
            reserved.push(tablet);
        }

        // 4. Alunos
        for (let i = 0; i < request.requirements.student; i++) {
            const tablet = available.pop()!;
            this.assignTablet(tablet, request, 'STUDENT');
            reserved.push(tablet);
        }

        // Salvar reserva
        this.reservations.set(request.eventId, reserved);

        return {
            success: true,
            reserved
        };
    }

    /**
     * Libera tablets de um evento (após uso)
     */
    releaseTablets(eventId: string): void {
        const reserved = this.reservations.get(eventId);

        if (!reserved) {
            console.warn(`Evento ${eventId} não encontrado nas reservas`);
            return;
        }

        reserved.forEach(tablet => {
            tablet.status = 'AVAILABLE';
            tablet.role = 'AVAILABLE';
            tablet.currentEventId = undefined;
            tablet.currentEventDate = undefined;
            tablet.assignedSchoolId = undefined;
            tablet.lastUsed = new Date().toISOString();
            tablet.totalUsageCount++;

            this.tablets.set(tablet.id, tablet);
        });

        this.reservations.delete(eventId);

        console.log(`✅ ${reserved.length} tablets liberados do evento ${eventId}`);
    }

    /**
     * Marca tablets como "em uso" (quando evento inicia)
     */
    markInUse(eventId: string): void {
        const reserved = this.reservations.get(eventId);

        if (!reserved) {
            console.warn(`Evento ${eventId} não encontrado`);
            return;
        }

        reserved.forEach(tablet => {
            tablet.status = 'IN_USE';
            this.tablets.set(tablet.id, tablet);
        });
    }

    /**
     * Verifica se pode agendar evento (sem considerar reserva técnica)
     */
    canSchedule(requirements: ReservationRequest['requirements']): boolean {
        const totalNeeded =
            requirements.router +
            requirements.professor +
            requirements.coordinator +
            requirements.student;

        const available = this.getAvailableTablets().length;

        // Considerar 10% de reserva técnica mínima
        const minReserve = Math.ceil(this.tablets.size * 0.10);

        return available >= (totalNeeded + minReserve);
    }

    /**
     * Obtém tablets disponíveis
     */
    private getAvailableTablets(): Tablet[] {
        return Array.from(this.tablets.values())
            .filter(t => t.status === 'AVAILABLE' && !t.needsMaintenance)
            .sort((a, b) => b.batteryLevel - a.batteryLevel); // Prirorizar mais carregados
    }

    /**
     * Atribui tablet a um evento
     */
    private assignTablet(
        tablet: Tablet,
        request: ReservationRequest,
        role: TabletRole
    ): void {
        tablet.status = 'RESERVED';
        tablet.role = role;
        tablet.currentEventId = request.eventId;
        tablet.currentEventDate = request.date;
        tablet.assignedSchoolId = request.schoolId;

        this.tablets.set(tablet.id, tablet);
    }

    /**
     * Sugere datas alternativas (mock - em produção consultaria agenda)
     */
    private suggestAlternativeDates(originalDate: string): string[] {
        const date = new Date(originalDate);
        const suggestions: string[] = [];

        // Sugerir próximos 3 dias úteis
        for (let i = 1; i <= 5; i++) {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + i);

            // Pular fins de semana
            if (newDate.getDay() === 0 || newDate.getDay() === 6) continue;

            suggestions.push(newDate.toISOString().split('T')[0]);

            if (suggestions.length === 3) break;
        }

        return suggestions;
    }

    /**
     * Adiciona tablet ao pool
     */
    addTablet(tablet: Tablet): void {
        this.tablets.set(tablet.id, tablet);
    }

    /**
     * Remove tablet do pool (permanentemente)
     */
    removeTablet(tabletId: string): void {
        this.tablets.delete(tabletId);
    }

    /**
     * Marca tablet para manutenção
     */
    markMaintenance(tabletId: string, reason: string): void {
        const tablet = this.tablets.get(tabletId);
        if (tablet) {
            tablet.status = 'MAINTENANCE';
            tablet.needsMaintenance = true;
            tablet.maintenanceReason = reason;
            this.tablets.set(tabletId, tablet);
        }
    }

    /**
     * Retorna tablet da manutenção
     */
    completeMaintenance(tabletId: string): void {
        const tablet = this.tablets.get(tabletId);
        if (tablet) {
            tablet.status = 'AVAILABLE';
            tablet.role = 'AVAILABLE';
            tablet.needsMaintenance = false;
            tablet.maintenanceReason = undefined;
            this.tablets.set(tabletId, tablet);
        }
    }

    /**
     * Gera relatório do pool
     */
    generateReport(): string {
        const stats = this.getStats();

        let report = `📦 RELATÓRIO DO POOL DE TABLETS\n\n`;
        report += `📱 Total: ${stats.total} tablets\n\n`;
        report += `Status:\n`;
        report += `  ✅ Disponíveis: ${stats.available}\n`;
        report += `  📅 Reservados: ${stats.reserved}\n`;
        report += `  🔴 Em uso: ${stats.inUse}\n`;
        report += `  🔋 Carregando: ${stats.charging}\n`;
        report += `  🔧 Manutenção: ${stats.maintenance}\n\n`;
        report += `Papéis atualmente atribuídos:\n`;
        report += `  🟠 Roteadores: ${stats.byRole.router}\n`;
        report += `  🟢 Professores: ${stats.byRole.professor}\n`;
        report += `  🔵 Coordenadores: ${stats.byRole.coordinator}\n`;
        report += `  ⚪ Alunos: ${stats.byRole.student}\n`;
        report += `  ⚫ Não atribuídos: ${stats.byRole.available}\n`;

        return report;
    }

    /**
     * Lista todos os tablets
     */
    getAllTablets(): Tablet[] {
        return Array.from(this.tablets.values());
    }

    /**
     * Obtém tablets de um evento específico
     */
    getEventTablets(eventId: string): Tablet[] {
        return this.reservations.get(eventId) || [];
    }
}

// Singleton para uso global
let poolInstance: TabletPoolService | null = null;

export function initializePool(tablets: Tablet[]): TabletPoolService {
    poolInstance = new TabletPoolService(tablets);
    return poolInstance;
}

export function getPool(): TabletPoolService {
    if (!poolInstance) {
        throw new Error('Pool não inicializado. Chame initializePool() primeiro.');
    }
    return poolInstance;
}
