import React, { lazy, Suspense } from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import { LayoutDashboard, MessageCircle } from 'lucide-react';

const CommunicationView = lazy(() => import('../communication/CommunicationView').then(m => ({ default: m.CommunicationView })));

const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
);

export const parentsModule: AppModule = {
    id: 'parents-portal',
    allowedRoles: [UserRole.PAIS],
    routes: [
        { path: 'communication', element: <S><CommunicationView /></S> },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Desempenho', path: '/dashboard' },
        { icon: MessageCircle, label: 'Comunicação', path: '/communication' },
    ]
};
