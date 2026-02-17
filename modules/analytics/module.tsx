import React from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    PieChart, BarChart, TrendingUp, Globe, ShoppingBag,
    Printer, Users, Shield, Zap, Stethoscope
} from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { PredictiveRiskDashboard } from './PredictiveRiskDashboard';
import { PredictiveDashboardView } from './PredictiveDashboardView';
import { OECDPortalView } from './OECDPortalView';
import { RiskDashboard } from './risk/RiskDashboard';
import { MarketplaceView } from '../marketplace/MarketplaceView';
import { ReportGeneratorView } from '../reports/ReportGeneratorView';
import { NeuroScreeningView } from '../neuro-screening/NeuroScreeningView';
import { ManagementView } from '../school-management/ManagementView';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const strategicModule: AppModule = {
    id: 'strategic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.STATE_ADMIN, UserRole.TENANT_ADMIN],
    routes: [
        { path: 'analytics', element: <AnalyticsDashboard /> },
        { path: 'predictive-risk', element: <PredictiveRiskDashboard /> },
        { path: 'advanced-analytics', element: <PredictiveDashboardView /> },
        { path: 'oecd-portal', element: <OECDPortalView onBack={() => window.history.back()} /> },
        { path: 'marketplace', element: <MarketplaceView /> },
        { path: 'risk-dashboard', element: <RiskDashboard /> },
        { path: 'neuro-screening', element: <NeuroScreeningView /> },
        { path: 'admin/gestao', element: <ManagementView /> },
        {
            path: 'adm-relatorios',
            element: <ProtectedRoute resource="REPORTS" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <ReportGeneratorView /> }]
        },
    ],
    sidebarItems: [
        { icon: PieChart, label: 'Visão Geral', path: '/dashboard' },
        { icon: BarChart, label: 'Analytics', path: '/analytics' },
        { icon: TrendingUp, label: 'Advanced BI', path: '/advanced-analytics' },
        { icon: Globe, label: 'Portal OCDE', path: '/oecd-portal' },
        { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
        {
            icon: Printer,
            label: 'Relatórios',
            path: '/adm-relatorios',
            resource: 'REPORTS'
        },
        { icon: Users, label: 'Rede', path: '/admin/gestao' },
        { icon: Shield, label: 'Risco', path: '/risk-dashboard' },
        { icon: Zap, label: 'Risco Preditivo', path: '/predictive-risk' },
        { icon: Stethoscope, label: 'Saúde Mental', path: '/neuro-screening' },
    ]
};
