import { TenantType } from '../types';

/**
 * EnrollmentService
 * Gera números de matrícula seguindo padrões de rede
 */
export const enrollmentService = {
    /**
     * Gera um número de matrícula prefixado pelo tipo de rede
     * Padrão sugerido: [PREFIXO][ANO][UUID_CURTO]
     */
    generateRegistrationNumber: (tenantType: TenantType | string): string => {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();

        let prefix = 'GEN';
        switch (tenantType) {
            case TenantType.PUBLIC_MUNICIPAL: prefix = 'MUN'; break;
            case TenantType.PUBLIC_STATE: prefix = 'EST'; break;
            case TenantType.PUBLIC_FEDERAL: prefix = 'FED'; break;
            case TenantType.PRIVATE: prefix = 'PRI'; break;
        }

        return `${prefix}${year}${random}`;
    },

    /**
     * Valida se um número de matrícula segue o formato básico
     */
    isValid: (regNumber: string): boolean => {
        return /^[A-Z]{3}\d{4}[A-Z0-9]{4}$/.test(regNumber);
    }
};
