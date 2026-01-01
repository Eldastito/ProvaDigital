
import React from 'react';
import { useAppStore } from '../store/useAppStore';

// Views
import { DashboardView } from './DashboardView';
import { ItemsListView } from './ItemsListView';
import { ItemEditorView } from './ItemEditorView';
import { ExamsListView } from './ExamsListView';
import { ExamBuilderView } from './ExamBuilderView';
import { AllocationView } from './AllocationView';
import { ManagementView } from './ManagementView';
import { ParentDashboardView } from './ParentDashboard/ParentDashboardView';
import { PrintableExamView } from './PrintableExamView';
import { ResultsEntryView } from './ResultsEntryView';
import { StudentDashboardView } from './StudentPortal/StudentDashboardView';
import { OwlTutorView } from './StudentPortal/OwlTutorView';
import { SchoolDashboardView } from './Analytics/SchoolDashboardView';
import { CommunicationView } from './Communication/CommunicationView';
import { StudyPlansView } from './Academic/StudyPlansView';
import { UserProfileView } from './Profile/UserProfileView';
import { CapabilitiesView } from './Admin/CapabilitiesView';
import { NeuroScreeningView } from './NeuroScreening/NeuroScreeningView';
import { StudentBattleView } from './StudentPortal/StudentBattleView';
import { SurvivalView } from './StudentPortal/SurvivalView';
import { GamifiedEventsManager } from './GamifiedEvents/GamifiedEventsManager';
import { RiskDashboard } from './RiskManagement/RiskDashboard';
import { ClassDiaryView } from './ClassDiary/ClassDiaryView';

interface ViewRouterProps {
    view: string;
    setView: (v: string) => void;
    // Specific ID states for views that require them
    selectedExamIdForPrint: string | null;
    selectedExamIdForResults: string | null;
    // Handlers
    onPrintExam: (id: string) => void;
    onGradeExam: (id: string) => void;
}

export const ViewRouter = ({
    view, setView,
    selectedExamIdForPrint, selectedExamIdForResults,
    onPrintExam, onGradeExam
}: ViewRouterProps) => {
    const store = useAppStore();
    const {
        currentUser, addItem, addExam, updateExamAllocation,
        updateResults, addSchool, addClass, addStudent, addUser,
        updateSettings, updateMessages, updateChatGroups, updateCurrentUser, updateUserProfile,
        updatePermissions, updateTenantFeatures
    } = store;

    if (!currentUser) return null;

    switch (view) {
        case 'DASHBOARD':
            return <DashboardView state={store} setView={setView} />;

        case 'ITEMS':
            return <ItemsListView state={store} onNew={() => setView('ITEM_NEW')} />;

        case 'ITEM_NEW':
            return <ItemEditorView state={store} onSave={(i) => { addItem(i); setView('ITEMS'); }} onCancel={() => setView('ITEMS')} />;

        case 'EXAMS':
            return <ExamsListView state={store} onNew={() => setView('EXAM_NEW')} onPrint={onPrintExam} onGrade={onGradeExam} />;

        case 'EXAM_NEW':
            return <ExamBuilderView state={store} onSave={(e) => { addExam(e); setView('EXAMS'); }} onCancel={() => setView('EXAMS')} />;

        case 'ALLOCATION':
            return <AllocationView state={store} onUpdate={updateExamAllocation} />;

        case 'MANAGEMENT':
            return <ManagementView
                state={store}
                onAddSchool={addSchool}
                onAddClass={addClass}
                onAddStudent={addStudent}
                onAddUser={addUser}
                onUpdateUser={store.updateUser}
                onResetPassword={store.resetUserPassword}
                onUpdateSettings={updateSettings}
            />;

        case 'PRINT_PREVIEW':
            return selectedExamIdForPrint ? <PrintableExamView state={store} examId={selectedExamIdForPrint} onBack={() => setView('EXAMS')} /> : null;

        case 'RESULTS_ENTRY':
            return selectedExamIdForResults ? <ResultsEntryView state={store} examId={selectedExamIdForResults} onBack={() => setView('EXAMS')} onSaveResults={updateResults} /> : null;

        case 'STUDENT_PORTAL':
            return <StudentDashboardView state={store} user={currentUser} />;

        case 'OWL_TUTOR':
            return <OwlTutorView state={store} user={currentUser} />;

        case 'BATTLE_ARENA':
            return <StudentBattleView state={store} user={currentUser} onUpdateProfile={updateUserProfile} />;

        case 'SURVIVAL_MODE':
            return <SurvivalView state={store} user={currentUser} onUpdateProfile={updateUserProfile} />;

        case 'ANALYTICS':
            return <SchoolDashboardView state={store} />;

        case 'COMMUNICATION':
            return <CommunicationView state={store} user={currentUser} onUpdateMessages={updateMessages} onUpdateGroups={updateChatGroups} onUpdateUser={updateCurrentUser} />;

        case 'STUDY_PLANS':
            return <StudyPlansView state={store} user={currentUser} />;

        case 'MY_PROFILE':
            return <UserProfileView state={store} user={currentUser} onUpdateProfile={updateUserProfile} />;

        case 'CAPABILITIES':
            return <CapabilitiesView />;

        case 'NEURO_SCREENING':
            return <NeuroScreeningView state={store} onUpdateProfile={updateUserProfile} />;

        case 'GAMIFIED_EVENTS':
            return <GamifiedEventsManager state={store} user={currentUser} />;

        case 'PARENT_DASHBOARD':
            return <ParentDashboardView />;

        case 'RISK_MANAGEMENT':
            return <RiskDashboard />;

        case 'CLASS_DIARY':
            return <ClassDiaryView />;

        default:
            return <div className="p-8 text-center text-slate-500">View not found: {view}</div>;
    }
};
