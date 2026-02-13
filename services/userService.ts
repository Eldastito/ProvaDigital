import { User, UserRole } from '../types';
import { useAppStore } from '../store/useAppStore';
import { uuidv4 } from '../utils/helpers';

/**
 * UserService Facade
 * Centralizes user management logic and validations.
 * Currently bridges to the Zustand store, but ready for direct Supabase/API integration.
 */
export const userService = {
    /**
     * Check if email is already in use by another user
     */
    isEmailTaken: (email: string, excludeId?: string): boolean => {
        if (!email) return false;
        const users = useAppStore.getState().users || [];
        return users.some(u =>
            u.email &&
            u.email.toLowerCase() === email.toLowerCase() &&
            u.id !== excludeId
        );
    },

    /**
     * Format name to Title Case
     */
    formatName: (name: string): string => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    /**
     * Create a new user with validation
     */
    createUser: async (userData: Omit<User, 'id' | 'status' | 'createdAt'>): Promise<User> => {
        if (userService.isEmailTaken(userData.email)) {
            throw new Error('E-mail já cadastrado no sistema.');
        }

        const newUser: User = {
            id: uuidv4(),
            ...userData,
            name: userService.formatName(userData.name),
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };

        // Call Store Action
        useAppStore.getState().addUser(newUser);
        return newUser;
    },

    /**
     * Update existing user
     */
    updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
        const store = useAppStore.getState();
        const existing = store.users.find(u => u.id === id);

        if (!existing) throw new Error('Usuário não encontrado.');

        if (updates.email && userService.isEmailTaken(updates.email, id)) {
            throw new Error('E-mail já em uso por outro usuário.');
        }

        const updatedUser = {
            ...existing,
            ...updates,
            name: updates.name ? userService.formatName(updates.name) : existing.name
        };

        store.updateUser(updatedUser);
        return updatedUser;
    },

    /**
     * Soft delete / Remove user
     */
    deleteUser: async (id: string): Promise<void> => {
        // In a real backend, we might just mark as deleted.
        // For now, we remove from store.
        await useAppStore.getState().deleteUser(id);
    },

    /**
     * Send password reset email
     */
    resetPassword: async (email: string): Promise<void> => {
        const store = useAppStore.getState();
        store.resetUserPassword(email);
        // Here we would trigger Supabase Auth password reset in the future
    }
};
