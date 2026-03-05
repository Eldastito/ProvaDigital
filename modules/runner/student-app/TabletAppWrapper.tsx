
import React, { useState } from 'react';
import { TabletLauncher } from './TabletLauncher';
import { StudentApp } from './StudentApp';
import { ProfessorApp } from './ProfessorApp';
import { CoordinatorApp } from './CoordinatorApp';
import { MeshRole } from '../../../types';

export const TabletAppWrapper = () => {
    const [appMode, setAppMode] = useState<'LAUNCHER' | MeshRole>('LAUNCHER');
    const [provisionData, setProvisionData] = useState<any>(null);

    const handleSelectApp = (role: MeshRole, data: any) => {
        console.log(`🚀 Lançando App modo: ${role}`, data);
        setProvisionData(data);
        setAppMode(role);
    };

    const handleBack = () => {
        setAppMode('LAUNCHER');
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 overflow-hidden">
            {appMode === 'LAUNCHER' && (
                <TabletLauncher
                    onSelectApp={handleSelectApp}
                    onBack={() => window.history.back()}
                />
            )}

            {appMode === 'STUDENT' && (
                <StudentApp onBack={handleBack} />
            )}

            {appMode === 'PROFESSOR' && (
                <ProfessorApp onBack={handleBack} />
            )}

            {appMode === 'COORDINATOR' && (
                <CoordinatorApp
                    initialPayload={provisionData}
                    onBack={handleBack}
                    onSyncUp={() => { }}
                />
            )}

            {/* Fallback for other roles if needed */}
            {appMode !== 'LAUNCHER' && appMode !== 'STUDENT' && appMode !== 'PROFESSOR' && appMode !== 'COORDINATOR' && (
                <div className="flex flex-col items-center justify-center h-full text-white">
                    <h2 className="text-xl font-bold">Modo {appMode} não implementado nesta versão.</h2>
                    <button onClick={handleBack} className="mt-4 px-6 py-2 bg-brand-primary rounded-lg">Voltar</button>
                </div>
            )}
        </div>
    );
};
