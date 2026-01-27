/**
 * Network Store
 * 
 * Store global Zustand para gerenciar estado da rede mesh,
 * telemetria, alertas e conectividade.
 * 
 * Sprint 2 - Fase 8
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMeshNetwork, MeshNode } from '../meshNetworkService';
import { getTelemetryService, TelemetryData } from '../telemetryService';
import { getAlertingService, Alert } from '../alertingService';

// Tipos
export interface NetworkState {
    // Conectividade
    isConnected: boolean;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
    connectedNodes: number;
    nodes: MeshNode[];

    // Telemetria
    telemetryData: TelemetryData | null;
    telemetryActive: boolean;

    // Alertas
    alerts: Alert[];
    unreadAlertCount: number;

    // Configuração
    nodeId: string | null;
    nodeName: string | null;
    nodeType: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR' | 'ROUTER' | null;
    eventId: string | null;

    // Estatísticas
    messagesSent: number;
    messagesReceived: number;
    uptime: number;
}

export interface NetworkActions {
    // Conectividade
    updateConnectionStatus: (isConnected: boolean, quality: NetworkState['connectionQuality']) => void;
    updateNodes: (nodes: MeshNode[]) => void;
    addNode: (node: MeshNode) => void;
    removeNode: (nodeId: string) => void;

    // Telemetria
    updateTelemetry: (data: TelemetryData) => void;
    setTelemetryActive: (active: boolean) => void;

    // Alertas
    addAlert: (alert: Alert) => void;
    markAlertAsRead: (alertId: string) => void;
    clearAlerts: () => void;

    // Configuração
    setNodeConfig: (config: { nodeId: string; nodeName: string; nodeType: NetworkState['nodeType']; eventId: string }) => void;

    // Estatísticas
    incrementMessagesSent: () => void;
    incrementMessagesReceived: () => void;
    updateUptime: (uptime: number) => void;

    // Reset
    reset: () => void;
}

export type NetworkStore = NetworkState & NetworkActions;

// Estado inicial
const initialState: NetworkState = {
    isConnected: false,
    connectionQuality: 'offline',
    connectedNodes: 0,
    nodes: [],
    telemetryData: null,
    telemetryActive: false,
    alerts: [],
    unreadAlertCount: 0,
    nodeId: null,
    nodeName: null,
    nodeType: null,
    eventId: null,
    messagesSent: 0,
    messagesReceived: 0,
    uptime: 0
};

/**
 * Store Global de Rede
 * 
 * Gerencia todo o estado da rede mesh de forma centralizada.
 */
export const useNetworkStore = create<NetworkStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // === CONECTIVIDADE ===

            updateConnectionStatus: (isConnected, quality) => {
                set({ isConnected, connectionQuality: quality });
            },

            updateNodes: (nodes) => {
                set({
                    nodes,
                    connectedNodes: nodes.filter(n => n.isConnected).length
                });
            },

            addNode: (node) => {
                const { nodes } = get();
                const existingIndex = nodes.findIndex(n => n.id === node.id);

                if (existingIndex >= 0) {
                    // Atualizar node existente
                    const updatedNodes = [...nodes];
                    updatedNodes[existingIndex] = node;
                    set({
                        nodes: updatedNodes,
                        connectedNodes: updatedNodes.filter(n => n.isConnected).length
                    });
                } else {
                    // Adicionar novo node
                    const newNodes = [...nodes, node];
                    set({
                        nodes: newNodes,
                        connectedNodes: newNodes.filter(n => n.isConnected).length
                    });
                }
            },

            removeNode: (nodeId) => {
                const { nodes } = get();
                const filteredNodes = nodes.filter(n => n.id !== nodeId);
                set({
                    nodes: filteredNodes,
                    connectedNodes: filteredNodes.filter(n => n.isConnected).length
                });
            },

            // === TELEMETRIA ===

            updateTelemetry: (data) => {
                set({ telemetryData: data });
            },

            setTelemetryActive: (active) => {
                set({ telemetryActive: active });
            },

            // === ALERTAS ===

            addAlert: (alert) => {
                const { alerts } = get();
                const newAlerts = [alert, ...alerts];
                const unreadCount = newAlerts.filter(a => !a.read).length;

                set({
                    alerts: newAlerts,
                    unreadAlertCount: unreadCount
                });
            },

            markAlertAsRead: (alertId) => {
                const { alerts } = get();
                const updatedAlerts = alerts.map(a =>
                    a.id === alertId ? { ...a, read: true } : a
                );
                const unreadCount = updatedAlerts.filter(a => !a.read).length;

                set({
                    alerts: updatedAlerts,
                    unreadAlertCount: unreadCount
                });
            },

            clearAlerts: () => {
                set({ alerts: [], unreadAlertCount: 0 });
            },

            // === CONFIGURAÇÃO ===

            setNodeConfig: (config) => {
                set({
                    nodeId: config.nodeId,
                    nodeName: config.nodeName,
                    nodeType: config.nodeType,
                    eventId: config.eventId
                });
            },

            // === ESTATÍSTICAS ===

            incrementMessagesSent: () => {
                set((state) => ({ messagesSent: state.messagesSent + 1 }));
            },

            incrementMessagesReceived: () => {
                set((state) => ({ messagesReceived: state.messagesReceived + 1 }));
            },

            updateUptime: (uptime) => {
                set({ uptime });
            },

            // === RESET ===

            reset: () => {
                set(initialState);
            }
        }),
        {
            name: 'network-storage', // Nome da chave no localStorage
            partialize: (state) => ({
                // Persistir apenas configurações, não dados temporários
                nodeId: state.nodeId,
                nodeName: state.nodeName,
                nodeType: state.nodeType,
                eventId: state.eventId,
                messagesSent: state.messagesSent,
                messagesReceived: state.messagesReceived
            })
        }
    )
);

/**
 * Hook para sincronizar store com services
 */
export function useNetworkSync() {
    const updateConnectionStatus = useNetworkStore(state => state.updateConnectionStatus);
    const updateNodes = useNetworkStore(state => state.updateNodes);
    const addNode = useNetworkStore(state => state.addNode);
    const removeNode = useNetworkStore(state => state.removeNode);
    const updateTelemetry = useNetworkStore(state => state.updateTelemetry);
    const addAlert = useNetworkStore(state => state.addAlert);
    const incrementMessagesReceived = useNetworkStore(state => state.incrementMessagesReceived);
    const updateUptime = useNetworkStore(state => state.updateUptime);

    // Sincronizar com meshNetwork
    const syncMesh = () => {
        const mesh = getMeshNetwork();
        const stats = mesh.getStats();

        // Atualizar conectividade
        const isConnected = stats.connectedNodes > 0;
        let quality: NetworkState['connectionQuality'] = 'offline';

        if (stats.connectedNodes >= 3) quality = 'excellent';
        else if (stats.connectedNodes >= 2) quality = 'good';
        else if (stats.connectedNodes === 1) quality = 'fair';
        else quality = 'offline';

        updateConnectionStatus(isConnected, quality);
        updateUptime(stats.uptime);

        // Atualizar nodes
        const nodes = mesh.getConnectedNodes();
        updateNodes(nodes);
    };

    // Sincronizar com telemetry
    const syncTelemetry = () => {
        const telemetry = getTelemetryService();
        const currentData = telemetry.getCurrentData();

        if (currentData) {
            updateTelemetry(currentData);
        }
    };

    // Sincronizar com alerting
    const syncAlerts = () => {
        const alerting = getAlertingService();
        const allAlerts = alerting.getAllAlerts();

        // Substituir alertas completamente
        useNetworkStore.setState({
            alerts: allAlerts,
            unreadAlertCount: alerting.getUnreadCount()
        });
    };

    // Configurar callbacks dos services
    const setupCallbacks = () => {
        const mesh = getMeshNetwork();
        const alerting = getAlertingService();

        // Callback quando node entra
        mesh.setOnNodeJoined((node) => {
            addNode(node);
        });

        // Callback quando node sai
        mesh.setOnNodeLeft((nodeId) => {
            removeNode(nodeId);
        });

        // Callback quando mensagem recebida
        mesh.setOnMessageReceived((message) => {
            incrementMessagesReceived();

            // Se for telemetria, atualizar
            if (message.type === 'TELEMETRY') {
                syncTelemetry();
            }
        });

        // Callback quando alerta recebido
        alerting.setOnAlertReceived((alert) => {
            addAlert(alert);
        });
    };

    return {
        syncMesh,
        syncTelemetry,
        syncAlerts,
        setupCallbacks
    };
}

/**
 * Selectors úteis
 */
export const selectIsOnline = (state: NetworkStore) => state.isConnected;
export const selectConnectionQuality = (state: NetworkStore) => state.connectionQuality;
export const selectUnreadAlerts = (state: NetworkStore) =>
    state.alerts.filter(a => !a.read);
export const selectStudentNodes = (state: NetworkStore) =>
    state.nodes.filter(n => n.type === 'STUDENT');
export const selectProfessorNodes = (state: NetworkStore) =>
    state.nodes.filter(n => n.type === 'PROFESSOR');
