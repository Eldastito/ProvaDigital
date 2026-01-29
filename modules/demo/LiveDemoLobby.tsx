import React from 'react';
import { X } from 'lucide-react';
import { StudentApp } from '../../modules/runner/student-app/StudentApp';
import { ProfessorRemoteControl } from './ProfessorRemoteControl';
import { useLiveDemoSession } from './hooks/useLiveDemoSession';

// Phases
import { LiveDemoSetup } from './phases/LiveDemoSetup';
import { LiveDemoWaiting } from './phases/LiveDemoWaiting';
import { LiveDemoActiveDashboard } from './phases/LiveDemoActiveDashboard';
import { LiveDemoResults } from './phases/LiveDemoResults';

interface LiveDemoLobbyProps {
    onClose: () => void;
}

export const LiveDemoLobby = ({ onClose }: LiveDemoLobbyProps) => {
    // Check for Mobile Modes (Direct Link Support)
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const classIdParam = params.get('classId');

    // 1. Student Mobile App (Redirected)
    if (roleParam === 'STUDENT') {
        return <StudentApp onBack={onClose} />;
    }

    // 2. Professor Remote Control (Redirected)
    if (roleParam === 'PROFESSOR' && classIdParam) {
        return <ProfessorRemoteControl classId={classIdParam} onExit={onClose} />;
    }

    const {
        step,
        SECURITY_PIN,
        sessionConfig,
        activeClassId, activeExamId,
        joinedStudents,
        submissions,
        securityAlerts,
        securityEvents,
        isEntryLocked,
        timeLeftToLock,
        toleranceEndTime,
        examStats,
        topPerformers,
        selectedExamItems,
        handleSessionCreated,
        handleFinishSession,
        generateReport
    } = useLiveDemoSession(onClose);

    return (
        <div className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col font-sans">
            {/* Common Header / Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 rounded-full transition"
            >
                <X size={24} />
            </button>

            {step === 'SETUP' && (
                <LiveDemoSetup onSessionCreated={handleSessionCreated} />
            )}

            {step === 'WAITING_PROFESSOR' && activeClassId && activeExamId && (
                <LiveDemoWaiting
                    classId={activeClassId}
                    examId={activeExamId}
                    securityPin={SECURITY_PIN}
                />
            )}

            {step === 'LOBBY_ACTIVE' && activeClassId && activeExamId && (
                <LiveDemoActiveDashboard
                    classId={activeClassId}
                    examId={activeExamId}
                    capacity={sessionConfig.capacity}
                    joinedStudents={joinedStudents}
                    presentCount={joinedStudents.length}
                    fillPercentage={(joinedStudents.length / sessionConfig.capacity) * 100}
                    isEntryLocked={isEntryLocked}
                    timeLeftToLock={timeLeftToLock}
                    toleranceEndTime={toleranceEndTime}
                    onManualFinish={handleFinishSession}
                    submissions={submissions}
                    securityAlerts={securityAlerts}
                    securityEvents={securityEvents}
                />
            )}

            {step === 'RESULTS' && examStats && (
                <LiveDemoResults
                    examStats={examStats}
                    selectedExamItems={selectedExamItems}
                    topPerformers={topPerformers}
                    generateReport={generateReport}
                />
            )}
        </div>
    );
};
