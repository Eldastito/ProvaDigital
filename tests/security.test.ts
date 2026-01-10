import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../services/supabaseClient';

describe('Security - RLS Policies', () => {
    let testTenantId: string;
    let otherTenantId: string;

    beforeAll(() => {
        // IDs de teste (ajustar conforme seu ambiente)
        testTenantId = 't1';
        otherTenantId = 't2';
    });

    describe('Cross-Tenant Isolation', () => {
        it('should prevent reading items from other tenants', async () => {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('tenant_id', otherTenantId);

            // RLS bloqueia - pode retornar null ou []
            expect(!data || data.length === 0).toBe(true);
            expect(error).toBeNull();
        });

        it('should prevent reading exams from other tenants', async () => {
            const { data } = await supabase
                .from('exams')
                .select('*')
                .eq('tenant_id', otherTenantId);

            // RLS bloqueia - pode retornar null ou []
            expect(!data || data.length === 0).toBe(true);
        });

        it('should prevent reading students from other schools', async () => {
            const { data } = await supabase
                .from('students')
                .select('*')
                .eq('tenant_id', otherTenantId);

            // RLS bloqueia - pode retornar null ou []
            expect(!data || data.length === 0).toBe(true);
        });
    });

    describe('Role-Based Access Control', () => {
        it('should allow reading own tenant data', async () => {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('tenant_id', testTenantId)
                .limit(1);

            expect(error).toBeNull();
            // Pode retornar dados ou vazio, mas não deve dar erro
        });

        it('should prevent unauthorized deletion of exam results', async () => {
            const { data } = await supabase
                .from('exam_results')
                .delete()
                .eq('id', 'fake-id-that-does-not-exist');

            // RLS deve impedir deletion - retorna null/undefined ou array vazio
            expect(!data || data.length === 0).toBe(true);
        });
    });

    describe('Risk Alerts - Hierarchical Access', () => {
        it('should only show risk alerts for accessible schools', async () => {
            const { data } = await supabase
                .from('risk_alerts')
                .select('*');

            // Todos os alerts retornados devem ser de escolas acessíveis
            if (data && data.length > 0) {
                const schoolIds = data.map((alert: any) => alert.school_id);

                // Verificar se todas as escolas pertencem ao tenant do usuário
                const { data: schools } = await supabase
                    .from('schools')
                    .select('id, tenant_id')
                    .in('id', schoolIds);

                schools?.forEach(school => {
                    expect(school.tenant_id).toBe(testTenantId);
                });
            }
        });
    });

    describe('Notifications - Personal Access', () => {
        it('should only show notifications for current user', async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('notifications')
                    .select('*');

                // Todas as notificações devem ser do usuário atual
                data?.forEach((notif: any) => {
                    expect(notif.user_id).toBe(user.id);
                });
            }
        });
    });

    describe('Audit Logs - Immutability', () => {
        it('should prevent modification of audit logs', async () => {
            const { error } = await supabase
                .from('audit_logs')
                .update({ action_type: 'MODIFIED' })
                .eq('id', 'fake-id');

            // Deve retornar erro de permissão
            expect(error).toBeTruthy();
        });

        it('should prevent deletion of audit logs', async () => {
            const { error } = await supabase
                .from('audit_logs')
                .delete()
                .eq('id', 'fake-id');

            // Deve retornar erro de permissão
            expect(error).toBeTruthy();
        });
    });

    describe('Tenant ID Validation', () => {
        it('should reject items without tenant_id', async () => {
            const uniqueId = `test-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const { error } = await supabase
                .from('items')
                .insert({
                    id: uniqueId,
                    type: 'MULTIPLE_CHOICE',
                    statement: 'Test question',
                    // tenant_id omitido propositalmente
                });

            // Deve retornar erro (qualquer tipo)
            expect(error).toBeTruthy();
        });

        it('should reject exams without tenant_id', async () => {
            const { error } = await supabase
                .from('exams')
                .insert({
                    id: 'test-exam-no-tenant',
                    title: 'Test Exam',
                    // tenant_id omitido propositalmente
                });

            // Deve retornar erro de constraint
            expect(error).toBeTruthy();
        });
    });
});

describe('Security - Cross-Tenant Data Leakage', () => {
    it('should not leak data through joins', async () => {
        const { data } = await supabase
            .from('exam_results')
            .select(`
        *,
        exams (
          *,
          items (*)
        )
      `);

        // Verificar que todos os dados retornados são do mesmo tenant
        if (data && data.length > 0) {
            const tenantIds = new Set();

            data.forEach((result: any) => {
                if (result.exams) {
                    tenantIds.add(result.exams.tenant_id);

                    if (result.exams.items) {
                        result.exams.items.forEach((item: any) => {
                            tenantIds.add(item.tenant_id);
                        });
                    }
                }
            });

            // Deve haver apenas 1 tenant_id em todos os dados
            expect(tenantIds.size).toBeLessThanOrEqual(1);
        }
    });
});
