import React from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    PieChart, Calendar, Home, Activity, CalendarCheck,
    FileText, FlaskConical, BookOpen, GraduationCap, BarChart
} from 'lucide-react';
import { ProfessorDashboardView } from './ProfessorDashboardView';
import { ClassDiaryView } from '../class-diary/ClassDiaryView';
import { ProfessorApp } from '../runner/student-app/ProfessorApp';
import { ExamScheduler } from '../coordinator/ExamScheduler';
import { CommandCenter } from '../coordinator/CommandCenter';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const professorModule: AppModule = {
    id: 'professor',
    allowedRoles: [UserRole.PROFESSOR],
    routes: [
        { path: 'class-diary', element: <ClassDiaryView /> },
        { path: 'professor/logistics', element: <ProfessorApp onBack={() => window.history.back()} /> },
        {
            path: 'agendamento',
            element: <ProtectedRoute resource="SCHEDULING" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <ExamScheduler /> }]
        },
        {
            path: 'central-comando',
            element: <ProtectedRoute resource="COMMAND_CENTER" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <CommandCenter /> }]
        },
    ],
    sidebarItems: [
        { icon: PieChart, label: 'Minhas Turmas', path: '/dashboard' },
        { icon: Calendar, label: 'Diário', path: '/class-diary' },
        { icon: Home, label: 'Logística Professor', path: '/professor/logistics' },
        {
            icon: Activity,
            label: 'Painel de Controle',
            path: '/central-comando',
            resource: 'COMMAND_CENTER'
        },
        {
            icon: CalendarCheck,
            label: 'Agendamento',
            path: '/agendamento',
            resource: 'SCHEDULING'
        },
        { icon: FileText, label: 'Banco de Questões', path: '/items' },
        { icon: FlaskConical, label: 'Lab Multimodal', path: '/items/multimodal-lab' },
        { icon: BookOpen, label: 'Minhas Provas', path: '/exams' },
        { icon: GraduationCap, label: 'Aplicação', path: '/online-exam' },
        { icon: BarChart, label: 'Analytics', path: '/analytics' },
        { icon: GraduationCap, label: 'Planos de Ensino', path: '/study-plans' },
    ]
};
