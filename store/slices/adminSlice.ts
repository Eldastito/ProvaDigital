import { StateCreator } from 'zustand';
import { Tenant, AuditLog } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';

export interface AdminSlice {
    tenants: Tenant[];
    auditLogs: AuditLog[];

    addTenant: (tenant: Tenant) => Promise<void>;
    updateTenantFeatures: (tenantId: string, features: any) => Promise<void>;
    loadTenants: () => Promise<void>;
    fetchAuditLogs: (tenantId: string) => Promise<AuditLog[]>;
    logSystemAction: (actionType: string, targetResource: string, targetId: string, details?: any) => Promise<void>;
}

export const createAdminSlice: StateCreator<AppStore, [], [], AdminSlice> = (set, get) => ({
    tenants: [],
    auditLogs: [],

    addTenant: async (tenant) => set((state) => ({ tenants: [...state.tenants, tenant] })),

    updateTenantFeatures: async (id, features) => {
        // ...
    },

    loadTenants: async () => {
        const { data, error } = await supabase.from('tenants').select('*');
        if (data) set({ tenants: data as Tenant[] });
        if (error) console.error("Error loading tenants:", error);
    },

    fetchAuditLogs: async (tenantId) => {
        return [];
    },

    logSystemAction: async (type, resource, id, details) => {
        // ...
    }
});
