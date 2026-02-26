import React, { lazy, Suspense } from 'react';
import { RouteObject, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { INITIAL_ANNOUNCEMENTS, INITIAL_EXAMS } from './utils/mockData';
import { uuidv4 } from './utils/helpers';

// --- Lazy Imports (Code Splitting) ---
// Layout & Auth
const LoginPage = lazy(() => import('./modules/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));

// Item Bank & Builder
const ItemsListView = lazy(() => import('./components/ItemsListView').then(m => ({ default: m.ItemsListView })));
const ItemEditorView = lazy(() => import('./modules/builder/ItemEditorView').then(m => ({ default: m.ItemEditorView })));
const ItemEditorV2 = lazy(() => import('./modules/builder/ItemBank/ItemEditorV2').then(m => ({ default: m.ItemEditorV2 })));
const AIQuestionGeneratorView = lazy(() => import('./modules/builder/AIQuestionGeneratorView').then(m => ({ default: m.AIQuestionGeneratorView })));
const MultimodalLabView = lazy(() => import('./modules/builder/MultimodalLabView').then(m => ({ default: m.MultimodalLabView })));
const ExamBuilderView = lazy(() => import('./modules/builder/ExamBuilderView').then(m => ({ default: m.ExamBuilderView })));
const PrintableExamView = lazy(() => import('./modules/builder/PrintableExamView').then(m => ({ default: m.PrintableExamView })));

// Exams & Grading
const ExamsListView = lazy(() => import('./modules/grading/ExamsListView').then(m => ({ default: m.ExamsListView })));
const ExamVariantsManager = lazy(() => import('./components/ExamVariantsManager').then(m => ({ default: m.ExamVariantsManager })));
const AllocationView = lazy(() => import('./modules/grading/AllocationView').then(m => ({ default: m.AllocationView })));
const ResultsEntryView = lazy(() => import('./modules/grading/ResultsEntryView').then(m => ({ default: m.ResultsEntryView })));

// Exam Runner
const ExamLauncher = lazy(() => import('./modules/runner/features/ExamLauncher').then(m => ({ default: m.ExamLauncher })));
const OnlineExamRunner = lazy(() => import('./modules/runner/features/OnlineExamRunner').then(m => ({ default: m.OnlineExamRunner })));
const ResultFeedbackView = lazy(() => import('./modules/runner/features/ResultFeedbackView').then(m => ({ default: m.ResultFeedbackView })));
const LiveExamMonitorView = lazy(() => import('./modules/runner/features/LiveExamMonitorView').then(m => ({ default: m.LiveExamMonitorView })));
const LiveDashboard = lazy(() => import('./modules/runner/professor/LiveDashboard').then(m => ({ default: m.LiveDashboard })));
const TabletLauncher = lazy(() => import('./modules/runner/student-app/TabletLauncher').then(m => ({ default: m.TabletLauncher })));
const ProfessorApp = lazy(() => import('./modules/runner/student-app/ProfessorApp').then(m => ({ default: m.ProfessorApp })));
const RouterTabletSetup = lazy(() => import('./modules/runner/router/RouterTabletSetup').then(m => ({ default: m.RouterTabletSetup })));

// School Management
const ManagementView = lazy(() => import('./modules/school-management/ManagementView').then(m => ({ default: m.ManagementView })));

// Analytics
const AnalyticsDashboard = lazy(() => import('./modules/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const SchoolPrincipalDashboard = lazy(() => import('./modules/analytics/SchoolPrincipalDashboard').then(m => ({ default: m.SchoolPrincipalDashboard })));
const PredictiveRiskDashboard = lazy(() => import('./modules/analytics/PredictiveRiskDashboard').then(m => ({ default: m.PredictiveRiskDashboard })));
const PredictiveDashboardView = lazy(() => import('./modules/analytics/PredictiveDashboardView').then(m => ({ default: m.PredictiveDashboardView })));
const RiskDashboard = lazy(() => import('./modules/analytics/risk/RiskDashboard').then(m => ({ default: m.RiskDashboard })));
const OECDPortalView = lazy(() => import('./modules/analytics/OECDPortalView').then(m => ({ default: m.OECDPortalView })));

// Admin
const SaaSControlPanelView = lazy(() => import('./modules/admin/SaaSControlPanelView').then(m => ({ default: m.SaaSControlPanelView })));
const BulkImportView = lazy(() => import('./modules/admin/components/BulkImportView').then(m => ({ default: m.BulkImportView })));
const CapabilitiesView = lazy(() => import('./modules/admin/components/CapabilitiesView').then(m => ({ default: m.CapabilitiesView })));
const GovernanceView = lazy(() => import('./modules/admin/components/GovernanceView').then(m => ({ default: m.GovernanceView })));
const AuditLogView = lazy(() => import('./modules/admin/components/AuditLogView').then(m => ({ default: m.AuditLogView })));
const LogisticsManagementView = lazy(() => import('./modules/admin/LogisticsManagementView'));
const CustodianOperationsView = lazy(() => import('./modules/logistics/CustodianOperationsView'));

// Student Portal
const StudentDashboardView = lazy(() => import('./modules/student-portal/StudentDashboardView').then(m => ({ default: m.StudentDashboardView })));
const OwlTutorView = lazy(() => import('./modules/student-portal/OwlTutorView').then(m => ({ default: m.OwlTutorView })));
const StudentBattleView = lazy(() => import('./modules/student-portal/StudentBattleView').then(m => ({ default: m.StudentBattleView })));
const SurvivalView = lazy(() => import('./modules/student-portal/SurvivalView').then(m => ({ default: m.SurvivalView })));
const ArcadeView = lazy(() => import('./modules/student-portal/ArcadeView').then(m => ({ default: m.ArcadeView })));
const AvatarShopView = lazy(() => import('./modules/student-portal/AvatarShopView').then(m => ({ default: m.AvatarShopView })));
const VocationalCompassView = lazy(() => import('./modules/student-portal/VocationalCompassView').then(m => ({ default: m.VocationalCompassView })));

// Professor
const ProfessorDashboardView = lazy(() => import('./modules/analytics/ProfessorDashboardView').then(m => ({ default: m.ProfessorDashboardView })));

// Coordinator
const ExamScheduler = lazy(() => import('./modules/coordinator/ExamScheduler').then(m => ({ default: m.ExamScheduler })));
const CommandCenter = lazy(() => import('./modules/coordinator/CommandCenter').then(m => ({ default: m.CommandCenter })));
const ClassCouncilView = lazy(() => import('./modules/coordinator/ClassCouncilView').then(m => ({ default: m.ClassCouncilView })));

// Other modules
const CommunicationView = lazy(() => import('./modules/communication/CommunicationView').then(m => ({ default: m.CommunicationView })));
const StudyPlansView = lazy(() => import('./modules/academic/StudyPlansView').then(m => ({ default: m.StudyPlansView })));
const UserProfileView = lazy(() => import('./modules/profile/UserProfileView').then(m => ({ default: m.UserProfileView })));
const NeuroScreeningView = lazy(() => import('./modules/neuro-screening/NeuroScreeningView').then(m => ({ default: m.NeuroScreeningView })));
const GamifiedEventsManager = lazy(() => import('./modules/gamification/GamifiedEventsManager').then(m => ({ default: m.GamifiedEventsManager })));
const ClassDiaryView = lazy(() => import('./modules/class-diary/ClassDiaryView').then(m => ({ default: m.ClassDiaryView })));
const ParentsDashboardView = lazy(() => import('./modules/parents/ParentsDashboardView').then(m => ({ default: m.ParentsDashboardView })));
const ReportGeneratorView = lazy(() => import('./modules/reports/ReportGeneratorView').then(m => ({ default: m.ReportGeneratorView })));
const MarketplaceView = lazy(() => import('./modules/marketplace/MarketplaceView').then(m => ({ default: m.MarketplaceView })));
const AIDiagnosticView = lazy(() => import('./modules/diagnostics/AIDiagnosticView').then(m => ({ default: m.AIDiagnosticView })));
const LiveDemoLobby = lazy(() => import('./modules/demo/LiveDemoLobby').then(m => ({ default: m.LiveDemoLobby })));

// Protected Route (keep static — tiny file critical for auth)
import { ProtectedRoute } from './components/ProtectedRoute';

// Module-level lazy route definitions
import { studentModule } from './modules/student-portal/module';
import { professorModule } from './modules/professor/module';
import { adminModule } from './modules/admin/module';
import { strategicModule } from './modules/analytics/module';
import { managementModule } from './modules/school-management/module';
import { parentsModule } from './modules/parents/module';

// --- Suspense Fallback ---
export const PageLoader = () => (
    <div className="flex h-screen w-screen items-center justify-center flex-col gap-4 bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Carregando módulo...</p>
    </div>
);

// --- Route Wrappers ---
const RouterSetupWrapper = () => {
    const { currentUser } = useAppStore();
    if (!currentUser) return <Navigate to="/login" replace />;
    return (
        <RouterTabletSetup
            schoolId={currentUser.schoolId || 'unknown'}
            eventId={`MESH-${currentUser.schoolId}-${new Date().toISOString().split('T')[0]}`}
        />
    );
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
    const eventId = queryParams.get('eventId') || INITIAL_ANNOUNCEMENTS[0]?.id || uuidv4();
    const examId = queryParams.get('examId') || INITIAL_EXAMS[0]?.id || uuidv4();
    const totalQuestions = parseInt(queryParams.get('totalQuestions') || '10');

    return (
        <LiveDashboard
            eventId={eventId}
            examId={examId}
            totalQuestions={totalQuestions}
        />
    );
};

// --- App Routes (wrapped in Suspense at each route level) ---
const S = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const appRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />
    },
    {
        path: '/login',
        element: <S><LoginPage /></S>
    },
    {
        path: '/',
        element: <S><DashboardLayout /></S>,
        children: [
            ...studentModule.routes,
            ...professorModule.routes,
            ...adminModule.routes,
            ...strategicModule.routes,
            ...managementModule.routes,
            ...parentsModule.routes,

            { path: 'dashboard', element: <S><DashboardView /></S> },
            { path: 'items', element: <S><ItemsListView /></S> },
            { path: 'items/new', element: <S><ItemEditorView /></S> },
            { path: 'items/ai-generator', element: <S><AIQuestionGeneratorView /></S> },
            { path: 'items/multimodal-lab', element: <S><MultimodalLabView /></S> },
            { path: 'items/:id/edit-v2', element: <S><ItemEditorV2 /></S> },
            { path: 'exams', element: <S><ExamsListView /></S> },
            { path: 'exams/:id/variants', element: <S><ExamVariantsManager /></S> },
            { path: 'exams/new', element: <S><ExamBuilderView /></S> },
            { path: 'exams/:id/print', element: <S><PrintableExamView /></S> },
            { path: 'exams/:id/results', element: <S><ResultsEntryView /></S> },
            { path: 'allocation', element: <S><AllocationView /></S> },
            { path: 'my-profile', element: <S><UserProfileView /></S> },

            // Online Exam core (shared)
            { path: 'online-exam', element: <S><ExamLauncher /></S> },
            { path: 'online-exam/run/:id', element: <S><OnlineExamRunnerWrapper /></S> },
            { path: 'online-exam/results/:id', element: <S><ResultFeedbackView /></S> },
            { path: 'monitor/:examId', element: <S><LiveExamMonitorView /></S> },
            { path: 'live-dashboard', element: <S><LiveDashboardWrapper /></S> },
            {
                path: 'logistica/operacoes',
                element: <ProtectedRoute resource="CUSTODY_OPS" fallbackPath="/dashboard" />,
                children: [
                    { index: true, element: <S><CustodianOperationsView /></S> }
                ]
            },
            { path: 'professor/config/router', element: <S><RouterSetupWrapper /></S> }
        ]
    },
    // Full screen / No layout apps
    {
        path: '/apps/tablet',
        element: (
            <S>
                <div className="fixed inset-0 z-50 bg-slate-900">
                    <TabletLauncher onSelectApp={() => { }} onBack={() => window.history.back()} />
                </div>
            </S>
        )
    },
    { path: '/apps/demo', element: <S><LiveDemoLobby onClose={() => window.history.back()} /></S> },

    // Legacy redirects
    { path: '/teacher/itens', element: <Navigate to="/items" replace /> },
    { path: '/teacher/provas', element: <Navigate to="/exams" replace /> },

    // Catch-all
    { path: '*', element: <Navigate to="/dashboard" replace /> }
];
