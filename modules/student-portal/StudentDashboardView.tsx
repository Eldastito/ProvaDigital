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
import { AgendaModal } from './components/dashboard/AgendaModal';
import { EventRulesModal } from './components/dashboard/EventRulesModal';
import { RankingModal } from './components/dashboard/RankingModal';
import { CorrectionModal } from './components/dashboard/CorrectionModal';
import { TrendingUp } from 'lucide-react';

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
        currentMonth,
        showRankingModal, setShowRankingModal,
        rankingMode, setRankingMode,
        selectedResult, setSelectedResult,
        showAgendaModal, setShowAgendaModal,
        showEventRules, setShowEventRules,
        handleAcceptEvent,
        changeMonth,
        getEventsForDay,
        getAllMonthEvents,
        daysInMonth,
        firstDayOfMonth,
        state,
        isEnabled,
        setOwlTutorContext
    } = useStudentDashboard();

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <DashboardHeader
                user={user}
                studentName={student.name}
                isParent={isParent}
                rankingEnabled={state.settings.rankingEnabled}
                onShowRanking={() => setShowRankingModal(true)}
                onShowAgenda={() => setShowAgendaModal(true)}
            />

            <EventInvitations
                events={availableEvents}
                onAccept={(id) => setShowEventRules(id)}
            />

            <ActiveEventsList events={myActiveEvents} />

            <MentorshipBoard student={student} isParent={isParent} />

            <StatsCards stats={stats} trend={trend} />

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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Evolução de Notas</h3>
                        <EvolutionChart data={chartData} />
                    </div>

                    <AgendaWidget
                        monthEvents={getAllMonthEvents()}
                        onExpand={() => setShowAgendaModal(true)}
                    />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <GradesHistory
                        results={recentResults}
                        exams={state.exams}
                        onSelectResult={setSelectedResult}
                    />

                    <AnnouncementsWidget announcements={state.announcements} />
                </div>
            </div>

            <AgendaModal
                isOpen={showAgendaModal}
                onClose={() => setShowAgendaModal(false)}
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
