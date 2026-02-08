import { RouteObject, Navigate } from 'react-router-dom';
import { LoginPage } from './modules/auth/LoginPage';
import { BulkImportView } from './modules/admin/components/BulkImportView';
import { DashboardView } from './components/DashboardView';
import { ItemsListView } from './components/ItemsListView'; // Stays in components? Checked.
import { ItemEditorView } from './modules/builder/ItemEditorView';
import { ItemEditorV2 } from './modules/builder/ItemBank/ItemEditorV2';
import { ExamVariantsManager } from './components/ExamVariantsManager';
import { ExamsListView } from './modules/grading/ExamsListView'; // Moved to Grading module
import { ExamBuilderView } from './modules/builder/ExamBuilderView';
import { AllocationView } from './modules/grading/AllocationView';
import { ManagementView } from './modules/school-management/ManagementView';
import { PrintableExamView } from './modules/builder/PrintableExamView';
import { ResultsEntryView } from './modules/grading/ResultsEntryView';
import { StudentDashboardView } from './modules/student-portal/StudentDashboardView';
import { OwlTutorView } from './modules/student-portal/OwlTutorView';
import { StudentBattleView } from './modules/student-portal/StudentBattleView';
import { SurvivalView } from './modules/student-portal/SurvivalView';
import { SchoolDashboardView } from './modules/analytics/SchoolDashboardView';
import { CommunicationView } from './modules/communication/CommunicationView';
import { StudyPlansView } from './modules/academic/StudyPlansView';
import { UserProfileView } from './modules/profile/UserProfileView';
import { CapabilitiesView } from './modules/admin/components/CapabilitiesView';
import { NeuroScreeningView } from './modules/neuro-screening/NeuroScreeningView';
import { GamifiedEventsManager } from './modules/gamification/GamifiedEventsManager';
import { RiskDashboard } from './modules/analytics/risk/RiskDashboard';
import { ClassDiaryView } from './modules/class-diary/ClassDiaryView';
import { ProfessorDashboardView } from './modules/professor/ProfessorDashboardView';
import { ParentsDashboardView } from './modules/parents/ParentsDashboardView';
import { ArcadeView } from './modules/student-portal/ArcadeView';
import { AvatarShopView } from './modules/student-portal/AvatarShopView';
import { VocationalCompassView } from './modules/student-portal/VocationalCompassView';
import { GovernanceView } from './modules/admin/components/GovernanceView';
import { AuditLogView } from './modules/admin/components/AuditLogView';
import { TabletLauncher } from './modules/runner/student-app/TabletLauncher';
import { LiveDemoLobby } from './modules/demo/LiveDemoLobby';
import { ExamLauncher } from './modules/runner/features/ExamLauncher';
import { DashboardLayout } from './components/DashboardLayout';
import { AIDiagnosticView } from './modules/diagnostics/AIDiagnosticView';
import { ResultFeedbackView } from './modules/runner/features/ResultFeedbackView';
import { LiveExamMonitorView } from './modules/runner/features/LiveExamMonitorView';
import { OnlineExamRunner } from './modules/runner/features/OnlineExamRunner';
import { useAppStore } from './store/useAppStore';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AnalyticsDashboard } from './modules/analytics/AnalyticsDashboard';
import { AIQuestionGeneratorView } from './modules/builder/AIQuestionGeneratorView';
import { ExamScheduler } from './modules/coordinator/ExamScheduler';
import { CommandCenter } from './modules/coordinator/CommandCenter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ReportGeneratorView } from './modules/reports/ReportGeneratorView';
import { LiveDashboard } from './modules/runner/professor/LiveDashboard';
import { ProfessorApp } from './modules/runner/student-app/ProfessorApp';
import { MarketplaceView } from './modules/marketplace/MarketplaceView';

// Helper for Role-based Dashboard
const ConditionalDashboard = () => {
    return <DashboardView />;
};

const OnlineExamRunnerWrapper = () => {
    const { id: examId } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const variantId = queryParams.get('variantId');
    const navigate = useNavigate();
    const { currentUser, calculateAndSaveResult } = useAppStore();

    if (!currentUser || !examId) return <div>Erro: Dados inválidos</div>;

    return (
        <OnlineExamRunner
            examId={examId}
            studentId={currentUser.id}
            variantId={variantId || undefined}
            onExit={() => navigate('/online-exam')}
            onComplete={async (answers) => {
                try {
                    const attemptId = localStorage.getItem(`exam_attempt_${examId}_${currentUser.id}`);
                    if (attemptId) {
                        await calculateAndSaveResult(attemptId, answers);
                    }
                    alert(`Prova finalizada com sucesso! O sistema está processando seu relatório pedagógico.`);
                    navigate(`/online-exam/results/${examId}`);
                } catch (e) {
                    console.error("Erro ao salvar resultado:", e);
                    alert("Erro técnico ao salvar sua prova. Por favor, avise o professor.");
                }
            }}
        />
    );
};

const LiveDashboardWrapper = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const eventId = queryParams.get('eventId') || 'EVT-GLOBAL';
    const examId = queryParams.get('examId') || 'EXAM-001';
    const totalQuestions = parseInt(queryParams.get('totalQuestions') || '10');

    return (
        <LiveDashboard
            eventId={eventId}
            examId={examId}
            totalQuestions={totalQuestions}
        />
    );
};

export const appRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/',
        element: <DashboardLayout />,
        children: [
            { path: 'dashboard', element: <DashboardView /> },
            { path: 'items', element: <ItemsListView /> },
            { path: 'items/new', element: <ItemEditorView /> },
            { path: 'items/ai-generator', element: <AIQuestionGeneratorView /> },
            { path: 'items/:id/edit-v2', element: <ItemEditorV2 /> },
            { path: 'exams', element: <ExamsListView /> },
            { path: 'exams/:id/variants', element: <ExamVariantsManager /> },
            { path: 'exams/new', element: <ExamBuilderView /> },
            { path: 'exams/:id/print', element: <PrintableExamView /> },
            { path: 'exams/:id/results', element: <ResultsEntryView /> },
            { path: 'allocation', element: <AllocationView /> },
            { path: 'admin/gestao', element: <ManagementView /> },
            { path: 'admin/governanca', element: <GovernanceView /> },
            { path: 'admin/capabilities', element: <CapabilitiesView /> },
            { path: 'admin/audit', element: <AuditLogView /> },
            { path: 'admin/import', element: <BulkImportView /> },
            { path: 'risk-dashboard', element: <RiskDashboard /> },
            // Removed legacy analytics/SchoolDashboardView in favor of PerformanceAnalyticsDashboard below

            {
                path: 'communication',
                element: <CommunicationView />
            },
            {
                path: 'analytics',
                element: <AnalyticsDashboard />
            },
            {
                path: 'marketplace',
                element: <MarketplaceView />
            },
            {
                path: 'study-plans',
                element: <StudyPlansView />
            },
            { path: 'class-diary', element: <ClassDiaryView /> },
            { path: 'my-profile', element: <UserProfileView /> },
            { path: 'neuro-screening', element: <NeuroScreeningView /> },
            { path: 'gamified-events', element: <GamifiedEventsManager /> },

            // Sprint 0: Coordinator Tools
            {
                path: 'agendamento',
                element: <ProtectedRoute resource="SCHEDULING" fallbackPath="/dashboard" />,
                children: [
                    { index: true, element: <ExamScheduler /> }
                ]
            },
            {
                path: 'central-comando',
                element: <ProtectedRoute resource="COMMAND_CENTER" fallbackPath="/dashboard" />,
                children: [
                    { index: true, element: <CommandCenter /> }
                ]
            },
            {
                path: 'adm-relatorios',
                element: <ProtectedRoute resource="REPORTS" fallbackPath="/dashboard" />,
                children: [
                    { index: true, element: <ReportGeneratorView /> }
                ]
            },

            // Student specific
            { path: 'aluno', element: <StudentDashboardView /> },
            { path: 'aluno/tutor', element: <OwlTutorView /> },
            { path: 'aluno/loja', element: <AvatarShopView /> },
            { path: 'aluno/arcade', element: <ArcadeView /> },
            { path: 'aluno/bussola', element: <VocationalCompassView /> },
            { path: 'battle-arena', element: <StudentBattleView /> },
            { path: 'survival-mode', element: <SurvivalView /> },

            // Online Exam
            { path: 'online-exam', element: <ExamLauncher /> },
            { path: 'online-exam/run/:id', element: <OnlineExamRunnerWrapper /> },
            { path: 'online-exam/results/:id', element: <ResultFeedbackView /> },
            { path: 'monitor/:examId', element: <LiveExamMonitorView /> },
            { path: 'live-dashboard', element: <LiveDashboardWrapper /> },
            { path: 'professor/logistics', element: <ProfessorApp onBack={() => window.history.back()} /> },

            // Utils
            { path: 'diag-ai', element: <AIDiagnosticView /> }
        ]
    },
    // Full screen / No layout apps
    { path: '/apps/tablet', element: <div className="fixed inset-0 z-50 bg-slate-900"><TabletLauncher onSelectApp={() => { }} onBack={() => window.history.back()} /></div> },
    { path: '/apps/demo', element: <LiveDemoLobby onClose={() => window.history.back()} /> },

    // Legacy redirects
    { path: '/teacher/itens', element: <Navigate to="/items" replace /> },
    { path: '/teacher/provas', element: <Navigate to="/exams" replace /> },

    // Catch-all
    { path: '*', element: <Navigate to="/dashboard" replace /> }
];
