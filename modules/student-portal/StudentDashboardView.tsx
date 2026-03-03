import React, { useState } from 'react';
import { useStudentDashboard } from './hooks/useStudentDashboard';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { EventInvitations } from './components/dashboard/EventInvitations';
import { ActiveEventsList } from './components/dashboard/ActiveEventsList';
import { MentorshipBoard } from './components/dashboard/MentorshipBoard';
import { StatsCards } from './components/dashboard/StatsCards';
import { LearningProfileCard } from './components/dashboard/LearningProfileCard';
import { GamificationCard } from './components/dashboard/GamificationCard';
import { DailyQuestsWidget } from './components/dashboard/DailyQuestsWidget';
import { EvolutionChart } from './components/dashboard/EvolutionChart';
import { AgendaWidget } from './components/dashboard/AgendaWidget';
import { GradesHistory } from './components/dashboard/GradesHistory';
import { AnnouncementsWidget } from './components/dashboard/AnnouncementsWidget';
import { AgendaModal } from '../../components/Calendar/AgendaModal';
import { useAgenda } from '../../hooks/useAgenda';
import { EventRulesModal } from './components/dashboard/EventRulesModal';
import { RankingModal } from './components/dashboard/RankingModal';
import { CorrectionModal } from './components/dashboard/CorrectionModal';
import { TrendingUp } from 'lucide-react';
import { SkillsHeatmapWidget } from './components/dashboard/SkillsHeatmapWidget';
import { RecommendationsWidget } from './components/dashboard/RecommendationsWidget';
import { PredictionChart } from './components/dashboard/PredictionChart';
import { AdaptiveStudyPlanWidget } from './components/dashboard/AdaptiveStudyPlanWidget';

export const StudentDashboardView = () => {
    const {
        user,
        student,
        isParent,
        stats,
        profile,
        extendedProfile,
        ranks,
        trend,
        chartData,
        recentResults,
        availableEvents,
        myActiveEvents,
        showRankingModal, setShowRankingModal,
        rankingMode, setRankingMode,
        selectedResult, setSelectedResult,
        showAgendaModal: oldShowAgendaModal, // Keep it to avoid logic breaks but we'll use shared
        setShowAgendaModal: oldSetShowAgendaModal,
        showEventRules, setShowEventRules,
        handleAcceptEvent,
        state,
        isEnabled,
        setOwlTutorContext
    } = useStudentDashboard();

    const {
        currentMonth,
        changeMonth,
        daysInMonth,
        firstDayOfMonth,
        getEventsForDay,
        getAllMonthEvents,
        showAgendaModal: showSharedModal,
        setShowAgendaModal: setShowSharedModal
    } = useAgenda(student?.id);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in zoom-in-95 duration-500">
            <DashboardHeader
                user={user}
                studentName={student.name}
                isParent={isParent}
                rankingEnabled={state.settings.rankingEnabled}
                onShowRanking={() => setShowRankingModal(true)}
                onShowAgenda={() => setShowSharedModal(true)}
            />

            <EventInvitations
                events={availableEvents}
                onAccept={(id) => setShowEventRules(id)}
            />

            <ActiveEventsList events={myActiveEvents} />

            <MentorshipBoard student={student} isParent={isParent} />

            <StatsCards stats={stats as any} trend={trend} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LearningProfileCard
                    profile={profile}
                    extendedProfile={extendedProfile}
                    isParent={isParent}
                />

                <GamificationCard extendedProfile={extendedProfile} />
            </div>

            <DailyQuestsWidget />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <RecommendationsWidget results={recentResults} items={state.items} />

                    <PredictionChart
                        currentScore={stats.idgScore}
                        projectedScore={Math.min(10, stats.idgScore + 0.8)}
                        history={[]}
                    />

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Evolução de Notas</h3>
                        <EvolutionChart data={chartData} />
                    </div>

                    <AgendaWidget
                        monthEvents={getAllMonthEvents()}
                        onExpand={() => setShowSharedModal(true)}
                    />

                    <AdaptiveStudyPlanWidget />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <SkillsHeatmapWidget results={recentResults} items={state.items} />

                    <GradesHistory
                        results={recentResults}
                        exams={state.exams}
                        onSelectResult={setSelectedResult}
                    />

                    <AnnouncementsWidget announcements={state.announcements} />
                </div>
            </div>

            <AgendaModal
                isOpen={showSharedModal}
                onClose={() => setShowSharedModal(false)}
                currentMonth={currentMonth}
                onChangeMonth={changeMonth}
                daysInMonth={daysInMonth}
                firstDayOfMonth={firstDayOfMonth}
                getEventsForDay={getEventsForDay}
                getAllMonthEvents={getAllMonthEvents}
            />

            <EventRulesModal
                isOpen={!!showEventRules}
                eventId={showEventRules}
                availableEvents={availableEvents}
                onClose={() => setShowEventRules(null)}
                onAccept={handleAcceptEvent}
            />

            <RankingModal
                isOpen={showRankingModal}
                onClose={() => setShowRankingModal(false)}
                rankingMode={rankingMode}
                setRankingMode={setRankingMode}
                ranks={ranks}
                stats={{
                    idgScore: stats.idgScore,
                    examAverage: stats.examAverage,
                    projectAverage: stats.projectAverage,
                    bonusPoints: stats.bonusPoints
                }}
                settings={state.settings}
            />

            <CorrectionModal
                selectedResult={selectedResult}
                onClose={() => setSelectedResult(null)}
                exams={state.exams}
                items={state.items}
                isEnabled={isEnabled}
                setOwlTutorContext={setOwlTutorContext}
            />
        </div>
    );
};
