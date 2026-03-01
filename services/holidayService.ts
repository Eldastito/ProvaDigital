import { InstitutionalEvent, InstitutionalEventType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface OfficialHoliday {
    date: string;
    title: string;
    type: InstitutionalEventType;
}

/**
 * Serviço para prover feriados nacionais brasileiros (fixos e móveis)
 * para automação do calendário institucional.
 */
export const holidayService = {
    getNationalHolidays: (year: number): OfficialHoliday[] => {
        const holidays: OfficialHoliday[] = [
            { date: `${year}-01-01`, title: 'Confraternização Universal', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-04-21`, title: 'Tiradentes', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-05-01`, title: 'Dia do Trabalhador', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-09-07`, title: 'Independência do Brasil', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-10-12`, title: 'Nossa Senhora Aparecida', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-11-02`, title: 'Finados', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-11-15`, title: 'Proclamação da República', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-11-20`, title: 'Dia da Consciência Negra', type: InstitutionalEventType.HOLIDAY },
            { date: `${year}-12-25`, title: 'Natal', type: InstitutionalEventType.HOLIDAY },
        ];

        // Cálculo resumido de feriados móveis (Simplificado para 2024 e 2025)
        if (year === 2024) {
            holidays.push(
                { date: '2024-02-12', title: 'Carnaval (Ponto Facultativo)', type: InstitutionalEventType.OPTIONAL_HOLIDAY },
                { date: '2024-02-13', title: 'Carnaval (Feriado)', type: InstitutionalEventType.HOLIDAY },
                { date: '2024-03-29', title: 'Sexta-feira Santa', type: InstitutionalEventType.HOLIDAY },
                { date: '2024-05-30', title: 'Corpus Christi', type: InstitutionalEventType.HOLIDAY }
            );
        } else if (year === 2025) {
            holidays.push(
                { date: '2025-03-03', title: 'Carnaval (Ponto Facultativo)', type: InstitutionalEventType.OPTIONAL_HOLIDAY },
                { date: '2025-03-04', title: 'Carnaval (Feriado)', type: InstitutionalEventType.HOLIDAY },
                { date: '2025-04-18', title: 'Sexta-feira Santa', type: InstitutionalEventType.HOLIDAY },
                { date: '2025-06-19', title: 'Corpus Christi', type: InstitutionalEventType.HOLIDAY }
            );
        }

        return holidays;
    },

    /**
     * Converte feriados oficiais em Eventos Institucionais para o Store
     */
    mapHolidaysToInstitutionalEvents: (holidays: OfficialHoliday[], tenantId: string, schoolId: string, userId: string): Omit<InstitutionalEvent, 'createdAt'>[] => {
        return holidays.map(h => ({
            id: uuidv4(),
            tenantId,
            schoolId,
            title: h.title,
            type: h.type,
            date: h.date,
            blocksScheduling: true, // Por padrão, feriados bloqueiam agendamento
            createdBy: userId
        }));
    }
};
