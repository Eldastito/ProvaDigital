import { RouteObject, Navigate } from 'react-router-dom';
import { LoginPage } from './components/Auth/LoginPage';
import { BulkImportView } from './components/Admin/BulkImportView';
import { DashboardView } from './components/DashboardView';
import { ItemsListView } from './components/ItemsListView';
import { ItemEditorView } from './components/ItemEditorView';
import { ExamsListView } from './components/ExamsListView';
import { ExamBuilderView } from './components/ExamBuilderView';
import { AllocationView } from './components/AllocationView';
import { ManagementView } from './components/ManagementView';
import { PrintableExamView } from './components/PrintableExamView';
import { ResultsEntryView } from './components/ResultsEntryView';
import { StudentDashboardView } from './components/StudentPortal/StudentDashboardView';
import { OwlTutorView } from './components/StudentPortal/OwlTutorView';
import { StudentBattleView } from './components/StudentPortal/StudentBattleView';
import { SurvivalView } from './components/StudentPortal/SurvivalView';
import { SchoolDashboardView } from './components/Analytics/SchoolDashboardView';
import { CommunicationView } from './components/Communication/CommunicationView';
import { StudyPlansView } from './components/Academic/StudyPlansView';
import { UserProfileView } from './components/Profile/UserProfileView';
import { CapabilitiesView } from './components/Admin/CapabilitiesView';
import { NeuroScreeningView } from './components/NeuroScreening/NeuroScreeningView';
import { GamifiedEventsManager } from './components/GamifiedEvents/GamifiedEventsManager';
import { RiskDashboard } from './components/RiskManagement/RiskDashboard';
import { ClassDiaryView } from './components/ClassDiary/ClassDiaryView';
import { ProfessorDashboardView } from './components/Professor/ProfessorDashboardView';
import { ParentsDashboardView } from './components/Parents/ParentsDashboardView';
import { ArcadeView } from './components/StudentPortal/ArcadeView';
import { AvatarShopView } from './components/StudentPortal/AvatarShopView';
import { GovernanceView } from './components/Admin/GovernanceView';
import { AuditLogView } from './components/Admin/AuditLogView';
import { TabletLauncher } from './components/TabletApp/TabletLauncher';
import { LiveDemoLobby } from './components/Demo/LiveDemoLobby';
import { ExamLauncher } from './components/OnlineExam/ExamLauncher';
import { DashboardLayout } from './components/DashboardLayout';
import { AIDiagnosticView } from './components/Diagnostics/AIDiagnosticView';
import { ResultFeedbackView } from './components/OnlineExam/ResultFeedbackView';
import { LiveExamMonitorView } from './components/LiveExamMonitorView';
import { OnlineExamRunner } from './components/OnlineExam/OnlineExamRunner';
import { useAppStore } from './store/useAppStore';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { PerformanceAnalyticsDashboard } from './components/Analytics/PerformanceAnalyticsDashboard';

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
            { path: 'exams', element: <ExamsListView /> },
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
            { path: 'analytics', element: <SchoolDashboardView /> },
            {
                path: 'comunicacao',
                element: <CommunicationView />
            },
            {
                path: 'analytics',
                element: <PerformanceAnalyticsDashboard />
            },
            {
                path: 'estudos',
                element: <StudyPlansView />
            },
            { path: 'class-diary', element: <ClassDiaryView /> },
            { path: 'my-profile', element: <UserProfileView /> },
            { path: 'neuro-screening', element: <NeuroScreeningView /> },
            { path: 'gamified-events', element: <GamifiedEventsManager /> },

            // Student specific
            { path: 'aluno', element: <StudentDashboardView /> },
            { path: 'aluno/tutor', element: <OwlTutorView /> },
            { path: 'aluno/loja', element: <AvatarShopView /> },
            { path: 'aluno/arcade', element: <ArcadeView /> },
            { path: 'battle-arena', element: <StudentBattleView /> },
            { path: 'survival-mode', element: <SurvivalView /> },

            // Online Exam
            { path: 'online-exam', element: <ExamLauncher /> },
            { path: 'online-exam/run/:id', element: <OnlineExamRunnerWrapper /> },
            { path: 'online-exam/results/:id', element: <ResultFeedbackView /> },
            { path: 'monitor/:examId', element: <LiveExamMonitorView /> },

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
