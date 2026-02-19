import React from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    LayoutDashboard, Users, MessageCircle, FileText,
    FlaskConical, BookOpen, GraduationCap, Calendar,
    Map, Cast, Printer, Shield, Zap, Stethoscope, BarChart
} from 'lucide-react';
import { ManagementView } from './ManagementView';
import { ClassCouncilView } from '../coordinator/ClassCouncilView';
import { CommunicationView } from '../communication/CommunicationView';
import { ItemsListView } from '../../components/ItemsListView';
import { ItemEditorView } from '../builder/ItemEditorView';
import { ExamBuilderView } from '../builder/ExamBuilderView';
import { ExamsListView } from '../grading/ExamsListView';
import { OnlineExamRunner } from '../runner/features/OnlineExamRunner';
import { ClassDiaryView } from '../class-diary/ClassDiaryView';
import { AllocationView } from '../grading/AllocationView';
import { GamifiedEventsManager } from '../gamification/GamifiedEventsManager';
import { StudyPlansView } from '../academic/StudyPlansView';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { RiskDashboard } from '../analytics/risk/RiskDashboard';
import { PredictiveRiskDashboard } from '../analytics/PredictiveRiskDashboard';
import { NeuroScreeningView } from '../neuro-screening/NeuroScreeningView';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const managementModule: AppModule = {
    id: 'school-management',
    allowedRoles: [UserRole.DIRETOR, UserRole.SUPERVISOR],
    routes: [
        { path: 'coordinator/council', element: <ClassCouncilView /> },
        { path: 'communication', element: <CommunicationView /> },
        { path: 'items', element: <ItemsListView /> },
        { path: 'exams', element: <ExamsListView /> },
        { path: 'class-diary', element: <ClassDiaryView /> },
        { path: 'allocation', element: <AllocationView /> },
        { path: 'gamified-events', element: <GamifiedEventsManager /> },
        { path: 'study-plans', element: <StudyPlansView /> },
        { path: 'analytics', element: <AnalyticsDashboard /> },
        { path: 'risk-dashboard', element: <RiskDashboard /> },
        { path: 'predictive-risk', element: <PredictiveRiskDashboard /> },
        { path: 'neuro-screening', element: <NeuroScreeningView /> },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Painel Gestão', path: '/dashboard' },
        { icon: Users, label: 'Conselho Digital (IA)', path: '/coordinator/council' },
        { icon: MessageCircle, label: 'Comunicação', path: '/communication' },
        { icon: FileText, label: 'Banco de Itens', path: '/items' },
        { icon: FlaskConical, label: 'Lab Multimodal', path: '/items/multimodal-lab' },
        { icon: BookOpen, label: 'Provas', path: '/exams' },
        { icon: GraduationCap, label: 'Aplicação', path: '/online-exam' },
        { icon: Calendar, label: 'Diário', path: '/class-diary' },
        { icon: Map, label: 'Alocação', path: '/allocation' },
        { icon: Cast, label: 'Eventos', path: '/gamified-events' },
        { icon: GraduationCap, label: 'Ensino', path: '/study-plans' },
        { icon: BarChart, label: 'Analytics', path: '/analytics' },
        { icon: Shield, label: 'Risco', path: '/risk-dashboard' },
        { icon: Zap, label: 'Risco Preditivo', path: '/predictive-risk' },
        { icon: Stethoscope, label: 'Saúde Mental', path: '/neuro-screening' },
    ]
};
