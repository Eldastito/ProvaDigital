import { describe, it, expect, vi } from 'vitest';
import { UserRole, User, AppState } from '../types';
import { userService } from '../services/userService';
import { AnalyticsService } from '../services/analyticsService';
import { growthService } from '../services/growthService';

// Mock do AppStore para isolar testes de serviços
vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn()
    }
}));

import { useAppStore } from '../store/useAppStore';

const MOCK_GUARDIAN: User = {
    id: 'guardian_secure_1',
    name: 'Pai Autorizado',
    role: UserRole.PAIS,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    childrenIds: ['student_valid_1', 'student_valid_2'],
    status: 'ACTIVE'
};

const MOCK_GUARDIAN_NO_LINK: User = {
    id: 'guardian_no_link',
    name: 'Pai Sem Vínculo',
    role: UserRole.PAIS,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    childrenIds: [],
    status: 'ACTIVE'
};

const MOCK_STATE: Partial<AppState> = {
    currentUser: MOCK_GUARDIAN,
    results: [
        { id: 'res_1', studentId: 'student_valid_1', examId: 'ex_1', totalScore: 8, gradedAt: '2024-01-01' },
        { id: 'res_2', studentId: 'student_invalid_1', examId: 'ex_1', totalScore: 10, gradedAt: '2024-01-01' }
    ],
    exams: [],
    students: []
};

describe('Fase 2B.1: Validação Autoritativa de Segurança', () => {
    
    it('Cenário 1: Responsável -> Aluno vinculado (Permitido)', () => {
        const analytics = new AnalyticsService({ ...MOCK_STATE, currentUser: MOCK_GUARDIAN } as any);
        const res = analytics.getStudentStats('student_valid_1');
        
        expect(res).not.toBeNull();
        expect(res?.id).toBe('student_valid_1');
    });

    it('Cenário 2: Responsável -> Aluno não vinculado mesma escola (Negado)', () => {
        const analytics = new AnalyticsService({ ...MOCK_STATE, currentUser: MOCK_GUARDIAN } as any);
        const res = analytics.getStudentStats('student_invalid_1');
        
        expect(res).toBeNull();
    });

    it('Cenário 3: Responsável -> Aluno de outra escola (Negado)', () => {
        const analytics = new AnalyticsService({ ...MOCK_STATE, currentUser: MOCK_GUARDIAN } as any);
        const res = analytics.getStudentStats('student_cross_school');
        
        expect(res).toBeNull();
    });

    it('Cenário 4: Responsável com múltiplos dependentes (Permitido para ambos)', () => {
        const analytics = new AnalyticsService({ ...MOCK_STATE, currentUser: MOCK_GUARDIAN } as any);
        const resA = analytics.getStudentStats('student_valid_1');
        const resB = analytics.getStudentStats('student_valid_2');
        
        expect(resA).not.toBeNull();
        expect(resB).not.toBeNull();
    });

    it('Cenário 5: Responsável sem nenhum vínculo (Negado total)', () => {
        const analytics = new AnalyticsService({ ...MOCK_STATE, currentUser: MOCK_GUARDIAN_NO_LINK } as any);
        const res = analytics.getStudentStats('student_valid_1');
        
        expect(res).toBeNull();
    });

    it('Cenário 6: Bypass via GrowthService (Bloqueio Autoritativo)', async () => {
        vi.mocked(useAppStore.getState).mockReturnValue({ currentUser: MOCK_GUARDIAN } as any);
        
        const res = await growthService.calculateStudentGrowth('student_invalid_1', 'ex_1', 'ex_2');
        expect(res).toBeNull();
    });

    it('Cenário 7: Parâmetro forjado na função de vínculo (Resistência)', () => {
        const res = userService.canGuardianAccessStudent(MOCK_GUARDIAN, '../../etc/passwd' as any);
        expect(res).toBe(false);
    });

    it('Cenário 8: Aluno vinculado mas com Role incorreta (Segurança de Tipo)', () => {
        const fakeGuardian = { ...MOCK_GUARDIAN, role: UserRole.ALUNO };
        const res = userService.canGuardianAccessStudent(fakeGuardian as any, 'student_valid_1');
        expect(res).toBe(false); // Apenas papéis autorizados (PAIS) passam pela validação de vínculo de dependente
    });
});
