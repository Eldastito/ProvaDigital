import { supabase } from './supabaseClient';

/**
 * Serviço de Governança Jurídica e Proteção de Dados (Fase IX - Plano 2031)
 * Implementa Privacy by Design e Conformidade LGPD.
 */
export const privacyService = {
    /**
     * Mascara um nome para exibição em auditorias públicas/parciais.
     * Ex: "Michele Santos" -> "M*** S***"
     */
    maskName: (name: string): string => {
        if (!name) return 'Usuário Mascarado';
        return name
            .split(' ')
            .map(part => part[0] + '*'.repeat(Math.max(0, part.length - 1)))
            .join(' ');
    },

    /**
     * Mascara um CPF ou documento de identidade.
     */
    maskPII: (value: string): string => {
        if (!value) return '***';
        if (value.length <= 4) return '****';
        return value.substring(0, 3) + '***.***-' + value.slice(-2);
    },

    /**
     * Registra um log de acesso a dado sensível para auditoria LGPD.
     */
    logPrivacyAccess: async (targetUserId: string, reason: string, dataCategory: 'ACADEMIC' | 'PERSONAL' | 'PSYCHOMETRIC') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Em um cenário real, pegaríamos o IP via Edge Function ou Header
            const payload = {
                actor_id: user.id,
                target_user_id: targetUserId,
                data_category: dataCategory,
                reason: reason,
                ip_address: '0.0.0.0', // Placeholder
                user_agent: navigator.userAgent,
                access_timestamp: new Date().toISOString()
            };

            const { error } = await supabase.from('privacy_access_logs').insert(payload);
            if (error) throw error;

            console.info(`🛡️ [LGPD Audit] Acesso a dados (${dataCategory}) registrado.`);
        } catch (err) {
            console.error('❌ Falha ao registrar log de privacidade:', err);
        }
    },

    /**
     * Verifica se o usuário atual tem consentimento ativo.
     */
    hasConsent: async (userId: string, purpose: string): Promise<boolean> => {
        // Mock de verificação de consentimento (Fase IX)
        // Em produção, consultaria a tabela de 'user_consents'
        console.log(`🔍 [Privacy] Verificando consentimento de ${userId} para: ${purpose}`);
        return true;
    }
};
