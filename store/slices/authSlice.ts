import { StateCreator } from 'zustand';
import { User, UserRole, PermissionMatrix, UserProfileExtended, OwlTutorContext } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';

export interface AuthSlice {
    currentUser: User | null;
    selectedChildId: string | null;
    globalPermissions: PermissionMatrix;
    hasConsented: boolean;
    owlTutorContext: OwlTutorContext | null;

    setCurrentUser: (user: User | null) => void;
    updateCurrentUser: (user: User) => void;
    setSelectedChildId: (childId: string | null) => void;
    setHasConsented: (hasConsented: boolean) => void;
    setOwlTutorContext: (context: OwlTutorContext | null) => void;
    updateUserProfile: (profile: UserProfileExtended) => void;
    initIdentity: () => Promise<void>;
    updatePermissions: (matrix: PermissionMatrix) => void;
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
    currentUser: null,
    selectedChildId: null,
    globalPermissions: {} as PermissionMatrix, // Will be initialized in the main store or here
    hasConsented: false,
    owlTutorContext: null,

    setCurrentUser: (user) => set({ currentUser: user }),

    updateCurrentUser: (user) => set((state) => ({
        currentUser: state.currentUser?.id === user.id ? { ...state.currentUser, ...user } : state.currentUser
    })),

    setSelectedChildId: (childId) => set({ selectedChildId: childId }),

    setHasConsented: (val) => set({ hasConsented: val }),

    setOwlTutorContext: (ctx) => set({ owlTutorContext: ctx }),

    updateUserProfile: (profile) => set((state) => ({
        userProfiles: state.userProfiles.map(p => p.userId === profile.userId ? profile : p)
    })),

    updatePermissions: (matrix) => set({ globalPermissions: matrix }),

    initIdentity: async () => {
        console.log("🔐 Initializing Identity...");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                const formattedProfile: User = {
                    id: profile.id,
                    name: profile.name,
                    nickname: profile.nickname,
                    email: profile.email,
                    role: profile.role,
                    tenantId: profile.tenant_id,
                    schoolId: profile.school_id,
                    classIds: profile.class_ids,
                    status: profile.status,
                    subjectIds: profile.subject_ids
                };

                const testProfileRole = localStorage.getItem('test_profile');
                if (testProfileRole) {
                    formattedProfile.role = testProfileRole as any;
                }
                set({ currentUser: formattedProfile });
            }
        }
    }
});
