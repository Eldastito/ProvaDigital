import { describe, it, expect, vi } from 'vitest';
import { usePermissions } from '../hooks/usePermissions';
import { useAppStore } from '../store/useAppStore';
import { UserRole } from '../types';

// Mock useAppStore
vi.mock('../store/useAppStore');

describe('usePermissions - Role Separation', () => {
    it('SYSTEM_ADMIN should have absolute access to everything', () => {
        (useAppStore as any).mockReturnValue({
            currentUser: { role: UserRole.SYSTEM_ADMIN, tenantId: 't1' },
            globalPermissions: {},
            tenants: []
        });

        const { can } = usePermissions();
        expect(can('DELETE', 'FINANCIAL')).toBe(true);
        expect(can('CREATE', 'TENANT_MGMT')).toBe(true);
        expect(can('VIEW', 'SCHOOL_DATA')).toBe(true);
    });

    it('SUPER_ADMIN (MEC) should have access to education but NOT financial/saas mgmt', () => {
        (useAppStore as any).mockReturnValue({
            currentUser: { role: UserRole.SUPER_ADMIN, tenantId: 't1' },
            globalPermissions: {
                [UserRole.SUPER_ADMIN]: {
                    SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
                    USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
                }
            },
            tenants: []
        });

        const { can } = usePermissions();
        expect(can('VIEW', 'SCHOOL_DATA')).toBe(true);
        expect(can('VIEW', 'FINANCIAL')).toBe(false);
        expect(can('CREATE', 'TENANT_MGMT')).toBe(false);
    });

    it('other roles should follow the permission matrix', () => {
        (useAppStore as any).mockReturnValue({
            currentUser: { role: UserRole.PROFESSOR, tenantId: 't1' },
            globalPermissions: {
                [UserRole.PROFESSOR]: {
                    SCHOOL_DATA: ['VIEW'],
                }
            },
            tenants: []
        });

        const { can } = usePermissions();
        expect(can('VIEW', 'SCHOOL_DATA')).toBe(true);
        expect(can('DELETE', 'SCHOOL_DATA')).toBe(false);
    });
});
