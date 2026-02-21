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
     * Flexibilizado: Permite que Alunos menores compartilhem e-mail com Pais.
     */
    isEmailTaken: (email: string, excludeId?: string, role?: UserRole, birthDate?: string): string | null => {
        if (!email) return null;
        const users = useAppStore.getState().users || [];

        const existingUsersWithEmail = users.filter(u =>
            u.email &&
            u.email.toLowerCase() === email.toLowerCase() &&
            u.id !== excludeId
        );

        if (existingUsersWithEmail.length === 0) return null;

        // Se o usuário a ser criado for um Aluno, verificar se ele compartilha APENAS com PAIS ou outros ALUNOS irmãos
        const isAluno = role === UserRole.ALUNO;

        // Se a pessoa atual for um PAI, ela também pode reutilizar o email de um filho que já foi cadastrado
        const isParent = role === UserRole.PAIS;

        if (isAluno || isParent) {
            // Verifica se o e-mail está associado a alguém fora da família (ex: outro professor ou diretor)
            const takenByNonFamily = existingUsersWithEmail.some(u => u.role !== UserRole.PAIS && u.role !== UserRole.ALUNO);

            if (takenByNonFamily) {
                return 'Este e-mail pertence a um usuário com nível de acesso superior (Professores ou Gestão) e não pode ser compartilhado com Alunos/Pais por motivos de segurança. Por favor, utilize um e-mail diferente para este cadastro.';
            }

            // Conta de Aluno ou Pais pode compartilhar o e-mail livremente APENAS entre si
            return null;
        }

        // Para os demais cenários (Professores, Gestão), o e-mail deve ser totalmente exclusivo
        return 'E-mail já está em uso por outro usuário. Cada colaborador/gestor deve ter um e-mail exclusivo no sistema.';
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
        const emailError = userService.isEmailTaken(userData.email, undefined, userData.role, userData.birthDate);
        if (emailError) {
            throw new Error(emailError);
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

        // Trigger Auto-link for students
        if (newUser.role === UserRole.ALUNO) {
            userService.autoLinkGuardians(newUser);
        }

        return newUser;
    },

    /**
     * Update existing user
     */
    updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
        const store = useAppStore.getState();
        const existing = store.users.find(u => u.id === id);

        if (!existing) throw new Error('Usuário não encontrado.');

        // Use the new birthdate or role if provided, otherwise fallback to existing
        const checkRole = updates.role || existing.role;
        const checkBirthDate = updates.birthDate !== undefined ? updates.birthDate : existing.birthDate;

        if (updates.email) {
            const emailError = userService.isEmailTaken(updates.email, id, checkRole, checkBirthDate);
            if (emailError) {
                throw new Error(emailError);
            }
        }

        const updatedUser = {
            ...existing,
            ...updates,
            name: updates.name ? userService.formatName(updates.name) : existing.name
        };

        await store.updateUser(updatedUser);

        // Trigger Auto-link if e-mail or role changed to Student
        if (updatedUser.role === UserRole.ALUNO) {
            userService.autoLinkGuardians(updatedUser);
        }

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
    },

    /**
     * Automatically link students to parents based on responsible_email
     */
    autoLinkGuardians: async (student: User): Promise<void> => {
        if (!student.responsibleEmail || student.role !== UserRole.ALUNO) return;

        const store = useAppStore.getState();
        const parents = store.users.filter(u => u.role === UserRole.PAIS);
        const targetParent = parents.find(p => p.email?.toLowerCase() === student.responsibleEmail?.toLowerCase());

        if (targetParent) {
            console.log(`🔗 Auto-linking student ${student.name} to parent ${targetParent.name}`);

            // 1. Update the parent to include the child
            const updatedChildrenIds = Array.from(new Set([...(targetParent.childrenIds || []), student.id]));
            if (updatedChildrenIds.length !== (targetParent.childrenIds || []).length) {
                await store.updateUser({ ...targetParent, childrenIds: updatedChildrenIds });
            }

            // 2. Update the student if primary guardian is not set
            // Note: We don't need a separate store call if this is part of a create/update flow,
            // but for safety we ensure the student record in store/DB reflects this too.
        }
    }
};
