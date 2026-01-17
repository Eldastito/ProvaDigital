
import React from 'react';
import { AppState, UserRole } from '../types';
import { NetworkDashboardView } from '../features/analytics/NetworkDashboardView';
import { SchoolPrincipalDashboard } from '../features/analytics/SchoolPrincipalDashboard';
import { PedagogicalDashboard } from '../features/analytics/PedagogicalDashboard';
import { ParentsDashboardView } from './Parents/ParentsDashboardView';
import { ProfessorDashboardView } from '../features/analytics/ProfessorDashboardView';
import { StudentDashboardView } from '../features/student-portal/StudentDashboardView';

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
