import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileText, Users, BookOpen, TrendingUp, Plus, Calendar, Award, BarChart3 } from 'lucide-react';

export const ProfessorDashboardView = () => {
    const { currentUser, classes, exams, students, results } = useAppStore();

    // Filtrar turmas onde o professor está associado
    const myClasses = classes.filter(c => {
        // Assumindo que temos um campo teacherId ou similar
        // Por enquanto, vamos mostrar todas as turmas como exemplo
        return true;
    });

    // Filtrar provas criadas pelo professor
    const myExams = exams.filter(e => {
        // Filtrar por tenantId e schoolId do professor
        return e.tenantId === currentUser?.tenantId;
    }).slice(0, 5); // Mostrar últimas 5

    // Calcular estatísticas
    const totalStudents = myClasses.reduce((sum, cls) => {
        return sum + students.filter(s => s.classId === cls.id).length;
    }, 0);

    const activeExams = myExams.filter(e => e.status === 'ACTIVE').length;
    const completedExams = myExams.filter(e => e.status === 'COMPLETED').length;

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark">Painel do Professor</h1>
                        <p className="text-slate-600 mt-1">Gestão de turmas, provas e acompanhamento individualizado</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">{currentUser?.name}</p>
                            <p className="text-xs text-slate-500">{currentUser?.email}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {currentUser?.name?.charAt(0) || 'P'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-brand-dark">{myClasses.length}</p>
                            <p className="text-sm text-slate-600">Turmas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Users className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-brand-dark">{totalStudents}</p>
                            <p className="text-sm text-slate-600">Alunos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-brand-dark">{activeExams}</p>
                            <p className="text-sm text-slate-600">Provas Ativas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Award className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-brand-dark">{completedExams}</p>
                            <p className="text-sm text-slate-600">Provas Concluídas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                <button className="bg-gradient-to-br from-brand-primary to-emerald-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={28} />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black">Nova Prova</p>
                            <p className="text-sm opacity-90">Criar avaliação</p>
                        </div>
                    </div>
                </button>

                <button className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookOpen size={28} />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black">Banco de Questões</p>
                            <p className="text-sm opacity-90">Criar e gerenciar</p>
                        </div>
                    </div>
                </button>

                <button className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BarChart3 size={28} />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black">Analytics</p>
                            <p className="text-sm opacity-90">Desempenho geral</p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Minhas Turmas */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-brand-dark flex items-center gap-2">
                            <Users size={24} className="text-brand-primary" />
                            Minhas Turmas
                        </h2>
                        <span className="px-3 py-1 bg-brand-light text-brand-primary rounded-full text-xs font-bold">
                            {myClasses.length} turmas
                        </span>
                    </div>
                    <div className="space-y-3">
                        {myClasses.length > 0 ? (
                            myClasses.slice(0, 5).map(cls => {
                                const classStudents = students.filter(s => s.classId === cls.id);
                                return (
                                    <div key={cls.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-brand-primary hover:bg-brand-light/30 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{cls.name}</p>
                                                <p className="text-sm text-slate-600">{cls.series} - {cls.shift}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-brand-primary">{classStudents.length}</p>
                                                <p className="text-xs text-slate-500">alunos</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Users size={48} className="mx-auto mb-2 opacity-30" />
                                <p>Nenhuma turma atribuída</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Provas Recentes */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-brand-dark flex items-center gap-2">
                            <FileText size={24} className="text-orange-500" />
                            Provas Recentes
                        </h2>
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                            {myExams.length} provas
                        </span>
                    </div>
                    <div className="space-y-3">
                        {myExams.length > 0 ? (
                            myExams.map(exam => {
                                const statusColors = {
                                    DRAFT: 'bg-slate-100 text-slate-700',
                                    ACTIVE: 'bg-emerald-100 text-emerald-700',
                                    COMPLETED: 'bg-blue-100 text-blue-700'
                                };
                                return (
                                    <div key={exam.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-orange-500 hover:bg-orange-50/30 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-bold text-brand-dark group-hover:text-orange-600 transition-colors">{exam.title}</p>
                                                <p className="text-sm text-slate-600">{exam.subject}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[exam.status]}`}>
                                                {exam.status === 'DRAFT' ? 'Rascunho' : exam.status === 'ACTIVE' ? 'Ativa' : 'Concluída'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <FileText size={48} className="mx-auto mb-2 opacity-30" />
                                <p>Nenhuma prova criada</p>
                                <button className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                                    Criar Primeira Prova
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desempenho Geral */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h2 className="text-xl font-black text-brand-dark flex items-center gap-2 mb-4">
                    <TrendingUp size={24} className="text-emerald-500" />
                    Desempenho Geral das Turmas
                </h2>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-8 text-center">
                    <BarChart3 size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">Analytics detalhado em desenvolvimento</p>
                    <p className="text-sm text-slate-500 mt-2">Em breve você terá acesso a gráficos e métricas de desempenho</p>
                </div>
            </div>
        </div>
    );
};
