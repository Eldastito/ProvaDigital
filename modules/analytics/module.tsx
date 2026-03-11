import React, { lazy, Suspense } from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    PieChart, BarChart, TrendingUp, Globe, ShoppingBag,
    Printer, Users, Shield, Zap, Stethoscope, FileText, BookOpen, LayoutDashboard, MessageSquare
} from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const PredictiveRiskDashboard = lazy(() => import('./PredictiveRiskDashboard').then(m => ({ default: m.PredictiveRiskDashboard })));
const PredictiveDashboardView = lazy(() => import('./PredictiveDashboardView').then(m => ({ default: m.PredictiveDashboardView })));
const OECDPortalView = lazy(() => import('./OECDPortalView').then(m => ({ default: m.OECDPortalView })));
const RiskDashboard = lazy(() => import('./risk/RiskDashboard').then(m => ({ default: m.RiskDashboard })));
const MarketplaceView = lazy(() => import('../marketplace/MarketplaceView').then(m => ({ default: m.MarketplaceView })));
const ReportGeneratorView = lazy(() => import('../reports/ReportGeneratorView').then(m => ({ default: m.ReportGeneratorView })));
const NeuroScreeningView = lazy(() => import('../neuro-screening/NeuroScreeningView').then(m => ({ default: m.NeuroScreeningView })));
const ManagementView = lazy(() => import('../school-management/ManagementView').then(m => ({ default: m.ManagementView })));

const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
);

export const strategicModule: AppModule = {
    id: 'strategic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.STATE_ADMIN, UserRole.TENANT_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MASTER_SAAS],
    routes: [
        { path: 'analytics', element: <S><AnalyticsDashboard /></S> },
        { path: 'predictive-risk', element: <S><PredictiveRiskDashboard /></S> },
        { path: 'advanced-analytics', element: <S><PredictiveDashboardView /></S> },
        { path: 'oecd-portal', element: <S><OECDPortalView onBack={() => window.history.back()} /></S> },
        { path: 'marketplace', element: <S><MarketplaceView /></S> },
        { path: 'risk-dashboard', element: <S><RiskDashboard /></S> },
        { path: 'neuro-screening', element: <S><NeuroScreeningView /></S> },
        { path: 'admin/gestao', element: <S><ManagementView /></S> },
        {
            path: 'adm-relatorios',
            element: <ProtectedRoute resource="REPORTS" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <S><ReportGeneratorView /></S> }]
        },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: BarChart, label: 'Analytics', path: '/analytics' },
        { icon: TrendingUp, label: 'Advanced BI', path: '/advanced-analytics' },
        { icon: Globe, label: 'Portal OCDE', path: '/oecd-portal' },
        { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
        { icon: Printer, label: 'Relatórios', path: '/adm-relatorios', resource: 'REPORTS' },
        { icon: Users, label: 'Rede (Escolas/Usuários)', path: '/admin/gestao' },
        { icon: FileText, label: 'Banco de Itens', path: '/items' },
        { icon: BookOpen, label: 'Provas', path: '/exams' },
        { icon: Shield, label: 'Risco', path: '/risk-dashboard' },
        { icon: Zap, label: 'Risco Preditivo', path: '/predictive-risk' },
        { icon: Stethoscope, label: 'Saúde Mental', path: '/neuro-screening' },
        { icon: MessageSquare, label: 'Chat', path: '/communication' },
    ]
};
