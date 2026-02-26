import { StateCreator } from 'zustand';
import { AppStore } from '../useAppStore';

export interface SystemSlice {
    isInitialized: boolean;
    identityKeys: any | null;
    events: any[];
    owlSessions: any[];
    liveAlerts: any[];
    realtimeChannel: any | null;

    setInitialized: (val: boolean) => void;
    setIdentityKeys: (keys: any) => void;
    broadcastEvent: (event: any) => void;
    loadRemoteData: () => Promise<void>;
}

export const createSystemSlice: StateCreator<AppStore, [], [], SystemSlice> = (set, get) => ({
    isInitialized: false,
    identityKeys: null,
    events: [],
    owlSessions: [],
    liveAlerts: [],
    realtimeChannel: null,

    setInitialized: (val) => set({ isInitialized: val }),
    setIdentityKeys: (keys) => set({ identityKeys: keys }),
    broadcastEvent: (event) => set((state) => ({ events: [...state.events, event] })),

    loadRemoteData: async () => {
        console.log("🔄 Sincronizando dados globais...");
        // TODO: Mapear loaders dos outros slices aqui
        set({ isInitialized: true });
    }
});
