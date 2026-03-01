import { StateCreator } from 'zustand';
import { School, SchoolClass, Student, ExamRegistration, ExamResult, StudentProfile, UserProfileExtended, User, ProjectionMaterial, InstitutionalEvent } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';

export interface AcademicSlice {
    schools: School[];
    classes: SchoolClass[];
    students: Student[];
    users: User[];
    registrations: ExamRegistration[];
    results: ExamResult[];
    studentProfiles: StudentProfile[];
    userProfiles: UserProfileExtended[];
    selectedUserIds: string[];
    projectionMaterials: ProjectionMaterial[];
    institutionalEvents: InstitutionalEvent[];

    addSchool: (school: School) => Promise<void>;
    updateSchool: (school: School) => Promise<void>;
    deleteSchool: (schoolId: string) => Promise<void>;
    addClass: (cls: SchoolClass) => Promise<void>;
    updateClass: (cls: SchoolClass) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    addStudent: (student: Student) => Promise<void>;
    updateStudent: (student: Student) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    addUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    updateResults: (newResults: ExamResult[]) => void;
    toggleUserSelection: (userId: string) => void;
    clearUserSelection: () => void;
    selectAllVisibleUsers: (userIds: string[]) => void;
    bulkDeleteUsers: (userIds: string[]) => Promise<void>;
    bulkUpdateUserStatus: (userIds: string[], status: 'ACTIVE' | 'BLOCKED') => Promise<void>;
    updateUser: (user: User) => void;
    resetUserPassword: (email: string) => Promise<void>;
    loadSchools: () => Promise<void>;
    loadClasses: () => Promise<void>;
    loadStudents: () => Promise<void>;
    loadUsers: () => Promise<void>;
    loadProjectionMaterials: () => Promise<void>;
    addProjectionMaterial: (material: Omit<ProjectionMaterial, 'id' | 'createdAt'>) => Promise<void>;
    deleteProjectionMaterial: (id: string, ownerId: string) => Promise<void>;
    loadInstitutionalEvents: () => Promise<void>;
    addInstitutionalEvent: (event: Omit<InstitutionalEvent, 'createdAt'>) => Promise<void>;
    deleteInstitutionalEvent: (id: string) => Promise<void>;
}

export const createAcademicSlice: StateCreator<AppStore, [], [], AcademicSlice> = (set, get) => ({
    schools: [],
    classes: [],
    students: [],
    users: [],
    registrations: [],
    results: [],
    studentProfiles: [],
    userProfiles: [],
    selectedUserIds: [],
    projectionMaterials: [],
    institutionalEvents: [],

    addSchool: async (school) => set((state) => ({ schools: [...state.schools, school] })),
    updateSchool: async (school) => set((state) => ({
        schools: state.schools.map(s => s.id === school.id ? school : s)
    })),
    deleteSchool: async (id) => set((state) => ({
        schools: state.schools.filter(s => s.id !== id)
    })),

    addClass: async (cls) => set((state) => ({ classes: [...state.classes, cls] })),
    updateClass: async (cls) => set((state) => ({
        classes: state.classes.map(c => c.id === cls.id ? cls : c)
    })),
    deleteClass: async (id) => set((state) => ({
        classes: state.classes.filter(c => c.id !== id)
    })),

    addStudent: async (student) => set((state) => ({ students: [...state.students, student] })),
    updateStudent: async (student) => set((state) => ({
        students: state.students.map(s => s.id === student.id ? student : s)
    })),
    deleteStudent: async (id) => set((state) => ({
        students: state.students.filter(s => s.id !== id)
    })),

    addUser: async (user) => set((state) => ({ users: [...state.users, user] })),
    deleteUser: async (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
    })),

    updateResults: (newResults) => set({ results: newResults }),

    toggleUserSelection: (userId) => set((state) => ({
        selectedUserIds: state.selectedUserIds.includes(userId)
            ? state.selectedUserIds.filter(id => id !== userId)
            : [...state.selectedUserIds, userId]
    })),

    clearUserSelection: () => set({ selectedUserIds: [] }),

    selectAllVisibleUsers: (userIds) => set({ selectedUserIds: userIds }),

    bulkDeleteUsers: async (ids) => set((state) => ({
        users: state.users.filter(u => !ids.includes(u.id))
    })),

    bulkUpdateUserStatus: async (ids, status) => set((state) => ({
        users: state.users.map(u => ids.includes(u.id) ? { ...u, status } : u)
    })),

    updateUser: (user) => set((state) => ({
        users: state.users.map(u => u.id === user.id ? user : u)
    })),

    resetUserPassword: async (email) => {
        console.log(`Password reset requested for ${email}`);
    },

    loadSchools: async () => {
        const { data, error } = await supabase.from('schools').select('*');
        if (data) set({ schools: data as School[] });
        if (error) console.error("Error loading schools:", error);
    },

    loadClasses: async () => {
        const { data, error } = await supabase.from('classes').select('*');
        if (data) set({ classes: data as SchoolClass[] });
        if (error) console.error("Error loading classes:", error);
    },

    loadStudents: async () => {
        const { data, error } = await supabase.from('students').select('*');
        if (data) set({ students: data as Student[] });
        if (error) console.error("Error loading students:", error);
    },

    loadUsers: async () => {
        const { data, error } = await supabase.from('users').select('*');
        if (data) set({ users: data as User[] });
        if (error) console.error("Error loading users:", error);
    },

    loadProjectionMaterials: async () => {
        const { data, error } = await supabase.from('projection_materials').select('*');
        if (data) {
            const formatted = data.map(item => ({
                id: item.id,
                tenantId: item.tenant_id,
                schoolId: item.school_id,
                ownerId: item.owner_id,
                title: item.title,
                type: item.type as any,
                category: item.category,
                url: item.url,
                thumbnail: item.thumbnail,
                description: item.description,
                createdAt: item.created_at
            })) as ProjectionMaterial[];
            set({ projectionMaterials: formatted });
        }
        if (error) console.error("Error loading projection materials:", error);
    },

    addProjectionMaterial: async (material) => {
        const { data, error } = await supabase.from('projection_materials').insert({
            tenant_id: material.tenantId,
            school_id: material.schoolId,
            owner_id: material.ownerId,
            title: material.title,
            type: material.type,
            category: material.category,
            url: material.url,
            thumbnail: material.thumbnail,
            description: material.description
        }).select().single();

        if (error) {
            console.error("Error adding projection material:", error);
            throw error;
        }

        if (data) {
            const newMaterial: ProjectionMaterial = {
                id: data.id,
                tenantId: data.tenant_id,
                schoolId: data.school_id,
                ownerId: data.owner_id,
                title: data.title,
                type: data.type as any,
                category: data.category,
                url: data.url,
                thumbnail: data.thumbnail,
                description: data.description,
                createdAt: data.created_at
            };
            set(state => ({ projectionMaterials: [...state.projectionMaterials, newMaterial] }));
        }
    },

    deleteProjectionMaterial: async (id, ownerId) => {
        set(state => ({ projectionMaterials: state.projectionMaterials.filter(m => m.id !== id) }));

        const { error } = await supabase.from('projection_materials').delete().eq('id', id).eq('owner_id', ownerId);
        if (error) {
            console.error("Error deleting projection material:", error);
            get().loadProjectionMaterials(); // Revert state on error
            throw error;
        }
    },

    loadInstitutionalEvents: async () => {
        const stored = localStorage.getItem('examepad_institutional_events');
        if (stored) {
            set({ institutionalEvents: JSON.parse(stored) });
        }
    },

    addInstitutionalEvent: async (evt) => {
        const fullEvent = { ...evt, createdAt: new Date().toISOString() } as InstitutionalEvent;
        set(state => {
            const newList = [...state.institutionalEvents, fullEvent];
            localStorage.setItem('examepad_institutional_events', JSON.stringify(newList));
            return { institutionalEvents: newList };
        });
    },

    deleteInstitutionalEvent: async (id) => {
        set(state => {
            const newList = state.institutionalEvents.filter(e => e.id !== id);
            localStorage.setItem('examepad_institutional_events', JSON.stringify(newList));
            return { institutionalEvents: newList };
        });
    }
});
