import React from 'react';
import { DifficultyItem } from '../../../services/analyticsService';
import { AlertCircle } from 'lucide-react';

interface DifficultyTableProps {
    data: DifficultyItem[];
}

export const DifficultyTable: React.FC<DifficultyTableProps> = ({ data }) => {
    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.topic}</span>
                        <span className="text-red-600 font-bold">{item.errorRate}% Erro</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${item.errorRate > 60 ? 'bg-red-500' :
                                item.errorRate > 40 ? 'bg-orange-500' : 'bg-yellow-500'
                                }`}
                            style={{ width: `${item.errorRate}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">{item.questionCount} questões avaliadas</span>
                        {item.errorRate > 50 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle size={12} />
                                <span>Atenção Crítica</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
