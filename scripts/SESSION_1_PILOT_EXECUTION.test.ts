import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, User, AppState } from '../types';
import { userService } from '../services/userService';
import { AnalyticsService } from '../services/analyticsService';
import { useAppStore } from '../store/useAppStore';

// Mock do AppStore
vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

const MOCK_GUARDIAN: User = {
    id: 'guardian_pilot_1',
    name: 'Responsável Piloto 1',
    email: 'pilot1@examepad.com',
    role: UserRole.PAIS,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    childrenIds: ['child_valid_A', 'child_valid_B'],
    status: 'ACTIVE'
};

const MOCK_STATE: Partial<AppState> = {
    currentUser: MOCK_GUARDIAN,
    selectedChildId: null,
    results: [
        { id: 'res_A', studentId: 'child_valid_A', examId: 'ex_1', totalScore: 9, gradedAt: '2024-03-15', answers: [] },
        { id: 'res_C', studentId: 'child_intruder', examId: 'ex_1', totalScore: 10, gradedAt: '2024-03-15', answers: [] }
    ],
    students: [
        { id: 'child_valid_A', name: 'Filho A', schoolId: 'school_1', tenantId: 'tenant_A' },
        { id: 'child_valid_B', name: 'Filho B', schoolId: 'school_2', tenantId: 'tenant_A' }
    ] as any
};

describe('ONDA 2: SESSÃO PILOTO 1 (Simulação Acompanhada)', () => {
    
    beforeEach(() => {
        vi.mocked(useAppStore.getState).mockReturnValue(MOCK_STATE as any);
        console.log(`[SESSION_OPERATIONAL_LOG][${new Date().toISOString()}] Iniciando etapa da sessão...`);
    });

    it('Etapa 1: Login e Visibilidade Inicial', () => {
        const user = useAppStore.getState().currentUser;
        expect(user?.role).toBe(UserRole.PAIS);
        console.log(`✅ Log de Acesso: Usuário ${user?.id} autenticado com sucesso.`);
    });

    it('Etapa 2: Troca entre dependentes legítimos (Context Switching)', () => {
        // Simula troca para Filho A (Mesma Escola)
        const childA = 'child_valid_A';
        const isAuthorizedA = userService.canGuardianAccessStudent(MOCK_GUARDIAN, childA);
        expect(isAuthorizedA).toBe(true);
        console.log(`✅ Sucesso: Acesso autorizado ao Filho A (${childA}).`);

        // Simula troca para Filho B (Outra Escola - Multi-escola)
        const childB = 'child_valid_B';
        const isAuthorizedB = userService.canGuardianAccessStudent(MOCK_GUARDIAN, childB);
        expect(isAuthorizedB).toBe(true);
        console.log(`✅ Sucesso: Acesso autorizado ao Filho B (${childB}) - Cenário Multi-escola validado.`);
    });

    it('Etapa 3: Tentativa de Acesso a Contexto Inválido (Negativo)', () => {
        const intruderId = 'child_intruder';
        const isAuthorized = userService.canGuardianAccessStudent(MOCK_GUARDIAN, intruderId);
        
        if (!isAuthorized) {
            userService.logSecurityViolation(MOCK_GUARDIAN.id, intruderId, 'Pilot_Session_1/Manual_Trial', 'Tentativa de acesso a aluno não vinculado');
        }
        
        expect(isAuthorized).toBe(false);
        console.log(`✅ Sucesso: Bloqueio autoritativo confirmado para ID intruso (${intruderId}).`);
    });

    it('Etapa 4: Validação de Analytics (Plano de Dados)', () => {
        const analytics = new AnalyticsService(MOCK_STATE as any);
        
        // Acesso válido
        const statsValid = analytics.getStudentStats('child_valid_A');
        expect(statsValid).not.toBeNull();
        console.log('✅ Sucesso: Analytics retornado para dependente legítimo.');

        // Acesso inválido (Bypass Trial)
        const statsInvalid = analytics.getStudentStats('child_intruder');
        expect(statsInvalid).toBeNull();
        console.log('✅ Sucesso: Analytics NEGADO (null) para dependente ilegítimo no plano de dados.');
    });

    it('Etapa 5: Performance do Motor (Decision Latency)', () => {
        const start = performance.now();
        for(let i=0; i<100; i++) {
            userService.canGuardianAccessStudent(MOCK_GUARDIAN, 'child_valid_A');
        }
        const end = performance.now();
        const avg = (end - start) / 100;
        
        expect(avg).toBeLessThan(2); // Meta p95 < 2ms
        console.log(`🔵 Performance: Média de decisão do motor = ${avg.toFixed(4)}ms`);
    });
});
