import React, { lazy, Suspense } from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    LayoutDashboard, Target, Gamepad2 as Arcade, Swords, Zap,
    Trophy, Bot, Compass, MessageCircle
} from 'lucide-react';

const StudentDashboardView = lazy(() => import('./StudentDashboardView').then(m => ({ default: m.StudentDashboardView })));
const OwlTutorView = lazy(() => import('./OwlTutorView').then(m => ({ default: m.OwlTutorView })));
const ArcadeView = lazy(() => import('./ArcadeView').then(m => ({ default: m.ArcadeView })));
const VocationalCompassView = lazy(() => import('./VocationalCompassView').then(m => ({ default: m.VocationalCompassView })));
const AvatarShopView = lazy(() => import('./AvatarShopView').then(m => ({ default: m.AvatarShopView })));
const StudentBattleView = lazy(() => import('./StudentBattleView').then(m => ({ default: m.StudentBattleView })));
const SurvivalView = lazy(() => import('./SurvivalView').then(m => ({ default: m.SurvivalView })));

const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
);

export const studentModule: AppModule = {
    id: 'student-portal',
    allowedRoles: [UserRole.ALUNO],
    routes: [
        { path: 'aluno', element: <S><StudentDashboardView /></S> },
        { path: 'aluno/tutor', element: <S><OwlTutorView /></S> },
        { path: 'aluno/arcade', element: <S><ArcadeView /></S> },
        { path: 'aluno/bussola', element: <S><VocationalCompassView /></S> },
        { path: 'aluno/loja', element: <S><AvatarShopView /></S> },
        { path: 'battle-arena', element: <S><StudentBattleView /></S> },
        { path: 'survival-mode', element: <S><SurvivalView /></S> },
    ],
    sidebarItems: [
        { icon: LayoutDashboard, label: 'Meu Desempenho', path: '/aluno' },
        { icon: Target, label: 'Plano de Estudos', path: '/study-plans' },
        { icon: Arcade, label: 'Games Arcade', path: '/aluno/arcade' },
        { icon: Swords, label: 'Arena de Batalha', path: '/battle-arena' },
        { icon: Zap, label: 'Modo Survival', path: '/survival-mode' },
        { icon: Trophy, label: 'Avatar Shop', path: '/aluno/loja' },
        { icon: Bot, label: 'Corujão Tutor', path: '/aluno/tutor' },
        { icon: Compass, label: 'Bússola', path: '/aluno/bussola' },
        { icon: MessageCircle, label: 'Chat', path: '/communication' },
    ]
};
