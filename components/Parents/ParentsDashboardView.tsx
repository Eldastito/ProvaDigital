import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { User, TrendingUp, Calendar, MessageCircle, BookOpen, Award, ChevronDown } from 'lucide-react';

export const ParentsDashboardView = () => {
    const { currentUser, students, results, exams, selectedChildId, setSelectedChildId } = useAppStore();

    // Get children of current parent
    const myChildren = currentUser?.childrenIds
        ? students.filter(s => currentUser.childrenIds?.includes(s.id))
        : [];

    // Get selected child or first child
    const selectedChild = myChildren.find(c => c.id === selectedChildId) || myChildren[0];

    // Get child's results
    const childResults = selectedChild
        ? results.filter(r => r.studentId === selectedChild.id)
        : [];

    // Get child's exams
    const childExams = selectedChild
        ? exams.filter(e => e.classIds?.includes(selectedChild.classId || ''))
        : [];

    // Calculate average score
    const averageScore = childResults.length > 0
        ? (childResults.reduce((sum, r) => sum + (r.totalScore || 0), 0) / childResults.length).toFixed(1)
        : '0.0';

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark">Portal dos Pais e Responsáveis</h1>
                        <p className="text-slate-600 mt-1">Acompanhe o desempenho e desenvolvimento dos seus filhos</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">{currentUser?.name}</p>
                            <p className="text-xs text-slate-500">{currentUser?.email}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {currentUser?.name?.charAt(0) || 'P'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Child Selector */}
            {myChildren.length > 0 ? (
                <>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Selecione o filho(a):</label>
                        <div className="relative">
                            <select
                                value={selectedChild?.id || ''}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-medium text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent appearance-none cursor-pointer"
                            >
                                {myChildren.map(child => (
                                    <option key={child.id} value={child.id}>
                                        {child.name} - {child.registrationNumber}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    {selectedChild && (
                        <>
                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="text-emerald-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-brand-dark">{averageScore}</p>
                                            <p className="text-sm text-slate-600">Média Geral</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <BookOpen className="text-blue-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-brand-dark">{childResults.length}</p>
                                            <p className="text-sm text-slate-600">Provas Realizadas</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Award className="text-purple-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-brand-dark">95%</p>
                                            <p className="text-sm text-slate-600">Frequência</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="text-orange-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-brand-dark">{childExams.length}</p>
                                            <p className="text-sm text-slate-600">Próximas Provas</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Desempenho Recente */}
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-black text-brand-dark flex items-center gap-2">
                                            <TrendingUp size={24} className="text-emerald-500" />
                                            Desempenho Recente
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        {childResults.length > 0 ? (
                                            childResults.slice(0, 5).map(result => {
                                                const exam = exams.find(e => e.id === result.examId);
                                                const scorePercentage = ((result.totalScore || 0) / 10) * 100;
                                                const scoreColor = scorePercentage >= 70 ? 'text-emerald-600' : scorePercentage >= 50 ? 'text-orange-600' : 'text-rose-600';

                                                return (
                                                    <div key={result.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-bold text-brand-dark">{exam?.title || 'Prova'}</p>
                                                                <p className="text-sm text-slate-600">{exam?.subject}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-2xl font-black ${scoreColor}`}>
                                                                    {result.totalScore?.toFixed(1) || '0.0'}
                                                                </p>
                                                                <p className="text-xs text-slate-500">de 10.0</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <BookOpen size={48} className="mx-auto mb-2 opacity-30" />
                                                <p>Nenhum resultado disponível</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Próximas Provas */}
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-black text-brand-dark flex items-center gap-2">
                                            <Calendar size={24} className="text-orange-500" />
                                            Próximas Provas
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        {childExams.length > 0 ? (
                                            childExams.slice(0, 5).map(exam => (
                                                <div key={exam.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-brand-dark">{exam.title}</p>
                                                            <p className="text-sm text-slate-600">{exam.subject}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                                            {exam.status === 'ACTIVE' ? 'Em Breve' : 'Agendada'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <Calendar size={48} className="mx-auto mb-2 opacity-30" />
                                                <p>Nenhuma prova agendada</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Comunicação */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                                <h2 className="text-xl font-black text-brand-dark flex items-center gap-2 mb-4">
                                    <MessageCircle size={24} className="text-blue-500" />
                                    Comunicação com a Escola
                                </h2>
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-8 text-center">
                                    <MessageCircle size={64} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-600 font-medium">Sistema de mensagens em desenvolvimento</p>
                                    <p className="text-sm text-slate-500 mt-2">Em breve você poderá se comunicar diretamente com professores e coordenadores</p>
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl p-12 shadow-lg border border-slate-200 text-center">
                    <User size={64} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-2xl font-black text-brand-dark mb-2">Nenhum filho cadastrado</h2>
                    <p className="text-slate-600">Entre em contato com a escola para vincular seus filhos à sua conta.</p>
                </div>
            )}
        </div>
    );
};
