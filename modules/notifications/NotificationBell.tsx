import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, AlertTriangle, Calendar, CheckCircle, Info } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '../../services/alertService';
import { useAppStore } from '../../store/useAppStore';

export const NotificationBell = () => {
    const { currentUser } = useAppStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Carrega notificações
    useEffect(() => {
        if (!currentUser) return;
        loadNotifications();

        // Atualiza a cada 30 segundos
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Fecha painel ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const loadNotifications = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await getUserNotifications(currentUser.id);
            setNotifications(data);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!currentUser) return;
        try {
            await markAllNotificationsAsRead(currentUser.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'RISK_ALERT':
                return <AlertTriangle size={18} className="text-red-500" />;
            case 'INTERVENTION_DUE':
                return <Calendar size={18} className="text-orange-500" />;
            case 'INTERVENTION_COMPLETED':
                return <CheckCircle size={18} className="text-green-500" />;
            default:
                return <Info size={18} className="text-blue-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    if (!currentUser) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Botão do Sino */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-full transition"
                title="Notificações"
            >
                <Bell size={22} className="text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Painel de Notificações */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                        <div>
                            <h3 className="font-bold text-slate-800">Notificações</h3>
                            <p className="text-xs text-slate-500">
                                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    title="Marcar todas como lidas"
                                >
                                    <CheckCheck size={14} />
                                    Marcar todas
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Lista de Notificações */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
                                Carregando...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium">Nenhuma notificação</p>
                                <p className="text-sm mt-1">Você está em dia!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 transition cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''
                                            }`}
                                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            {/* Ícone */}
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getIcon(notification.type)}
                                            </div>

                                            {/* Conteúdo */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-slate-400">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                        >
                                                            <Check size={12} />
                                                            Marcar como lida
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer (opcional) */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // TODO: Navegar para página de todas as notificações
                                }}
                                className="text-xs text-brand-primary hover:text-brand-dark font-medium w-full text-center"
                            >
                                Ver todas as notificações
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
