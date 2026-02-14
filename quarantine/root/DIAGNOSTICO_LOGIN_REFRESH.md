# 🔍 Diagnóstico: Problemas de Login e Refresh (F5)

## 📋 Problemas Identificados

### 1. ❌ Teste do LoginPage com Erros TypeScript
**Sintoma:** Erros de "Cannot find module" no teste
**Causa:** Importações complexas sem mocks adequados
**Status:** ✅ CORRIGIDO

### 2. 🔄 Aplicação Volta para Tela Padrão ao Dar F5
**Sintoma:** Ao dar refresh (F5), usuário perde a tela atual e volta para dashboard/login
**Causa Raiz:** Falta de persistência do estado de autenticação e rota

---

## 🔬 Análise do Fluxo de Autenticação

### Fluxo Atual (App.tsx)

```typescript
// 1. Inicialização
useEffect(() => {
  checkConnection().then(() => {
    useAppStore.setState({ isInitialized: true });
  });
}, []);

// 2. Listener de Autenticação
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) handleAuthUser(session.user);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) handleAuthUser(session.user);
    if (event === 'SIGNED_OUT') {
      setCurrentUser(null);
      navigate('/login');
    }
  });
}, [isInitialized]);

// 3. Redirecionamento após Login
const handleAuthUser = async (sessionUser) => {
  // ... busca usuário ...
  setCurrentUser(userMatch);
  
  // ⚠️ PROBLEMA: Só redireciona se estiver em '/' ou '/login'
  if (window.location.pathname === '/' || window.location.pathname === '/login') {
    if (userMatch.role === UserRole.ALUNO) navigate('/aluno');
    else navigate('/dashboard');
  }
};
```

### 🐛 Problema Identificado

Quando você:
1. Faz login → vai para `/dashboard`
2. Navega para `/risk-dashboard`
3. Dá F5 (refresh)

**O que acontece:**
- ✅ Supabase mantém a sessão (cookie)
- ✅ `getSession()` recupera o usuário
- ✅ `setCurrentUser()` é chamado
- ❌ **MAS** o `navigate()` NÃO é chamado (pois não está em '/' ou '/login')
- ❌ A rota atual (`/risk-dashboard`) é mantida
- ❌ **PORÉM**, se houver algum componente que depende de `currentUser` e ele demora para carregar, pode haver um "flash" ou redirecionamento indesejado

**Cenário mais provável:**
- O `currentUser` demora alguns milissegundos para ser setado
- Durante esse tempo, algum componente verifica `if (!currentUser)` e redireciona para login ou dashboard
- Isso cria o efeito de "voltar para tela padrão"

---

## 🛠️ Soluções Propostas

### Solução 1: Persistir Última Rota Visitada

```typescript
// Salvar rota antes de sair
useEffect(() => {
  const saveCurrentRoute = () => {
    if (currentUser && window.location.pathname !== '/login') {
      localStorage.setItem('lastRoute', window.location.pathname);
    }
  };

  window.addEventListener('beforeunload', saveCurrentRoute);
  return () => window.removeEventListener('beforeunload', saveCurrentRoute);
}, [currentUser]);

// Restaurar rota após login
const handleAuthUser = async (sessionUser) => {
  setCurrentUser(userMatch);
  
  const lastRoute = localStorage.getItem('lastRoute');
  const currentPath = window.location.pathname;
  
  // Se está em login ou raiz, redirecionar
  if (currentPath === '/' || currentPath === '/login') {
    if (lastRoute && lastRoute !== '/login') {
      navigate(lastRoute);
    } else {
      navigate(userMatch.role === UserRole.ALUNO ? '/aluno' : '/dashboard');
    }
  }
  // Caso contrário, manter rota atual (não fazer nada)
};
```

### Solução 2: Loading State Melhorado

```typescript
// Adicionar flag de "carregando autenticação"
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      handleAuthUser(session.user).finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  });
}, []);

// Mostrar loading enquanto verifica auth
if (authLoading) {
  return <LoadingScreen />;
}
```

### Solução 3: Proteger Rotas com Guard

```typescript
// ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Aguardar verificação de sessão
    const timer = setTimeout(() => setChecking(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (checking) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  
  return children;
};
```

---

## 🧪 Teste de Diagnóstico

Vou criar um teste para verificar o comportamento:

```typescript
describe('Authentication Flow', () => {
  it('deve manter rota após refresh', async () => {
    // 1. Simular login
    const mockUser = { id: '1', email: 'test@test.com', role: 'PROFESSOR' };
    
    // 2. Navegar para rota específica
    navigate('/risk-dashboard');
    
    // 3. Simular refresh (recarregar session)
    await supabase.auth.getSession();
    
    // 4. Verificar que rota foi mantida
    expect(window.location.pathname).toBe('/risk-dashboard');
  });
});
```

---

## 📊 Checklist de Verificação

Para identificar o problema exato, verifique:

- [ ] Console do navegador mostra erros ao dar F5?
- [ ] `currentUser` está null por alguns segundos após F5?
- [ ] Qual rota específica você está quando dá F5?
- [ ] O problema acontece em todas as rotas ou só em algumas?
- [ ] Há algum componente com `useEffect(() => { if (!currentUser) navigate('/login') }, [currentUser])`?

---

## 🎯 Próximos Passos

1. ✅ Corrigir teste do LoginPage (feito)
2. ⏳ Implementar persistência de rota
3. ⏳ Adicionar loading state durante verificação de auth
4. ⏳ Testar fluxo completo

---

**Criado em:** 08/01/2026 19:59  
**Status:** Em Diagnóstico
