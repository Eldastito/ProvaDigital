import React, { lazy, Suspense } from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    LayoutDashboard, Users, MessageCircle, FileText,
    FlaskConical, BookOpen, GraduationCap, Calendar,
    Map, Cast, Printer, Shield, Zap, Stethoscope, BarChart
} from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const ManagementView = lazy(() => import('./ManagementView').then(m => ({ default: m.ManagementView })));
const ClassCouncilView = lazy(() => import('../coordinator/ClassCouncilView').then(m => ({ default: m.ClassCouncilView })));
const CommunicationView = lazy(() => import('../communication/CommunicationView').then(m => ({ default: m.CommunicationView })));
const ItemsListView = lazy(() => import('../../components/ItemsListView').then(m => ({ default: m.ItemsListView })));
const ExamsListView = lazy(() => import('../grading/ExamsListView').then(m => ({ default: m.ExamsListView })));
const ClassDiaryView = lazy(() => import('../class-diary/ClassDiaryView').then(m => ({ default: m.ClassDiaryView })));
const AllocationView = lazy(() => import('../grading/AllocationView').then(m => ({ default: m.AllocationView })));
const GamifiedEventsManager = lazy(() => import('../gamification/GamifiedEventsManager').then(m => ({ default: m.GamifiedEventsManager })));
const StudyPlansView = lazy(() => import('../academic/StudyPlansView').then(m => ({ default: m.StudyPlansView })));
const AnalyticsDashboard = lazy(() => import('../analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const RiskDashboard = lazy(() => import('../analytics/risk/RiskDashboard').then(m => ({ default: m.RiskDashboard })));
const PredictiveRiskDashboard = lazy(() => import('../analytics/PredictiveRiskDashboard').then(m => ({ default: m.PredictiveRiskDashboard })));
const NeuroScreeningView = lazy(() => import('../neuro-screening/NeuroScreeningView').then(m => ({ default: m.NeuroScreeningView })));

const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
);

export const managementModule: AppModule = {
    id: 'school-management',
    allowedRoles: [UserRole.DIRETOR, UserRole.SUPERVISOR],
    routes: [
        { path: 'admin/gestao', element: <S><ManagementView /></S> },
        { path: 'coordinator/council', element: <S><ClassCouncilView /></S> },
        { path: 'communication', element: <S><CommunicationView /></S> },
        { path: 'items', element: <S><ItemsListView /></S> },
        { path: 'exams', element: <S><ExamsListView /></S> },
        { path: 'class-diary', element: <S><ClassDiaryView /></S> },
        { path: 'allocation', element: <S><AllocationView /></S> },
        { path: 'gamified-events', element: <S><GamifiedEventsManager /></S> },
        { path: 'study-plans', element: <S><StudyPlansView /></S> },
        { path: 'analytics', element: <S><AnalyticsDashboard /></S> },
        { path: 'risk-dashboard', element: <S><RiskDashboard /></S> },
        { path: 'predictive-risk', element: <S><PredictiveRiskDashboard /></S> },
        { path: 'neuro-screening', element: <S><NeuroScreeningView /></S> },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Painel Gestão', path: '/dashboard' },
        { icon: Users, label: 'Rede', path: '/admin/gestao' },
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
