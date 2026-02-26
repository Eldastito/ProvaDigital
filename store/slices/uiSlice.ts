import { StateCreator } from 'zustand';
import { AppSettings } from '../../types';
import { AppStore } from '../useAppStore';

export interface UISlice {
    settings: AppSettings;
    toggleTheme: () => void;
    updateSettings: (settings: AppSettings) => void;
}

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set, get) => ({
    settings: { rankingEnabled: true, rankingAnonymity: 'NOMINAL', theme: 'light' },

    toggleTheme: () => {
        set((state) => {
            const newTheme = (state.settings.theme === 'light' ? 'dark' : 'light') as 'light' | 'dark';
            const updatedSettings = { ...state.settings, theme: newTheme };

            localStorage.setItem('examepad_theme', newTheme);

            const updatedUser = state.currentUser ? { ...state.currentUser, theme: newTheme } : null;

            return {
                settings: updatedSettings,
                currentUser: updatedUser
            };
        });
    },

    updateSettings: (settings) => set({ settings }),
});
