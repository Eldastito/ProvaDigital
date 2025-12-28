
import React, { useState, useMemo } from 'react';
import { BarChart, Users, AlertTriangle, Award, Brain, Lock } from 'lucide-react';
import { AppState, RiskLevel, Student, ExamResult, Exam, ExamRegistration, UserProfileExtended, StudentStats, StudentProfile } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { GlobalRankingView } from './GlobalRankingView';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents, fetchResults, fetchExams, fetchRegistrations, fetchUserProfiles, fetchStudentProfiles } from '../../services/supabaseClient';

export const SchoolDashboardView = ({ state }: { state: AppState }) => {
    const { currentUser } = state;
    const schoolId = currentUser?.schoolId;

    // Fetch all necessary data via React Query
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allStudentProfiles } = useQuery<StudentProfile[]>({ queryKey: ['studentProfiles'], queryFn: fetchStudentProfiles, initialData: [] });

    // Initialize AnalyticsService with fetched data
    const analytics = useMemo(() => new AnalyticsService(), []);

    // Filter data for the current school
    const schoolStudents = allStudents?.filter(s => s.schoolId === schoolId) || [];

    // Calculate overall stats
    const allStats = schoolStudents.map(s => analytics.getStudentStats(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || [])).filter(Boolean) as StudentStats[];
    const atRiskCount: number = allStats.filter(s => s.riskLevel !== RiskLevel.LOW).length;
    const totalAvg = allStats.reduce((acc, curr) => acc + curr.idgScore, 0) / (allStats.length || 1);

    // Ranking Logic
    const topStudents = [...allStats].sort((a, b) => b.idgScore - a.idgScore).slice(0, 5);

    // --- DYNAMIC LEARNING PROFILE STATS ---
    const schoolStudentProfiles = useMemo(() => {
        const schoolStudentIds = new Set(schoolStudents.map(s => s.id));
        return (allStudentProfiles || []).filter(p => schoolStudentIds.has(p.studentId));
    }, [schoolStudents, allStudentProfiles]);

    const channelCounts = useMemo(() => {
        const initialValue: Record<string, number> = {};
        return schoolStudentProfiles.reduce((acc, profile) => {
            if (profile.learningChannel) {
                acc[profile.learningChannel] = (acc[profile.learningChannel] || 0) + 1;
            }
            return acc;
        }, initialValue);
    }, [schoolStudentProfiles]);

    const dominantProfile = useMemo(() => {
        const totalWithChannel = schoolStudentProfiles.filter(p => p.learningChannel).length;
        const channelNames = Object.keys(channelCounts);

        if (totalWithChannel === 0 || channelNames.length === 0) {
            return { name: 'N/A', percentage: 0 };
        }

        const dominantName = channelNames.reduce((a, b) => channelCounts[a] > channelCounts[b] ? a : b);
        
        const dominantCount = channelCounts[dominantName];
        const percentage = (dominantCount / totalWithChannel) * 100;

        return { name: dominantName, percentage };
    }, [channelCounts, schoolStudentProfiles]);

    const { rankingEnabled, rankingAnonymity } = state.settings;

    const totalStudentsInSchool = allStats.length;
    // FIX: Renamed variable and calculation logic for clarity as per user feedback
    const atRiskPercentage: number = totalStudentsInSchool > 0 ? (atRiskCount / totalStudentsInSchool) * 100 : 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-dark">Analytics da Escola</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-light rounded-lg text-brand-primary"><BarChart size={20}/></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Média IDG</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{totalAvg.toFixed(1)}</div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle size={20}/></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Alunos em Risco</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{atRiskCount}</div>
                    {/* FIX: Corrected label to accurately reflect the calculated percentage */}
                    <div className="text-xs text-rose-600 mt-1 font-bold">{`${atRiskPercentage.toFixed(0)}% da escola em risco`}</div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Brain size={20}/></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Perfil Dominante</span>
                    </div>
                    {/* FIX: Made dominant profile dynamic */}
                    <div className="text-3xl font-black text-slate-800 capitalize">
                        {dominantProfile.name !== 'N/A' ? dominantProfile.name.toLowerCase() : 'Nenhum'}
                    </div>
                    <div className="text-xs text-purple-600 mt-1 font-bold">
                        {dominantProfile.name !== 'N/A' ? `${dominantProfile.percentage.toFixed(0)}% dos alunos` : 'Sem dados de perfil'}
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ranking */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-yellow-500"/> Top 5 Alunos (Ranking)</h3>
                        {rankingEnabled && rankingAnonymity === 'ANONIMO' && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded flex items-center gap-1">
                                <Lock size={10}/> Modo Anônimo
                            </span>
                        )}
                    </div>
                    
                    {rankingEnabled ? (
                        <div className="space-y-4">
                            {topStudents.map((stat, idx) => {
                                const student = allStudents?.find(s => s.id === stat.studentId);
                                const displayName = rankingAnonymity === 'NOMINAL' 
                                    ? student?.name 
                                    : `Aluno ${student?.registrationNumber?.slice(-4) || '****'}`;

                                return (
                                    <div key={stat.studentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="font-bold text-slate-700">
                                                {displayName as React.ReactNode}
                                            </div>
                                        </div>
                                        <div className="font-black text-brand-primary">{stat.idgScore.toFixed(1)}</div>
                                    </div>
                                );
                            })}
                            {topStudents.length === 0 && <p className="text-slate-400">Sem dados suficientes.</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center opacity-50">
                            <Award size={32} className="mb-2"/>
                            <p>Ranking desativado nas configurações da escola.</p>
                        </div>
                    )}
                </div>

                {/* Learning Profiles Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Brain size={20} className="text-purple-500"/> Canais de Aprendizagem (Psicopedagogia)</h3>
                    <div className="space-y-4">
                        {Object.entries(channelCounts).map(([channel, count]) => {
                            // FIX: Corrected percentage calculation to be based on school-specific profiles
                            const percentage = (Number(count) / (schoolStudentProfiles.filter(p => p.learningChannel).length || 1)) * 100;
                            return (
                                <div key={channel}>
                                    <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                                        <span className="capitalize">{channel.toLowerCase().replace('_', ' ')}</span>
                                        <span>{count} alunos ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${channel === 'VISUAL' ? 'bg-purple-500' : channel === 'AUDITIVO' ? 'bg-blue-500' : channel === 'CINESTESICO' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                        {schoolStudentProfiles.length === 0 && <p className="text-slate-400 text-sm">Nenhum perfil cadastrado.</p>}
                    </div>
                </div>

                {/* Risk List */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><AlertTriangle size={20} className="text-rose-500"/> Atenção Necessária</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                        {allStats.filter(s => s.riskLevel !== RiskLevel.LOW).map(stat => {
                            const student = allStudents?.find(s => s.id === stat.studentId);
                            // FIX: use school-specific profiles here too
                            const profile = schoolStudentProfiles.find(p => p.studentId === stat.studentId);
                            return (
                                <div key={stat.studentId} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">{student?.name}</div>
                                        <div className="text-xs text-slate-500">Perfil: {profile?.learningChannel || 'N/A'}</div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded font-bold ${stat.riskLevel === RiskLevel.HIGH ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {stat.riskLevel === RiskLevel.HIGH ? 'CRÍTICO' : 'ALERTA'}
                                    </div>
                                </div>
                            );
                        })}
                         {atRiskCount === 0 && <p className="text-slate-400 text-sm">Nenhum aluno em risco.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
