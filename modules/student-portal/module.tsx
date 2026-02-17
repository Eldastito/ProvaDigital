import React from 'react';
import { UserRole } from '../../types';
import { AppModule } from '../core/types';
import {
    LayoutDashboard, Target, Gamepad2 as Arcade, Swords, Zap,
    Trophy, Bot, Compass, MessageCircle
} from 'lucide-react';
import { StudentDashboardView } from './StudentDashboardView';
import { OwlTutorView } from './OwlTutorView';
import { ArcadeView } from './ArcadeView';
import { VocationalCompassView } from './VocationalCompassView';
import { AvatarShopView } from './AvatarShopView';
import { StudentBattleView } from './StudentBattleView';
import { SurvivalView } from './SurvivalView';

export const studentModule: AppModule = {
    id: 'student-portal',
    allowedRoles: [UserRole.ALUNO],
    routes: [
        { path: 'aluno', element: <StudentDashboardView /> },
        { path: 'aluno/tutor', element: <OwlTutorView /> },
        { path: 'aluno/arcade', element: <ArcadeView /> },
        { path: 'aluno/bussola', element: <VocationalCompassView /> },
        { path: 'aluno/loja', element: <AvatarShopView /> },
        { path: 'battle-arena', element: <StudentBattleView /> },
        { path: 'survival-mode', element: <SurvivalView /> },
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
