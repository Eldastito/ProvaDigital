import React from 'react';

export const SimpleDashboard = () => {
    return (
        <div className="p-8 bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-slate-800">Diagnostic Dashboard</h1>
            <p className="text-slate-600 mt-2">Se você está vendo esta mensagem, o erro #130 não está na estrutura externa do App ou do DashboardLayout.</p>
            <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg">
                <strong>Sucesso:</strong> Layout base carregado corretamente.
            </div>
        </div>
    );
};
