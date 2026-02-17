import React from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import { LayoutDashboard, MessageCircle } from 'lucide-react';
import { ParentsDashboardView } from './ParentsDashboardView';
import { CommunicationView } from '../communication/CommunicationView';

export const parentsModule: AppModule = {
    id: 'parents-portal',
    allowedRoles: [UserRole.PAIS],
    routes: [
        { path: 'dashboard', element: <ParentsDashboardView /> },
        { path: 'communication', element: <CommunicationView /> },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Desempenho', path: '/dashboard' },
        { icon: MessageCircle, label: 'Comunicação', path: '/communication' },
    ]
};
