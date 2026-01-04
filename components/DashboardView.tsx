
import React from 'react';
import { AppState, UserRole } from '../types';
import { NetworkDashboardView } from './Analytics/NetworkDashboardView';
import { SchoolPrincipalDashboard } from './Analytics/SchoolPrincipalDashboard';
import { PedagogicalDashboard } from './Analytics/PedagogicalDashboard';
import { ProfessorDashboardView } from './Analytics/ProfessorDashboardView';
import { StudentDashboardView } from './StudentPortal/StudentDashboardView';

export const DashboardView = ({ state, setView }: { state: AppState, setView: (v: any) => void }) => {
    const { currentUser } = state;

    // --- 1. DASHBOARD ESTRATÉGICO (SECRETÁRIO / DONO / SECRETÁRIA ESTADUAL) ---
    if (currentUser?.role === UserRole.TENANT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.STATE_ADMIN) {
        return <NetworkDashboardView state={state} />;
    }

    // --- 2. DASHBOARD DE PAIS (Reusa StudentView focado no filho) ---
    if (currentUser?.role === UserRole.PAIS) {
        // Em um app real, o pai selecionaria qual filho visualizar.
        // Para este MVP, assumimos o vinculo com o primeiro estudante do mock ou passamos o user do pai e o componente resolve.
        return <StudentDashboardView state={state} user={currentUser} setView={setView} />;
    }

    // --- 3. DASHBOARD DE GESTÃO (DIRETOR) ---
    if (currentUser?.role === UserRole.DIRETOR) {
        return <SchoolPrincipalDashboard state={state} />;
    }

    // --- 4. DASHBOARD PEDAGÓGICO (SUPERVISOR) ---
    if (currentUser?.role === UserRole.SUPERVISOR) {
        return <PedagogicalDashboard state={state} />;
    }

    // --- 5. DASHBOARD ALUNO ---
    if (currentUser?.role === UserRole.ALUNO) {
        return <StudentDashboardView state={state} user={currentUser} setView={setView} />;
    }

    // --- 6. DASHBOARD OPERACIONAL (PROFESSOR) ---
    return <ProfessorDashboardView state={state} setView={setView} />;
};
