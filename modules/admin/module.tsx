import React, { lazy, Suspense } from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    Shield, Truck, History, Settings, FileUp, Terminal, Target, Gamepad2, Package, Users, FileText, BookOpen, Database, Activity
} from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const SaaSControlPanelView = lazy(() => import('./SaaSControlPanelView').then(m => ({ default: m.SaaSControlPanelView })));
const LogisticsManagementView = lazy(() => import('./LogisticsManagementView'));
const AuditLogView = lazy(() => import('./components/AuditLogView').then(m => ({ default: m.AuditLogView })));
const GovernanceView = lazy(() => import('./components/GovernanceView').then(m => ({ default: m.GovernanceView })));
const CapabilitiesView = lazy(() => import('./components/CapabilitiesView').then(m => ({ default: m.CapabilitiesView })));
const BulkImportView = lazy(() => import('./components/BulkImportView').then(m => ({ default: m.BulkImportView })));
const AIDiagnosticView = lazy(() => import('../diagnostics/AIDiagnosticView').then(m => ({ default: m.AIDiagnosticView })));
const ManagementView = lazy(() => import('../school-management/ManagementView').then(m => ({ default: m.ManagementView })));
const DataSovereigntyView = lazy(() => import('./DataSovereigntyView'));
const OperationalHealthDashboard = lazy(() => import('./OperationalHealthDashboard'));

const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
);

export const adminModule: AppModule = {
    id: 'admin',
    allowedRoles: [UserRole.MASTER_SAAS, UserRole.SYSTEM_ADMIN],
    routes: [
        { path: 'admin/saas', element: <S><SaaSControlPanelView /></S> },
        { path: 'admin/gestao', element: <S><ManagementView /></S> },
        { path: 'admin/tenants', element: <S><SaaSControlPanelView /></S> },
        { path: 'admin/metrics', element: <S><SaaSControlPanelView /></S> },
        {
            path: 'admin/logistica',
            element: <ProtectedRoute resource="LOGISTICS_MASTER" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <S><LogisticsManagementView /></S> }]
        },
        { path: 'admin/audit', element: <S><AuditLogView /></S> },
        { path: 'admin/governanca', element: <S><GovernanceView /></S> },
        { path: 'admin/governance', element: <S><GovernanceView /></S> },
        { path: 'admin/capabilities', element: <S><CapabilitiesView /></S> },
        { path: 'admin/import', element: <S><BulkImportView /></S> },
        { path: 'admin/soberania', element: <S><DataSovereigntyView /></S> },
        { path: 'admin/health', element: <S><OperationalHealthDashboard /></S> },
        { path: 'diag-ai', element: <S><AIDiagnosticView /></S> },
    ],
    sidebarItems: [
        { icon: Truck, label: 'Logística Master', path: '/admin/logistica', resource: 'LOGISTICS_MASTER' },
        { icon: Shield, label: 'Central SaaS', path: '/admin/saas' },
        { icon: Users, label: 'Rede (Escolas/Usuários)', path: '/admin/gestao' },
        { icon: FileText, label: 'Banco de Itens', path: '/items' },
        { icon: BookOpen, label: 'Minhas Provas', path: '/exams' },
        { icon: History, label: 'Auditoria', path: '/admin/audit', resource: 'SYSTEM_MGMT' },
        { icon: Target, label: 'Governança', path: '/admin/capabilities' },
        { icon: Gamepad2, label: 'Governança Arcade', path: '/admin/governanca' },
        { icon: FileUp, label: 'Importação de Dados', path: '/admin/import' },
        { icon: Database, label: 'Soberania de Dados', path: '/admin/soberania' },
        { icon: Activity, label: 'Saúde Operacional', path: '/admin/health' },
        { icon: Terminal, label: 'Diagnóstico Sistema', path: '/diag-ai' },
    ]
};
