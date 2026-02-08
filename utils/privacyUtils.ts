/**
 * Utilitários de Privacidade e LGPD
 */

/**
 * Mascara dados sensíveis (PII) para exibição em logs e dashboards públicos.
 */
export const maskPII = (text: string, type: 'EMAIL' | 'CPF' | 'NAME' | 'ANY' = 'ANY'): string => {
    if (!text) return '';

    switch (type) {
        case 'EMAIL':
            const [user, domain] = text.split('@');
            if (!domain) return '***@***';
            return `${user.substring(0, 2)}***@${domain}`;

        case 'CPF':
            // Formato esperado: 123.456.789-00 ou 12345678900
            const digits = text.replace(/\D/g, '');
            if (digits.length !== 11) return '***.***.***-**';
            return `${digits.substring(0, 3)}.***.***-${digits.substring(9, 11)}`;

        case 'NAME':
            const parts = text.split(' ');
            if (parts.length === 1) return `${parts[0].substring(0, 2)}***`;
            return `${parts[0]} ${parts[parts.length - 1].substring(0, 1)}.***`;

        default:
            if (text.length <= 4) return '****';
            return `${text.substring(0, 2)}****${text.substring(text.length - 2)}`;
    }
};

/**
 * Verifica se o usuário deu consentimento aos termos de privacidade.
 */
export const hasConsent = (user: any): boolean => {
    return !!user?.consentedAt;
};
