
import React from 'react';
import { AppState, UserRole } from '../types';
import { NetworkDashboardView } from './Analytics/NetworkDashboardView';
import { SchoolPrincipalDashboard } from './Analytics/SchoolPrincipalDashboard';
import { PedagogicalDashboard } from './Analytics/PedagogicalDashboard';
import { ProfessorDashboardView } from './Professor/ProfessorDashboardView';
import { StudentDashboardView } from './StudentPortal/StudentDashboardView';

import { useAppStore } from '../store/useAppStore';

export const DashboardView = () => {
    const state = useAppStore();
    const { currentUser } = state;

    // --- 1. DASHBOARD ESTRATÉGICO (SECRETÁRIO / DONO / SECRETÁRIA ESTADUAL) ---
    if (currentUser?.role === UserRole.TENANT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.STATE_ADMIN) {
        return <NetworkDashboardView />;
    }

    // --- 2. DASHBOARD DE PAIS (Reusa StudentView focado no filho) ---
    if (currentUser?.role === UserRole.PAIS) {
        // Em um app real, o pai selecionaria qual filho visualizar.
        // Para este MVP, assumimos o vinculo com o primeiro estudante do mock ou passamos o user do pai e o componente resolve.
        return <StudentDashboardView />;
    }

    // --- 3. DASHBOARD DE GESTÃO (DIRETOR) ---
    if (currentUser?.role === UserRole.DIRETOR) {
        return <SchoolPrincipalDashboard />;
    }

    // --- 4. DASHBOARD PEDAGÓGICO (SUPERVISOR) ---
    if (currentUser?.role === UserRole.SUPERVISOR) {
        return <PedagogicalDashboard />;
    }

    // --- 5. DASHBOARD ALUNO ---
    if (currentUser?.role === UserRole.ALUNO) {
        return <StudentDashboardView />;
    }

    // --- 6. DASHBOARD OPERACIONAL (PROFESSOR) ---
    return <ProfessorDashboardView />;

};
