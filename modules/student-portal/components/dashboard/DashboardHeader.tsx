import React from 'react';
import { User as UserIcon, Trophy, List } from 'lucide-react';
import { User } from '../../../../types';

interface DashboardHeaderProps {
    user: User;
    studentName: string;
    isParent: boolean;
    rankingEnabled: boolean;
    onShowRanking: () => void;
    onShowAgenda: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    user,
    studentName,
    isParent,
    rankingEnabled,
    onShowRanking,
    onShowAgenda
}) => {
    return (
        <>
            {isParent && (
                <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg flex items-center gap-3 text-sky-800 mb-4 animate-in slide-in-from-top-2">
                    <UserIcon size={24} className="p-1 bg-sky-200 rounded-full" />
                    <div>
                        <span className="font-bold text-xs uppercase">Modo Responsável</span>
                        <p className="text-sm">Visualizando o desempenho acadêmico de <strong>{studentName}</strong>.</p>
                    </div>
                </div>
            )}

            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark">Olá, {user.name.split(' ')[0]}! 🦉</h1>
                    <p className="text-slate-500">Acompanhamento em Tempo Real.</p>
                </div>
                <div className="flex gap-3">
                    {rankingEnabled && (
                        <button onClick={onShowRanking} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-200 transition shadow-sm border border-amber-200">
                            <Trophy size={18} /> Ver Ranking
                        </button>
                    )}
                    <button onClick={onShowAgenda} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                        <List size={18} /> Ver Agenda Completa
                    </button>
                </div>
            </div>
        </>
    );
};
