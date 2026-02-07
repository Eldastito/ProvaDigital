/**
 * Command Center Component
 * 
 * Central de controle para todas as provas ativas.
 * Sprint 0 - Parte 2
 */

import React, { useState, useEffect } from 'react';
import {
    Activity, Users, AlertTriangle, Clock, Play, Pause,
    Plus, MessageSquare, StopCircle, RefreshCw, Eye,
    TrendingUp, Wifi, WifiOff, Search, Filter, X
} from 'lucide-react';
import { commandCenterService, ExamSession } from '../../services/commandCenterService';
import { MetricsCard } from '../../components/Metrics/MetricsCard';
import { useNavigate } from 'react-router-dom';
import { MeshRouterPanel } from '../runner/professor/MeshRouterPanel';

interface CommandCenterProps {
    onClose?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onClose }) => {
    const navigate = useNavigate();

    // Estados
    const [sessions, setSessions] = useState<ExamSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [globalStats, setGlobalStats] = useState({
        totalActiveSessions: 0,
        totalStudentsConnected: 0,
        totalViolations: 0,
        averageProgress: 0
    });

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
    const [modeFilter, setModeFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

    // Modal de mensagem
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
    const [messageText, setMessageText] = useState('');
    const [messageType, setMessageType] = useState<'INFO' | 'WARNING' | 'ALERT'>('INFO');
    const [showMeshRouter, setShowMeshRouter] = useState(false);

    // Carregar dados
    useEffect(() => {
        loadData();

        // Auto-refresh a cada 10 segundos
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            setRefreshing(true);

            const [sessionsData, overview] = await Promise.all([
                commandCenterService.getActiveSessions(),
                commandCenterService.getGlobalOverview()
            ]);

            setSessions(sessionsData);
            setGlobalStats(overview);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Filtrar sessões
    const filteredSessions = sessions.filter(session => {
        // Filtro de busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            if (
                !session.examTitle.toLowerCase().includes(term) &&
                !session.className.toLowerCase().includes(term)
            ) {
                return false;
            }
        }

        // Filtro de status
        if (statusFilter !== 'ALL' && session.status !== statusFilter) {
            return false;
        }

        // Filtro de modo
        if (modeFilter !== 'ALL' && session.networkMode !== modeFilter) {
            return false;
        }

        return true;
    });

    // Ações
    const handlePause = async (sessionId: string) => {
        if (!confirm('Pausar esta prova?')) return;

        try {
            await commandCenterService.pauseSession(sessionId);
            await loadData();
        } catch (error) {
            alert('Erro ao pausar sessão');
        }
    };

    const handleResume = async (sessionId: string) => {
        try {
            await commandCenterService.resumeSession(sessionId);
            await loadData();
        } catch (error) {
            alert('Erro ao retomar sessão');
        }
    };

    const handleExtendTime = async (sessionId: string) => {
        const minutes = prompt('Estender quantos minutos?', '10');
        if (!minutes) return;

        try {
            await commandCenterService.extendTime(sessionId, parseInt(minutes));
            await loadData();
        } catch (error) {
            alert('Erro ao estender tempo');
        }
    };

    const handleEnd = async (sessionId: string) => {
        if (!confirm('Encerrar esta prova? Esta ação não pode ser desfeita.')) return;

        try {
            await commandCenterService.endSession(sessionId);
            await loadData();
        } catch (error) {
            alert('Erro ao encerrar sessão');
        }
    };

    const handleSendMessage = async () => {
        if (!selectedSession || !messageText.trim()) return;

        try {
            await commandCenterService.broadcastMessage(selectedSession.id, {
                message: messageText,
                type: messageType,
                sentBy: 'coordinator',
                sentAt: new Date()
            });

            setShowMessageModal(false);
            setMessageText('');
            setSelectedSession(null);
        } catch (error) {
            alert('Erro ao enviar mensagem');
        }
    };

    const handleViewDetails = (sessionId: string) => {
        // Navegar para LiveDashboard
        navigate(`/live-dashboard?eventId=${sessionId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Carregando central de comando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Activity className="text-blue-600" size={32} />
                            Central de Comando
                            {refreshing && (
                                <RefreshCw className="text-blue-600 animate-spin" size={20} />
                            )}
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Monitoramento e controle em tempo real de todas as provas ativas
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowMeshRouter(!showMeshRouter)}
                            className={`px-4 py-2 ${showMeshRouter ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'} rounded-xl hover:opacity-90 transition flex items-center gap-2`}
                            title="Configurar Roteador Mesh"
                        >
                            <Wifi size={18} />
                            Logística Mesh
                        </button>
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Atualizar
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-semibold"
                            >
                                Fechar
                            </button>
                        )}
                    </div>
                </div>

                {/* PAINEL DE ROTEADOR MESH */}
                {showMeshRouter && (
                    <div className="mt-6 animate-in slide-in-from-top duration-300">
                        <MeshRouterPanel
                            schoolId="SCHOOL-001" // Em produção, viria do contexto
                            eventId={sessions[0]?.id || 'GLOBAL'}
                        />
                    </div>
                )}
            </div>

            {/* Métricas Globais */}
            <div className="max-w-7xl mx-auto mb-6 grid grid-cols-4 gap-4">
                <MetricsCard
                    title="Provas Ativas"
                    value={globalStats.totalActiveSessions}
                    icon={Activity}
                    color="blue"
                    subtitle="Sessões em andamento"
                />

                <MetricsCard
                    title="Alunos Conectados"
                    value={globalStats.totalStudentsConnected}
                    icon={Users}
                    color="green"
                    subtitle="Total online agora"
                />

                <MetricsCard
                    title="Progresso Médio"
                    value={`${globalStats.averageProgress}%`}
                    icon={TrendingUp}
                    color="violet"
                    subtitle="Média geral"
                />

                <MetricsCard
                    title="Violações"
                    value={globalStats.totalViolations}
                    icon={AlertTriangle}
                    color={globalStats.totalViolations > 10 ? 'red' : 'yellow'}
                    subtitle="Total detectadas"
                />
            </div>

            {/* Filtros */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex gap-4 items-center">
                        {/* Busca */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por prova ou turma..."
                                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Filtro Status */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">Todos Status</option>
                            <option value="ACTIVE">Ativas</option>
                            <option value="PAUSED">Pausadas</option>
                        </select>

                        {/* Filtro Modo */}
                        <select
                            value={modeFilter}
                            onChange={(e) => setModeFilter(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">Todos Modos</option>
                            <option value="ONLINE">Online</option>
                            <option value="OFFLINE">Offline</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid de Sessões */}
            <div className="max-w-7xl mx-auto">
                {filteredSessions.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                        <Activity size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            {searchTerm || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                                ? 'Nenhuma sessão encontrada'
                                : 'Nenhuma prova ativa no momento'}
                        </h3>
                        <p className="text-slate-500">
                            {searchTerm || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                                ? 'Tente ajustar os filtros'
                                : 'As provas ativas aparecerão aqui'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredSessions.map(session => {
                            const timeRemaining = Math.max(
                                0,
                                Math.floor((session.endsAt.getTime() - Date.now()) / 60000)
                            );

                            const progressPercent = session.averageProgress;

                            return (
                                <div
                                    key={session.id}
                                    className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition"
                                >
                                    {/* Header da sessão */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-slate-900">
                                                    {session.examTitle}
                                                </h3>
                                                {session.status === 'ACTIVE' ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                        ATIVA
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                                        PAUSADA
                                                    </span>
                                                )}
                                                {session.networkMode === 'ONLINE' ? (
                                                    <Wifi className="text-blue-600" size={16} />
                                                ) : (
                                                    <WifiOff className="text-amber-600" size={16} />
                                                )}
                                            </div>
                                            <p className="text-slate-600 text-sm">
                                                Turma: {session.className}
                                            </p>
                                        </div>

                                        {/* Ações rápidas */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewDetails(session.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Ver Detalhes"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {session.status === 'ACTIVE' ? (
                                                <button
                                                    onClick={() => handlePause(session.id)}
                                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                                    title="Pausar"
                                                >
                                                    <Pause size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleResume(session.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Retomar"
                                                >
                                                    <Play size={18} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleExtendTime(session.id)}
                                                className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition"
                                                title="Estender Tempo"
                                            >
                                                <Plus size={18} />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedSession(session);
                                                    setShowMessageModal(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Enviar Mensagem"
                                            >
                                                <MessageSquare size={18} />
                                            </button>

                                            <button
                                                onClick={() => handleEnd(session.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Encerrar"
                                            >
                                                <StopCircle size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Métricas da sessão */}
                                    <div className="grid grid-cols-6 gap-4 mb-4">
                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Conectados</p>
                                            <p className="text-xl font-bold text-green-600">
                                                {session.studentsConnected}/{session.studentsTotal}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Completados</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                {session.studentsCompleted}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Progresso</p>
                                            <p className="text-xl font-bold text-violet-600">
                                                {progressPercent}%
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Tempo Rest.</p>
                                            <p className="text-xl font-bold text-slate-700">
                                                {timeRemaining}min
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Violações</p>
                                            <p className={`text-xl font-bold ${session.violationsCount > 5 ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                {session.violationsCount}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Início</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {session.startedAt.toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Barra de progresso */}
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                                            <span>Progresso Médio</span>
                                            <span>{progressPercent}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-violet-500 h-full transition-all duration-500"
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Mensagem */}
            {showMessageModal && selectedSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">
                                Enviar Mensagem
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Para: {selectedSession.examTitle}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Tipo de mensagem */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tipo
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setMessageType('INFO')}
                                        className={`p-3 rounded-lg border-2 transition ${messageType === 'INFO'
                                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                                            : 'border-slate-200'
                                            }`}
                                    >
                                        Info
                                    </button>
                                    <button
                                        onClick={() => setMessageType('WARNING')}
                                        className={`p-3 rounded-lg border-2 transition ${messageType === 'WARNING'
                                            ? 'border-yellow-600 bg-yellow-50 text-yellow-900'
                                            : 'border-slate-200'
                                            }`}
                                    >
                                        Aviso
                                    </button>
                                    <button
                                        onClick={() => setMessageType('ALERT')}
                                        className={`p-3 rounded-lg border-2 transition ${messageType === 'ALERT'
                                            ? 'border-red-600 bg-red-50 text-red-900'
                                            : 'border-slate-200'
                                            }`}
                                    >
                                        Alerta
                                    </button>
                                </div>
                            </div>

                            {/* Mensagem */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Mensagem
                                </label>
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={4}
                                    placeholder="Digite sua mensagem..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowMessageModal(false);
                                    setMessageText('');
                                    setSelectedSession(null);
                                }}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={!messageText.trim()}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommandCenter;
