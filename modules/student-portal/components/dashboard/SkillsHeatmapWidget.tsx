import React from 'react';
import { Target, Info } from 'lucide-react';
import { Item, ExamResult } from '../../../../types';

interface SkillData {
    id: string;
    name: string;
    score: number; // 0-100
    totalItems: number;
    masteryLevel: 'high' | 'medium' | 'low';
}

interface SkillsHeatmapWidgetProps {
    results: ExamResult[];
    items: Item[];
}

export const SkillsHeatmapWidget: React.FC<SkillsHeatmapWidgetProps> = ({ results, items }) => {

    // Logic to aggregate skills would ideally be in a hook/service.
    // Simplifying here for the widget presentation.
    const aggregatedSkills = React.useMemo(() => {
        const skillsMap = new Map<string, { total: number, correct: number, count: number }>();

        results.forEach(result => {
            // Check aggregated answers or detailed answers if available
            // Assuming result.answers contains { itemId, isCorrect }
            result.answers.forEach((ans: any) => {
                const item = items.find(i => i.id === ans.itemId);
                if (item && item.tags) {
                    // Use Knowledge Area or Subject or specific Tag
                    const skill = item.knowledgeArea || item.subject;
                    const entry = skillsMap.get(skill) || { total: 0, correct: 0, count: 0 };

                    entry.total += 1;
                    if (ans.isCorrect) entry.correct += 1;
                    entry.count += 1;

                    skillsMap.set(skill, entry);
                }
            });
        });

        const data: SkillData[] = [];
        skillsMap.forEach((val, key) => {
            const score = (val.correct / val.total) * 100;
            data.push({
                id: key,
                name: key,
                score: score,
                totalItems: val.total,
                masteryLevel: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
            });
        });

        // Add Mock Data if empty (for demo visualization)
        if (data.length === 0) {
            return [
                { id: 'mat', name: 'Matemática', score: 95, totalItems: 12, masteryLevel: 'high' as const },
                { id: 'fis', name: 'Física', score: 65, totalItems: 8, masteryLevel: 'medium' as const },
                { id: 'his', name: 'História', score: 40, totalItems: 15, masteryLevel: 'low' as const },
                { id: 'geo', name: 'Geografia', score: 75, totalItems: 10, masteryLevel: 'medium' as const },
                { id: 'port', name: 'Português', score: 88, totalItems: 20, masteryLevel: 'high' as const },
                { id: 'quim', name: 'Química', score: 55, totalItems: 6, masteryLevel: 'low' as const },
            ];
        }

        return data.sort((a, b) => b.score - a.score);
    }, [results, items]);

    const getColor = (level: string) => {
        switch (level) {
            case 'high': return 'bg-emerald-500 text-white';
            case 'medium': return 'bg-yellow-400 text-slate-900';
            case 'low': return 'bg-rose-500 text-white';
            default: return 'bg-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"><Target size={18} className="text-brand-primary" /> Heatmap de Habilidades</span>
                <span className="text-xs font-normal text-slate-400 flex items-center gap-1">
                    <Info size={12} /> Baseado nas últimas provas
                </span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {aggregatedSkills.map((skill) => (
                    <div
                        key={skill.id}
                        className={`group relative p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all hover:scale-105 cursor-pointer ${getColor(skill.masteryLevel)}`}
                    >
                        <h4 className="font-bold text-sm truncate w-full">{skill.name}</h4>
                        <span className="text-2xl font-black mt-1">{skill.score.toFixed(0)}%</span>

                        {/* Hover Detail */}
                        <div className="absolute inset-0 bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs p-2">
                            <span>{skill.totalItems} questões</span>
                            <span className="font-semibold mt-1">
                                {skill.masteryLevel === 'high' ? 'Dominado' : skill.masteryLevel === 'medium' ? 'Em Progresso' : 'Atenção'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs text-slate-500 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Domínio Alto (&gt;80%)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div> Médio
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div> Baixo (&lt;60%)
                </div>
            </div>
        </div>
    );
};
