import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center flex flex-col items-center justify-center gap-4 my-4">
                    <div className="bg-rose-100 p-4 rounded-full text-rose-600">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-rose-900">Algo deu errado neste componente</h2>
                        <p className="text-rose-700 text-sm mt-1 max-w-md">
                            {this.state.error?.message || 'Erro inesperado na renderização.'}
                        </p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-700 transition"
                    >
                        <RefreshCw size={16} /> Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
