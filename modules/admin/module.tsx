import React from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    Shield, Truck, History, Settings, FileUp, Terminal, Target, Gamepad2, Package, Users
} from 'lucide-react';
import { SaaSControlPanelView } from './SaaSControlPanelView';
import LogisticsManagementView from './LogisticsManagementView';
import { AuditLogView } from './components/AuditLogView';
import { GovernanceView } from './components/GovernanceView';
import { CapabilitiesView } from './components/CapabilitiesView';
import { BulkImportView } from './components/BulkImportView';
import { AIDiagnosticView } from '../diagnostics/AIDiagnosticView';
import { ManagementView } from '../school-management/ManagementView';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const adminModule: AppModule = {
    id: 'admin',
    allowedRoles: [UserRole.MASTER_SAAS, UserRole.SYSTEM_ADMIN],
    routes: [
        { path: 'admin/saas', element: <SaaSControlPanelView /> },
        { path: 'admin/gestao', element: <ManagementView /> },
        { path: 'admin/tenants', element: <SaaSControlPanelView /> },
        { path: 'admin/metrics', element: <SaaSControlPanelView /> },
        {
            path: 'admin/logistica',
            element: <ProtectedRoute resource="LOGISTICS_MASTER" fallbackPath="/dashboard" />,
            children: [{ index: true, element: <LogisticsManagementView /> }]
        },
        { path: 'admin/audit', element: <AuditLogView /> },
        { path: 'admin/governanca', element: <GovernanceView /> },
        { path: 'admin/governance', element: <GovernanceView /> },
        { path: 'admin/capabilities', element: <CapabilitiesView /> },
        { path: 'admin/import', element: <BulkImportView /> },
        { path: 'diag-ai', element: <AIDiagnosticView /> },
    ],
    sidebarItems: [
        {
            icon: Truck,
            label: 'Logística Master',
            path: '/admin/logistica',
            resource: 'LOGISTICS_MASTER'
        },
        {
            icon: Shield,
            label: 'Central SaaS',
            path: '/admin/saas'
        },
        {
            icon: Users,
            label: 'Rede (Escolas/Usuários)',
            path: '/admin/gestao'
        },
        {
            icon: History,
            label: 'Auditoria',
            path: '/admin/audit',
            resource: 'SYSTEM_MGMT'
        },
        {
            icon: Target,
            label: 'Governança',
            path: '/admin/capabilities'
        },
        {
            icon: Gamepad2,
            label: 'Governança Arcade',
            path: '/admin/governanca'
        },
        {
            icon: FileUp,
            label: 'Importação de Dados',
            path: '/admin/import'
        },
        {
            icon: Terminal,
            label: 'Diagnóstico Sistema',
            path: '/diag-ai'
        },
    ]
};
