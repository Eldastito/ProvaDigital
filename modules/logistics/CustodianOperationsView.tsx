import React, { useState } from 'react';
import {
    Truck,
    MapPin,
    ChevronRight,
    Package,
    ArrowUpCircle,
    ArrowDownCircle,
    X
} from 'lucide-react';
import { CustodyChecklist } from './CustodyChecklist';

export const CustodianOperationsView: React.FC = () => {
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [tasks, setTasks] = useState([
        {
            id: 'T-101',
            schoolName: 'Escola Municipal Machado de Assis',
            type: 'DELIVERY',
            address: 'Rua das Flores, 123',
            casesCount: 3,
            status: 'PENDING'
        },
        {
            id: 'T-102',
            schoolName: 'Colégio Estadual Rio Branco',
            type: 'COLLECTION',
            address: 'Av. Brasil, 500',
            casesCount: 2,
            status: 'PENDING'
        }
    ]);

    const handleCompleteTask = (data: any) => {
        // Aqui enviaríamos para o Supabase via custodyTransfer
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'COMPLETED' } : t));
        setSelectedTask(null);
    };

    if (selectedTask) {
        return (
            <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                <button
                    onClick={() => setSelectedTask(null)}
                    className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition"
                >
                    <X size={24} />
                </button>
                <CustodyChecklist
                    type={selectedTask.type}
                    onComplete={handleCompleteTask}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <Truck className="text-indigo-600" size={32} />
                    Minhas Rotas
                </h1>
                <p className="text-slate-500 mt-1">Operador: João Silva (Entregador Base Alpha)</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Tarefas de Hoje</h2>

                {tasks.map(task => (
                    <button
                        key={task.id}
                        onClick={() => task.status === 'PENDING' && setSelectedTask(task)}
                        className={`w-full text-left bg-white p-6 rounded-3xl border shadow-sm transition-all active:scale-95 flex items-center justify-between ${task.status === 'COMPLETED' ? 'opacity-50 border-transparent' : 'border-slate-100 hover:border-indigo-200 shadow-slate-200/50'}`}
                    >
                        <div className="flex gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${task.type === 'DELIVERY' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                {task.type === 'DELIVERY' ? <ArrowDownCircle size={32} /> : <ArrowUpCircle size={32} />}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-slate-800 truncate">{task.schoolName}</h3>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <MapPin size={12} /> {task.address}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">{task.id}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">{task.casesCount} Malas</span>
                                </div>
                            </div>
                        </div>
                        {task.status === 'PENDING' ? (
                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <ChevronRight size={20} />
                            </div>
                        ) : (
                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase">
                                Concluído
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-12 bg-white/50 border border-slate-200 rounded-3xl p-6 text-center">
                <Package className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-sm text-slate-400 font-medium">Não há mais rotas planejadas para o seu turno.</p>
                <button className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Solicitar Nova Carga</button>
            </div>
        </div>
    );
};

export default CustodianOperationsView;
