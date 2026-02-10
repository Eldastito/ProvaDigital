/**
 * Privacy Service - Core do "Privacy by Design" FORGE 2031
 */
export const privacyService = {
    /**
     * Gera um pseudônimo determinístico para IDs de alunos
     * Útil para logs de auditoria externa onde a trajetória importa, mas o nome não.
     */
    pseudonymize(id: string): string {
        if (!id) return '';
        const hash = btoa(id).substring(0, 8);
        return `anon_${hash}`;
    },

    /**
     * Mascara strings sensíveis (email, nome parcial)
     */
    mask(text: string, type: 'NAME' | 'EMAIL' | 'ID'): string {
        if (!text) return '';

        switch (type) {
            case 'NAME':
                const parts = text.split(' ');
                if (parts.length === 1) return text.substring(0, 2) + '***';
                return `${parts[0]} ${parts[1].substring(0, 1)}.***`;

            case 'EMAIL':
                const [user, domain] = text.split('@');
                return `${user.substring(0, 2)}***@${domain}`;

            case 'ID':
                return `${text.substring(0, 4)}****${text.substring(text.length - 4)}`;

            default:
                return '***';
        }
    }
};
