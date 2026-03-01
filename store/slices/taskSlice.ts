import { StateCreator } from 'zustand';
import { AppStore } from '../useAppStore';

export interface ActionableTask {
    id: string;
    title: string;
    description: string;
    type: 'PEDAGOGICAL' | 'STRATEGIC' | 'OPERATIONAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
    actionLabel?: string;
    actionRoute?: string;
    metadata?: any;
    createdAt: string;
}

export interface TaskSlice {
    tasks: ActionableTask[];
    addTask: (task: Omit<ActionableTask, 'id' | 'createdAt' | 'status'>) => void;
    completeTask: (taskId: string) => void;
    dismissTask: (taskId: string) => void;
    loadTasks: () => Promise<void>;
}

export const createTaskSlice: StateCreator<AppStore, [], [], TaskSlice> = (set, get) => ({
    tasks: [],

    addTask: (taskData) => {
        const newTask: ActionableTask = {
            ...taskData,
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        set((state) => ({
            tasks: [newTask, ...state.tasks]
        }));
    },

    completeTask: (taskId) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t)
        }));
    },

    dismissTask: (taskId) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'DISMISSED' } : t)
        }));
    },

    loadTasks: async () => {
        // Mock loading or connect to Supabase later
        console.log("Loading actionable tasks...");
    }
});
