import { RouteObject } from 'react-router-dom';
import { LoginPage } from './components/Auth/LoginPage';
import { BulkImportView } from './components/Admin/BulkImportView'; // [NEW] Import
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
import { TabletLauncher } from './components/TabletApp/TabletLauncher';
import { CoordinatorApp } from './components/TabletApp/CoordinatorApp';
import { ProfessorApp } from './components/TabletApp/ProfessorApp';
import { StudentApp } from './components/TabletApp/StudentApp';
import { LiveDemoLobby } from './components/Demo/LiveDemoLobby';

// Routes configuration
export const appRoutes: RouteObject[] = [
    // Public routes
    {
        path: '/',
        element: <LoginPage />
    },

    // Protected main app routes - will be wrapped in Layout
    {
        path: '/dashboard',
        element: <DashboardView />
    },
    {
        path: '/items',
        element: <ItemsListView />
    },
    {
        path: '/items/new',
        element: <ItemEditorView />
    },
    {
        path: '/exams',
        element: <ExamsListView />
    },
    {
        path: '/exams/new',
        element: <ExamBuilderView />
    },
    {
        path: '/exams/:id/print',
        element: <PrintableExamView />
    },
    {
        path: '/exams/:id/results',
        element: <ResultsEntryView />
    },
    {
        path: '/allocation',
        element: <AllocationView />
    },
    {
        path: '/management',
        element: <ManagementView />
    },

    // Student routes
    {
        path: '/student',
        element: <StudentDashboardView />
    },
    {
        path: '/student/tutor',
        element: <OwlTutorView />
    },
    {
        path: '/student/battle',
        element: <StudentBattleView />
    },
    {
        path: '/student/survival',
        element: <SurvivalView />
    },
    {
        path: '/student/arcade',
        element: <ArcadeView />
    },
    {
        path: '/student/shop',
        element: <AvatarShopView />
    },

    // Analytics & Reports
    {
        path: '/analytics',
        element: <SchoolDashboardView />
    },
    {
        path: '/risk',
        element: <RiskDashboard />
    },
    {
        path: '/admin/import',
        element: <BulkImportView />
    },

    // Communication
    {
        path: '/communication',
        element: <CommunicationView />
    },

    // Academic
    {
        path: '/study-plans',
        element: <StudyPlansView />
    },
    {
        path: '/diary',
        element: <ClassDiaryView />
    },

    // Profile & Settings
    {
        path: '/profile',
        element: <UserProfileView />
    },
    {
        path: '/screening',
        element: <NeuroScreeningView />
    },

    // Admin
    {
        path: '/admin/capabilities',
        element: <CapabilitiesView />
    },
    {
        path: '/admin/arcade',
        element: <GovernanceView />
    },

    // Events
    {
        path: '/events',
        element: <GamifiedEventsManager />
    },

    // Tablet Apps (no layout)
    {
        path: '/tablet/launcher',
        element: <TabletLauncher />
    },
    {
        path: '/tablet/coordinator',
        element: <CoordinatorApp />
    },
    {
        path: '/tablet/professor',
        element: <ProfessorApp />
    },
    {
        path: '/tablet/student',
        element: <StudentApp />
    },

    // Demo
    {
        path: '/demo',
        element: <LiveDemoLobby />
    }
];
