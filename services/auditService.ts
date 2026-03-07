import { supabase } from '../services/supabaseClient';

export interface AuditLogEntry {
    actorId: string;
    actorEmail?: string;
    schoolId?: string;
    tenantId: string;
    actionType: 'LOGIN' | 'LOGOUT' | 'UPDATE_GRADE' | 'DELETE_USER' | 'CREATE_EXAM' | 'EXPORT_DATA' | 'CHANGE_SETTINGS' | 'VIEW_SENSITIVE_DATA' | 'HANDOFF_GENERATE' | 'HANDOFF_RECEIVE' | 'SECURITY_BREACH' | 'SYNC_OFFLINE';
    targetResource: string;
    targetId?: string;
    details?: any; // JSON object with changes
    ipAddress?: string;
    userAgent?: string;
}

export const auditService = {
    /**
     * Registra uma ação sensível no sistema
     */
    log: async (entry: AuditLogEntry) => {
        try {
            console.log("📝 AUDIT:", entry.actionType, entry.details);

            // Em dev/demo sem backend real, apenas logamos no console
            // Quando conectado ao Supabase, descomentar abaixo:

            const { error } = await supabase.from('audit_logs').insert({
                actor_id: entry.actorId,
                actor_email: entry.actorEmail,
                school_id: entry.schoolId,
                tenant_id: entry.tenantId,
                action_type: entry.actionType,
                target_resource: entry.targetResource,
                target_id: entry.targetId,
                details: entry.details,
                ip_address: entry.ipAddress || '127.0.0.1', // Placeholder logic if frontend can't detect
                user_agent: entry.userAgent || navigator.userAgent
            });

            if (error) {
                console.error("Audit Log Error (Silent):", error);
            }

        } catch (e) {
            // Audit log nunca deve quebrar a aplicação principal
            console.error("Audit Log Exception:", e);
        }
    },

    /**
     * Busca logs (Apenas para Admins)
     */
    fetchLogs: async (tenantId: string, limit = 50) => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
};
