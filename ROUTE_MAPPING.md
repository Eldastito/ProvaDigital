# ViewRouter → React Router Migration Map

## Mapeamento Completo de Views para URLs

| View Name (ViewRouter) | Nova URL | Componente | Parâmetros |
|------------------------|----------|------------|------------|
| `DASHBOARD` | `/dashboard` | `DashboardView` / `ProfessorDashboardView` / `ParentsDashboardView` | - |
| `ITEMS` | `/items` | `ItemsListView` | - |
| `ITEM_NEW` | `/items/new` | `ItemEditorView` | - |
| `EXAMS` | `/exams` | `ExamsListView` | - |
| `EXAM_NEW` | `/exams/new` | `ExamBuilderView` | - |
| `PRINT_PREVIEW` | `/exams/:id/print` | `PrintableExamView` | `examId` |
| `RESULTS_ENTRY` | `/exams/:id/results` | `ResultsEntryView` | `examId` |
| `ALLOCATION` | `/allocation` | `AllocationView` | - |
| `MANAGEMENT` | `/management` | `ManagementView` | - |
| `STUDENT_PORTAL` | `/student` | `StudentDashboardView` | - |
| `OWL_TUTOR` | `/student/tutor` | `OwlTutorView` | - |
| `BATTLE_ARENA` | `/student/battle` | `StudentBattleView` | - |
| `SURVIVAL_MODE` | `/student/survival` | `SurvivalView` | - |
| `ARCADE` | `/student/arcade` | `ArcadeView` | - |
| `AVATAR_SHOP` | `/student/shop` | `AvatarShopView` | - |
| `ANALYTICS` | `/analytics` | `SchoolDashboardView` | - |
| `COMMUNICATION` | `/communication` | `CommunicationView` | - |
| `STUDY_PLANS` | `/study-plans` | `StudyPlansView` | - |
| `MY_PROFILE` | `/profile` | `UserProfileView` | - |
| `CAPABILITIES` | `/admin/capabilities` | `CapabilitiesView` | - |
| `NEURO_SCREENING` | `/screening` | `NeuroScreeningView` | - |
| `GAMIFIED_EVENTS` | `/events` | `GamifiedEventsManager` | - |
| `RISK_MANAGEMENT` | `/risk` | `RiskDashboard` | - |
| `CLASS_DIARY` | `/diary` | `ClassDiaryView` | - |
| `GOVERNANCE` | `/admin/arcade` | `GovernanceView` | - |

## Componentes que Usam setView (35 ocorrências)

### 1. ViewRouter.tsx (8 usos)
- ✅ **Será deletado** após migração completa

### 2. StudentDashboardView.tsx (4 usos)
- `setView('MY_PROFILE')` → `navigate('/profile')`
- `setView('AVATAR_SHOP')` → `navigate('/student/shop')`
- `setView('ARCADE')` → `navigate('/student/arcade')`
- `setView('SURVIVAL_MODE')` → `navigate('/student/survival')`

### 3. GamifiedEventsManager.tsx (8 usos)
- Usa `useState` local para sub-navegação (`LIST`, `CREATE`, `MANAGE`, `LIVE`)
- **Solução:** Manter `useState` local OU criar subrotas `/events/create`, `/events/:id/manage`

### 4. ProfessorDashboardView.tsx (4 usos)
- `setView('TABLET_LAUNCHER')` → `navigate('/tablet/launcher')`
- `setView('ITEM_NEW')` → `navigate('/items/new')`
- `setView('EXAM_NEW')` → `navigate('/exams/new')`
- `setView('EXAMS')` → `navigate('/exams')`

### 5. TabletApp/ProfessorApp.tsx (5 usos)
- Usa `useState` local para sub-navegação do tablet
- **Solução:** Manter `useState` local (tablet é standalone)

### 6. TabletApp/CoordinatorApp.tsx (4 usos)
- Usa `useState` local para sub-navegação do tablet
- **Solução:** Manter `useState` local (tablet é standalone)

### 7. ArcadeView.tsx & AvatarShopView.tsx (2 usos)
- `onBack={() => setView('STUDENT_PORTAL')}` → `navigate('/student')`

---

## Estratégia de Migração

### Prioridade 1: Componentes Principais (Core Navigation)
1. ✅ `ViewRouter.tsx` - Mapear todas as views
2. ⏳ `Layout.tsx` - Atualizar sidebar
3. ⏳ `ItemsListView.tsx` - Botão "Novo"
4. ⏳ `ExamsListView.tsx` - Botão "Novo"
5. ⏳ `ItemEditorView.tsx` - Botões "Salvar/Cancelar"
6. ⏳ `ExamBuilderView.tsx` - Botões "Salvar/Cancelar"

### Prioridade 2: Student Portal
7. ⏳ `StudentDashboardView.tsx` - 4 navegações
8. ⏳ `ArcadeView.tsx` - Botão voltar
9. ⏳ `AvatarShopView.tsx` - Botão voltar

### Prioridade 3: Professor Dashboard
10. ⏳ `ProfessorDashboardView.tsx` - 4 navegações

### Prioridade 4: Views com Sub-navegação (Decisão Pendente)
11. ⏳ `GamifiedEventsManager.tsx` - Decidir se usa rotas ou `useState`
12. ⏳ `TabletApp/*` - Manter `useState` (standalone)

---

## Padrão de Substituição

### Antes:
```tsx
interface MyComponentProps {
  setView: (v: string) => void;
}

export const MyComponent = ({ setView }: MyComponentProps) => {
  return (
    <button onClick={() => setView('ITEMS')}>
      Ir para Items
    </button>
  );
};
```

### Depois:
```tsx
import { useNavigate } from 'react-router-dom';

export const MyComponent = () => {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('/items')}>
      Ir para Items
    </button>
  );
};
```

---

## Progresso

- [x] Fase 1.1: Mapear views
- [x] Fase 1.2: Identificar componentes
- [ ] Fase 2.1: Atualizar routes.tsx
- [ ] Fase 2.2: Migrar componentes
- [ ] Fase 3: Remover ViewRouter
- [ ] Fase 4: Testes
