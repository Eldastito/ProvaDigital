
import React from 'react';
import { AppState, UserRole } from '../types';
import { NetworkDashboardView } from '../modules/analytics/NetworkDashboardView';
import { SchoolPrincipalDashboard } from '../modules/analytics/SchoolPrincipalDashboard';
import { PedagogicalDashboard } from '../modules/analytics/PedagogicalDashboard';
import { ParentsDashboardView } from '../modules/parents/ParentsDashboardView';
import { ProfessorDashboardView } from '../modules/analytics/ProfessorDashboardView';
import { StudentDashboardView } from '../modules/student-portal/StudentDashboardView';

import { useAppStore } from '../store/useAppStore';

export const DashboardView = () => {
    const state = useAppStore();
    const { currentUser } = state;

    // --- 1. DASHBOARD ESTRATÉGICO (SECRETÁRIO / DONO / SECRETÁRIA ESTADUAL) ---
    if (currentUser?.role === UserRole.TENANT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.STATE_ADMIN) {
        return <NetworkDashboardView />;
    }

    // --- 2. DASHBOARD DE PAIS ---
    if (currentUser?.role === UserRole.PAIS) {
        return <ParentsDashboardView />;
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
