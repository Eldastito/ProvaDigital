import { StateCreator } from 'zustand';
import { LogisticsAsset, LogisticsCase, LogisticsSeal, CustodyTransfer, LogisticsIncident, TabletLogistics, LogisticsAuditEntry } from '../../types';
import { AppStore } from '../useAppStore';

export interface LogisticsSlice {
    logisticsAssets: LogisticsAsset[];
    logisticsCases: LogisticsCase[];
    logisticsSeals: LogisticsSeal[];
    custodyTransfers: CustodyTransfer[];
    logisticsIncidents: LogisticsIncident[];
    logisticsTablets: TabletLogistics[];
    logisticsAudit: LogisticsAuditEntry[];

    addLogisticsCase: (lgCase: LogisticsCase) => Promise<void>;
    updateCaseStatus: (id: string, status: LogisticsCase['status']) => Promise<void>;
    addCustodyTransfer: (transfer: CustodyTransfer) => Promise<void>;
    addLogisticsIncident: (incident: LogisticsIncident) => Promise<void>;
    loadLogisticsData: () => Promise<void>;
}

export const createLogisticsSlice: StateCreator<AppStore, [], [], LogisticsSlice> = (set, get) => ({
    logisticsAssets: [],
    logisticsCases: [],
    logisticsSeals: [],
    custodyTransfers: [],
    logisticsIncidents: [],
    logisticsTablets: [],
    logisticsAudit: [],

    addLogisticsCase: async (lgCase) => set((state) => ({ logisticsCases: [...state.logisticsCases, lgCase] })),
    updateCaseStatus: async (id, status) => {
        // ...
    },
    addCustodyTransfer: async (transfer) => set((state) => ({ custodyTransfers: [...state.custodyTransfers, transfer] })),
    addLogisticsIncident: async (incident) => set((state) => ({ logisticsIncidents: [...state.logisticsIncidents, incident] })),
    loadLogisticsData: async () => {
        // ...
    }
});
