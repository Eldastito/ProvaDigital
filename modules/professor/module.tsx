import React, { lazy, Suspense } from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    PieChart, Calendar, Home, Activity, CalendarCheck,
    FileText, FlaskConical, BookOpen, GraduationCap, BarChart, LayoutDashboard, MonitorPlay
} from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const ProfessorDashboardView = lazy(() => import('./ProfessorDashboardView').then(m => ({ default: m.ProfessorDashboardView })));
const ClassDiaryView = lazy(() => import('../class-diary/ClassDiaryView').then(m => ({ default: m.ClassDiaryView })));
const ProfessorApp = lazy(() => import('../runner/student-app/ProfessorApp').then(m => ({ default: m.ProfessorApp })));
const ExamScheduler = lazy(() => import('../coordinator/ExamScheduler').then(m => ({ default: m.ExamScheduler })));
const CommandCenter = lazy(() => import('../coordinator/CommandCenter').then(m => ({ default: m.CommandCenter })));
const ProjectionLabView = lazy(() => import('./ProjectionLabView').then(m => ({ default: m.ProjectionLabView })));

const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
);

export const professorModule: AppModule = {
    id: 'professor',
    allowedRoles: [UserRole.PROFESSOR, UserRole.DIRETOR, UserRole.SYSTEM_ADMIN, UserRole.MASTER_SAAS],
    routes: [
        { path: 'class-diary', element: <S><ClassDiaryView /></S> },
        { path: 'professor/logistics', element: <S><ProfessorApp onBack={() => window.history.back()} /></S> },
        { path: 'professor/projection-lab', element: <S><ProjectionLabView /></S> },
        {
            path: 'agendamento',
            element: <ProtectedRoute resource="SCHEDULING" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <S><ExamScheduler /></S> }]
        },
        {
            path: 'central-comando',
            element: <ProtectedRoute resource="COMMAND_CENTER" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <S><CommandCenter /></S> }]
        },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Calendar, label: 'Diário', path: '/class-diary' },
        { icon: Home, label: 'Logística Professor', path: '/professor/logistics' },
        { icon: MonitorPlay, label: 'Laboratório de Projeção', path: '/professor/projection-lab' },
        { icon: Activity, label: 'Painel de Controle', path: '/central-comando', resource: 'COMMAND_CENTER' },
        { icon: CalendarCheck, label: 'Agendamento', path: '/agendamento', resource: 'SCHEDULING' },
        { icon: FileText, label: 'Banco de Itens', path: '/items' },
        { icon: FlaskConical, label: 'Lab Multimodal', path: '/items/multimodal-lab' },
        { icon: BookOpen, label: 'Minhas Provas', path: '/exams' },
        { icon: GraduationCap, label: 'Aplicação', path: '/online-exam' },
        { icon: BarChart, label: 'Analytics', path: '/analytics' },
        { icon: GraduationCap, label: 'Planos de Ensino', path: '/study-plans' },
    ]
};
