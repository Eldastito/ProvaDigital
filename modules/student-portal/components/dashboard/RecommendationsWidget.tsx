import React, { useMemo } from 'react';
import { Sparkles, BookOpen, PlayCircle, ArrowRight } from 'lucide-react';
import { Item, ExamResult } from '../../../../types';

interface RecommendationsWidgetProps {
    results: ExamResult[];
    items: Item[];
}

export const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({ results, items }) => {

    // Mock Logic for Recommendations Generation
    // In production this would be more sophisticated
    const recommendations = useMemo(() => {
        // ... Logic to find weak skills from results ...
        // Using mock data for demo
        return [
            {
                id: 'rec_1',
                title: 'Reforço em História do Brasil',
                type: 'LESSON',
                subject: 'História',
                reason: 'Desempenho de 40% na última prova',
                action: 'Revisar Capítulo 4',
                estimatedTime: '20 min'
            },
            {
                id: 'rec_2',
                title: 'Laboratório de Estequiometria',
                type: 'SIMULATION',
                subject: 'Química',
                reason: 'Erros recorrentes em cálculo químico',
                action: 'Iniciar Simulação',
                estimatedTime: '15 min'
            },
            {
                id: 'rec_3',
                title: 'Funções de 1º Grau',
                type: 'VIDEO',
                subject: 'Matemática',
                reason: 'Tópico fundamental',
                action: 'Assistir Aula',
                estimatedTime: '10 min'
            }
        ];
    }, [results]);

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg border border-indigo-500/30 p-6 text-white overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>

            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                <Sparkles size={20} className="text-yellow-300" />
                Recomendações da I.A.
            </h3>

            <div className="space-y-3 relative z-10">
                {recommendations.map(rec => (
                    <div key={rec.id} className="bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-3 border border-white/10 flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                {rec.type === 'LESSON' ? <BookOpen size={18} /> : <PlayCircle size={18} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{rec.title}</h4>
                                <p className="text-xs text-indigo-100 opacity-80">{rec.reason} • {rec.estimatedTime}</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors text-sm shadow-md">
                Ver Plano de Estudos Personalizado
            </button>
        </div>
    );
};
