/**
 * Alert Service - Sistema de Persistência de Alertas de Risco
 * 
 * Funciona com mock data OU Supabase (configurável)
 */

import { supabase } from './supabaseClient';
import { RiskAssessment } from './riskDetectionEngine';
import { RiskLevel } from '../types';
import { uuidv4 } from '../utils/helpers';

// ============================================
// TIPOS
// ============================================

export interface RiskAlert {
    id: string;
    studentId: string;
    studentName: string;
    schoolId: string;
    classId: string;
    riskLevel: RiskLevel;
    riskScore: number;
    factors: any[];
    interventions: any[];
    status: 'ACTIVE' | 'RESOLVED' | 'IGNORED';
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
    notes?: string;
}

export interface Intervention {
    id: string;
    alertId: string;
    action: string;
    description: string;
    responsibleId: string;
    responsibleName: string;
    target: 'PARENT' | 'TEACHER' | 'COORDINATOR' | 'PSYCHOLOGIST' | 'STUDENT';
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    scheduledDate?: string;
    completedAt?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'RISK_ALERT' | 'INTERVENTION_DUE' | 'INTERVENTION_COMPLETED' | 'SYSTEM';
    title: string;
    message: string;
    data?: any;
    read: boolean;
    readAt?: string;
    createdAt: string;
    expiresAt?: string;
}

// ============================================
// CONFIGURAÇÃO
// ============================================

// TENTA usar Supabase se as chaves estiverem definidas, senão cai no Mock
const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

// Mock Storage (simula banco de dados)
let mockAlerts: RiskAlert[] = [];
let mockInterventions: Intervention[] = [];
let mockNotifications: Notification[] = [];

// ============================================
// FUNÇÕES DE ALERTAS
// ============================================

/**
 * Salva ou atualiza um alerta de risco
 */
export const saveRiskAlert = async (assessment: RiskAssessment): Promise<RiskAlert> => {
    const alert: RiskAlert = {
        id: uuidv4(),
        studentId: assessment.studentId,
        studentName: assessment.studentName,
        schoolId: assessment.schoolId || '',
        classId: assessment.classId,
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        factors: assessment.factors || [],
        interventions: assessment.interventions || [],
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
    };

    if (USE_SUPABASE) {
        const { data, error } = await supabase
            .from('risk_alerts')
            .insert([{
                id: alert.id,
                student_id: alert.studentId,
                student_name: alert.studentName,
                school_id: alert.schoolId,
                class_id: alert.classId,
                risk_level: alert.riskLevel,
                risk_score: alert.riskScore,
                factors: alert.factors,
                interventions: alert.interventions,
                status: alert.status,
                created_at: alert.createdAt
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase Save Alert Error:', error);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Hint:', error.hint);
            console.error('Code:', error.code);
            throw error;
        }

        // Mapeia de volta para camelCase para não quebrar o frontend
        return {
            ...data,
            studentId: data.student_id,
            studentName: data.student_name,
            schoolId: data.school_id,
            classId: data.class_id,
            riskLevel: data.risk_level,
            riskScore: data.risk_score,
            createdAt: data.created_at
        };
    } else {
        // Mock: Verifica se já existe alerta ativo para este aluno
        const existingIndex = mockAlerts.findIndex(
            a => a.studentId === alert.studentId && a.status === 'ACTIVE'
        );

        if (existingIndex >= 0) {
            // Atualiza alerta existente
            mockAlerts[existingIndex] = { ...mockAlerts[existingIndex], ...alert };
            return mockAlerts[existingIndex];
        } else {
            // Cria novo alerta
            mockAlerts.push(alert);
            return alert;
        }
    }
};

/**
 * Busca alertas ativos de uma escola
 */
export const getActiveAlerts = async (schoolId: string): Promise<RiskAlert[]> => {
    if (USE_SUPABASE) {
        const { data, error } = await supabase
            .from('risk_alerts')
            .select('*')
            .eq('school_id', schoolId)
            .eq('status', 'ACTIVE')
            .order('risk_score', { ascending: false });

        if (error) throw error;
        return data || [];
    } else {
        // Mock
        return mockAlerts.filter(a => a.schoolId === schoolId && a.status === 'ACTIVE');
    }
};

/**
 * Resolve um alerta (marca como resolvido)
 */
export const resolveAlert = async (
    alertId: string,
    resolvedBy: string,
    notes?: string
): Promise<void> => {
    if (USE_SUPABASE) {
        const { error } = await supabase
            .from('risk_alerts')
            .update({
                status: 'RESOLVED',
                resolved_at: new Date().toISOString(),
                resolved_by: resolvedBy,
                notes
            })
            .eq('id', alertId);

        if (error) throw error;
    } else {
        // Mock
        const alert = mockAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'RESOLVED';
            alert.resolvedAt = new Date().toISOString();
            alert.resolvedBy = resolvedBy;
            alert.notes = notes;
        }
    }
};

// ============================================
// FUNÇÕES DE INTERVENÇÕES
// ============================================

/**
 * Cria uma intervenção
 */
export const createIntervention = async (
    intervention: Omit<Intervention, 'id' | 'createdAt'>
): Promise<Intervention> => {
    const newIntervention: Intervention = {
        ...intervention,
        id: uuidv4(),
        createdAt: new Date().toISOString()
    };

    if (USE_SUPABASE) {
        const { data, error } = await supabase
            .from('interventions')
            .insert([{
                id: newIntervention.id,
                alert_id: newIntervention.alertId,
                action: newIntervention.action,
                description: newIntervention.description,
                responsible_id: newIntervention.responsibleId,
                responsible_name: newIntervention.responsibleName,
                target: newIntervention.target,
                priority: newIntervention.priority,
                scheduled_date: newIntervention.scheduledDate,
                completed_at: newIntervention.completedAt,
                status: newIntervention.status,
                notes: newIntervention.notes,
                created_at: newIntervention.createdAt
            }])
            .select()
            .single();

        if (error) throw error;
        // Mapeia de volta para o tipo da interface se necessário
        return {
            ...data,
            alertId: data.alert_id,
            responsibleId: data.responsible_id,
            responsibleName: data.responsible_name,
            scheduledDate: data.scheduled_date,
            completedAt: data.completed_at,
            createdAt: data.created_at
        };
    } else {
        // Mock
        mockInterventions.push(newIntervention);
        return newIntervention;
    }
};

/**
 * Busca intervenções de um alerta
 */
export const getInterventionsByAlert = async (alertId: string): Promise<Intervention[]> => {
    if (USE_SUPABASE) {
        const { data, error } = await supabase
            .from('interventions')
            .select('*')
            .eq('alert_id', alertId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } else {
        // Mock
        return mockInterventions.filter(i => i.alertId === alertId);
    }
};

/**
 * Busca todas as intervenções de uma escola (para o Dashboard)
 */
export const getActiveInterventions = async (schoolId: string): Promise<Intervention[]> => {
    // Nota: Como interventions não tem school_id direto, fazemos join com risk_alerts
    if (USE_SUPABASE) {
        const { data, error } = await supabase
            .from('interventions')
            .select(`
                *,
                risk_alerts!inner(school_id, student_name, class_id)
            `)
            .eq('risk_alerts.school_id', schoolId)
            .neq('status', 'CANCELLED')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Flatten ou ajustar conforme necessário
        return data.map((i: any) => ({
            ...i,
            studentName: i.risk_alerts?.student_name, // Enriching with student info
            alertId: i.alert_id,
            responsibleId: i.responsible_id,
            responsibleName: i.responsible_name,
            scheduledDate: i.scheduled_date,
            completedAt: i.completed_at,
            createdAt: i.created_at
        }));
    } else {
        // Mock: Filter by looking up parent alerts
        return mockInterventions.filter(i => {
            const parentAlert = mockAlerts.find(a => a.id === i.alertId);
            return parentAlert && parentAlert.schoolId === schoolId && i.status !== 'CANCELLED';
        }).map(i => {
            const parentAlert = mockAlerts.find(a => a.id === i.alertId);
            return { ...i, studentName: parentAlert?.studentName };
        }) as any;
    }
};

/**
 * Marca intervenção como concluída
 */
export const completeIntervention = async (
    interventionId: string,
    notes?: string
): Promise<void> => {
    if (USE_SUPABASE) {
        const { error } = await supabase
            .from('interventions')
            .update({
                status: 'COMPLETED',
                completed_at: new Date().toISOString(),
                notes
            })
            .eq('id', interventionId);

        if (error) throw error;
    } else {
        // Mock
        const intervention = mockInterventions.find(i => i.id === interventionId);
        if (intervention) {
            intervention.status = 'COMPLETED';
            intervention.completedAt = new Date().toISOString();
            intervention.notes = notes;
        }
    }
};

// ============================================
// FUNÇÕES DE NOTIFICAÇÕES
// ============================================

/**
 * Cria uma notificação
 */
export const createNotification = async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<Notification> => {
    const newNotification: Notification = {
        ...notification,
        id: uuidv4(),
        read: false,
        createdAt: new Date().toISOString()
    };

    if (USE_SUPABASE) {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                id: newNotification.id,
                user_id: newNotification.userId,
                type: newNotification.type,
                title: newNotification.title,
                message: newNotification.message,
                data: newNotification.data,
                read: newNotification.read,
                created_at: newNotification.createdAt,
                expires_at: newNotification.expiresAt
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            userId: data.user_id,
            createdAt: data.created_at,
            readAt: data.read_at,
            expiresAt: data.expires_at
        };
    } else {
        // Mock
        mockNotifications.push(newNotification);
        return newNotification;
    }
};

/**
 * Busca notificações de um usuário
 */
export const getUserNotifications = async (
    userId: string,
    unreadOnly = false
): Promise<Notification[]> => {
    if (USE_SUPABASE) {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (unreadOnly) {
            query = query.eq('read', false);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } else {
        // Mock
        let notifications = mockNotifications.filter(n => n.userId === userId);
        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }
        return notifications.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
};

/**
 * Marca notificação como lida
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (USE_SUPABASE) {
        const { error } = await supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId);

        if (error) throw error;
    } else {
        // Mock
        const notification = mockNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
        }
    }
};

/**
 * Marca todas as notificações como lidas
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    if (USE_SUPABASE) {
        const { error } = await supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
    } else {
        // Mock
        mockNotifications
            .filter(n => n.userId === userId && !n.read)
            .forEach(n => {
                n.read = true;
                n.readAt = new Date().toISOString();
            });
    }
};

// ============================================
// FUNÇÕES DE PROCESSAMENTO EM LOTE
// ============================================

/**
 * Processa alertas de risco para uma escola inteira
 * (Chamado diariamente via cron ou manualmente)
 */
export const processSchoolRiskAlerts = async (
    schoolId: string,
    assessments: RiskAssessment[]
): Promise<{ created: number; updated: number; notifications: number }> => {
    let created = 0;
    let updated = 0;
    let notifications = 0;

    for (const assessment of assessments) {
        // Só processa se tiver risco MÉDIO ou ALTO
        if (assessment.riskLevel === RiskLevel.LOW) continue;

        // Salva alerta
        const alert = await saveRiskAlert(assessment);

        // Verifica se é novo (criado agora)
        const isNew = new Date(alert.createdAt).getTime() > Date.now() - 5000;

        if (isNew) {
            created++;

            // Cria notificação para coordenadores
            // TODO: Buscar coordenadores da escola
            let title = `⚠️ Alerta de Risco ${assessment.riskLevel}`;
            let message = `${assessment.studentName} precisa de atenção. Score: ${assessment.riskScore}/100`;

            // Lógica Específica de Evasão
            if (assessment.evasionProbability === 'CRITICA' || assessment.evasionProbability === 'ALTA') {
                title = `🚨 ALERTA DE EVASÃO: ${assessment.studentName}`;
                message = `Risco de Evasão ${assessment.evasionProbability}. Assiduidade: ${assessment.attendance}%. Intervenção Imediata Necessária!`;

                // Simulação de envio de SMS/Email
                console.log(`[MOCK EMAIL/SMS] Enviando alerta de Evasão para Pais e Direção: ${assessment.studentName}`);
            }

            await createNotification({
                userId: 'coordinator-mock', // Substituir por IDs reais
                type: 'RISK_ALERT',
                title: title,
                message: message,
                data: { alertId: alert.id, studentId: assessment.studentId, evasion: assessment.evasionProbability }
            });

            notifications++;
        } else {
            updated++;
        }
    }

    return { created, updated, notifications };
};

// ============================================
// FUNÇÕES DE MOCK DATA (PARA TESTES)
// ============================================

/**
 * Gera dados de exemplo para testes
 */
export const generateMockData = () => {
    // Limpa dados anteriores
    mockAlerts = [];
    mockInterventions = [];
    mockNotifications = [];

    // Cria 3 alertas de exemplo
    const mockAlert1: RiskAlert = {
        id: 'alert-001',
        studentId: 'student-001',
        studentName: 'João Silva',
        schoolId: 'school-001',
        classId: 'class-001',
        riskLevel: RiskLevel.HIGH,
        riskScore: 85,
        factors: [
            { name: 'Baixa Frequência', severity: 'HIGH', value: '65%' }
        ],
        interventions: [],
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dias atrás
    };

    mockAlerts.push(mockAlert1);

    // Cria notificação de exemplo
    mockNotifications.push({
        id: 'notif-001',
        userId: 'current-user',
        type: 'RISK_ALERT',
        title: '⚠️ Novo Alerta de Risco ALTO',
        message: 'João Silva precisa de atenção urgente. Score: 85/100',
        data: { alertId: 'alert-001' },
        read: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    console.log('✅ Mock data gerado:', {
        alerts: mockAlerts.length,
        interventions: mockInterventions.length,
        notifications: mockNotifications.length
    });
};

// Gera mock data automaticamente APENAS se não estiver usando Supabase
if (!USE_SUPABASE) {
    generateMockData();
}
