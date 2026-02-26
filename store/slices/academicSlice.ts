import { StateCreator } from 'zustand';
import { School, SchoolClass, Student, ExamRegistration, ExamResult, StudentProfile, UserProfileExtended, User } from '../../types';
import { AppStore } from '../useAppStore';

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
    }
});
