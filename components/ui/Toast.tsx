import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: return a no-op toast to avoid crashes if provider is missing
    return {
      addToast: (t: Omit<Toast, 'id'>) => console.warn('[ForgeToast] Provider not found. Toast:', t.title),
      removeToast: (_id: string) => {},
      success: (title: string, message?: string) => console.warn('[ForgeToast] success:', title),
      error: (title: string, message?: string) => console.warn('[ForgeToast] error:', title),
      warning: (title: string, message?: string) => console.warn('[ForgeToast] warning:', title),
      info: (title: string, message?: string) => console.warn('[ForgeToast] info:', title),
    };
  }
  return {
    ...ctx,
    success: (title: string, message?: string) => ctx.addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => ctx.addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => ctx.addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => ctx.addToast({ type: 'info', title, message }),
  };
};

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const styleMap: Record<ToastType, string> = {
  success: 'border-l-emerald-500 text-emerald-600',
  error: 'border-l-rose-500 text-rose-600',
  warning: 'border-l-amber-500 text-amber-600',
  info: 'border-l-sky-500 text-sky-600',
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const dur = toast.duration || 4000;
    const exitTimer = setTimeout(() => setExiting(true), dur - 300);
    const removeTimer = setTimeout(() => onRemove(toast.id), dur);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, onRemove]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80
        bg-[var(--forge-bg-surface)]
        border border-[var(--forge-border-default)]
        border-l-4 ${styleMap[toast.type]}
        rounded-xl p-4
        shadow-[var(--forge-shadow-lg)]
        transition-all duration-300
        ${exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-in slide-in-from-right-4 fade-in'}
      `.replace(/\s+/g, ' ').trim()}
    >
      <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--forge-text-primary)]">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-interactive-bg-hover)] transition-colors"
      >
        <X size={14} />
      </button>
      {/* Timer bar */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden bg-[var(--forge-border-subtle)]">
        <div
          className={`h-full rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'}`}
          style={{
            animation: `toast-timer ${toast.duration || 4000}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 flex flex-col gap-3 pointer-events-none"
        style={{ zIndex: 'var(--forge-z-toast, 3000)' }}
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Timer animation */}
      <style>{`
        @keyframes toast-timer {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
