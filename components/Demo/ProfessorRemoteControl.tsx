
import React, { useState, useEffect } from 'react';
import { Play, Trophy } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface ProfessorRemoteControlProps {
    classId: string;
    onExit: () => void;
}

export const ProfessorRemoteControl = ({ classId, onExit }: ProfessorRemoteControlProps) => {
    const [status, setStatus] = useState('LOADING');
    const [studentsCount, setStudentsCount] = useState(0);

    useEffect(() => {
        // Fetch Initial Status
        supabase.from('classes').select('status').eq('id', classId).single()
            .then(({ data }) => setStatus(data?.status || 'UNKNOWN'));

        // Count Students
        supabase.from('students').select('id', { count: 'exact' }).eq('class_id', classId)
            .then(({ count }) => setStudentsCount(count || 0));

        // Realtime Updates
        const channel = supabase.channel('prof_remote')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classes', filter: `id=eq.${classId}` }, (payload) => {
                setStatus(payload.new.status);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `class_id=eq.${classId}` }, () => {
                setStudentsCount(prev => prev + 1);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [classId]);

    const changeStatus = async (newStatus: string) => {
        if (!confirm(`Confirmar ação: ${newStatus}?`)) return;
        await supabase.from('classes').update({ status: newStatus }).eq('id', classId);
    };

    return (
        <div className="fixed inset-0 bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold mb-2">Controle do Professor</h1>
            <p className="text-slate-400 mb-8">Gerencie a sessão pelo celular</p>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full max-w-sm mb-8">
                <div className="text-4xl font-black text-white mb-1">{studentsCount}</div>
                <div className="text-xs uppercase font-bold text-slate-400">Alunos Conectados</div>
            </div>

            <div className="space-y-4 w-full max-w-sm">
                {status === 'WAITING_PROFESSOR' && (
                    <button
                        onClick={() => changeStatus('OPEN')}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                        <Play size={24} fill="currentColor" /> Iniciar Prova
                    </button>
                )}

                {status === 'OPEN' && (
                    <button
                        onClick={() => changeStatus('FINISHED')}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                        <Trophy size={24} /> Encerrar e Ver Podium
                    </button>
                )}

                {status === 'FINISHED' && (
                    <div className="p-4 bg-slate-800 rounded-xl text-yellow-400 font-bold border border-yellow-500/20">
                        Sessão Finalizada
                    </div>
                )}
            </div>

            <button onClick={onExit} className="mt-8 text-slate-500 underline text-sm">Sair do Controle</button>
        </div>
    );
};
