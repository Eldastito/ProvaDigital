import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppState, School, SchoolClass, Student, User, UserRole, SchoolResources } from '../../../types';
import { uuidv4 } from '../../../utils/helpers';
import { useSafeAppStore } from '../../../store/useAppStore';
import { MOCK_TENANT_ID } from '../../../utils/mockData';

export type ManagementTab = 'SCHOOLS' | 'CLASSES' | 'STUDENTS' | 'PROFESSORES' | 'RESPONSAVEIS' | 'USERS' | 'COMMAND_CENTER' | 'SETTINGS' | 'BATCH_IMPORT' | 'HIERARCHY' | 'TENANT_SETTINGS' | 'KNOWLEDGE_VAULT' | 'MACRO_CALENDAR';

export const useSchoolManagement = () => {
    const state = useSafeAppStore();
    const {
        addSchool: onAddSchool,
        addClass: onAddClass,
        addStudent: onAddStudent,
        addUser: onAddUser,
        updateUser: onUpdateUser,
        resetUserPassword: onResetPassword,
        updateSettings: onUpdateSettings
    } = state;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as ManagementTab) || 'SCHOOLS';
    const setActiveTab = (tab: ManagementTab) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);
    const batchSchoolInputRef = useRef<HTMLInputElement>(null);

    const currentUser = state.currentUser;
    const userSchoolId = currentUser?.schoolId;
    const isTenantAdmin = currentUser?.role === UserRole.TENANT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.SYSTEM_ADMIN || currentUser?.role === UserRole.MASTER_SAAS;
    const isDirector = currentUser?.role === UserRole.DIRETOR || currentUser?.role === UserRole.SUPERVISOR;
    const currentTenantId = currentUser?.tenantId || MOCK_TENANT_ID;

    // --- DATA FILTERING (ISOLATION) ---
    const visibleSchools = isTenantAdmin
        ? state.schools
        : state.schools.filter(s => s.id === userSchoolId || (!userSchoolId && s.tenantId === currentTenantId));

    useEffect(() => {
        console.log("🔍 School Management Data Debug:", {
            role: currentUser?.role,
            userSchoolId,
            currentTenantId,
            totalSchools: state.schools.length,
            visibleSchoolsCount: visibleSchools.length,
            isTenantAdmin,
            isDirector
        });
    }, [currentUser, userSchoolId, currentTenantId, state.schools.length, visibleSchools.length]);

    const visibleClasses = isTenantAdmin ? state.classes : state.classes.filter(c => c.schoolId === userSchoolId || (!userSchoolId && visibleSchools.some(s => s.id === c.schoolId)));

    // SSOT: Derive students and users by role from the central users collection
    const visibleUsers = (isTenantAdmin ? state.users : state.users.filter(u => u.schoolId === userSchoolId))
        .filter(u => u.role !== UserRole.ALUNO); // Geral list excludes students for clarity if they have their own tab

    const visibleStudents = (isTenantAdmin ? state.users : state.users.filter(u => u.schoolId === userSchoolId))
        .filter(u => u.role === UserRole.ALUNO);

    // Permissions (Hardening)
    const canManageUsers = isTenantAdmin || isDirector || state.globalPermissions[currentUser?.role || '']?.USER_DATA?.includes('EDIT');

    // Form States
    const [schoolForm, setSchoolForm] = useState<{ name: string, inep: string, resources: SchoolResources }>({
        name: '',
        inep: '',
        resources: {
            funding: false, uniforms: false, textbooks: false, adminMaterials: false,
            extracurricular: false, internet: false, lab: false, accessibility: false, food: false,
            transportation: false, security: false, ac_cooling: false
        }
    });
    const [classForm, setClassForm] = useState({ name: '', series: '', shift: 'MANHA', schoolId: userSchoolId || '', room: '' });
    const [studentForm, setStudentForm] = useState({ name: '', reg: '', classId: '' });
    const [userForm, setUserForm] = useState<{ name: string, email: string, role: UserRole, schoolId: string, classIds: string[] }>({ name: '', email: '', role: UserRole.PROFESSOR, schoolId: userSchoolId || '', classIds: [] });

    // --- PERSISTENCE ---
    const STORAGE_KEY = `mgmt_draft_${currentTenantId}_${currentUser?.id}`;

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.schoolForm) setSchoolForm(parsed.schoolForm);
                if (parsed.classForm) setClassForm(parsed.classForm);
                if (parsed.studentForm) setStudentForm(parsed.studentForm);
                if (parsed.userForm) setUserForm(parsed.userForm);
            } catch (e) {
                console.error("Failed to load management drafts", e);
            }
        }
    }, [currentTenantId, currentUser?.id]);

    useEffect(() => {
        const draft = { schoolForm, classForm, studentForm, userForm };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [schoolForm, classForm, studentForm, userForm]);

    // AUTO-LOAD on MOUNT (Academic Data)
    useEffect(() => {
        state.loadRemoteData?.();
    }, []);

    // --- BATCH UPLOAD SCHOOLS ---
    const handleBatchSchoolImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            let successCount = 0;

            lines.forEach((line, idx) => {
                if (idx === 0) return; // Skip Header
                const parts = line.split(';');
                if (parts.length >= 2) {
                    const schoolName = parts[0]?.trim();
                    const inep = parts[1]?.trim();

                    if (schoolName && inep) {
                        const newSchoolId = uuidv4();
                        // 1. Create School (Default resources false)
                        onAddSchool({
                            id: newSchoolId,
                            tenantId: currentTenantId,
                            name: schoolName,
                            inep: inep,
                            resources: { funding: false, uniforms: false, textbooks: false, adminMaterials: false, extracurricular: false, internet: false, lab: false, accessibility: false, food: false, transportation: false, security: false, ac_cooling: false }
                        });
                        successCount++;
                    }
                }
            });
            alert(`Processamento concluído! ${successCount} escolas importadas.`);
        };
        reader.readAsText(file);
        if (batchSchoolInputRef.current) batchSchoolInputRef.current.value = '';
    };

    const downloadTemplate = () => {
        const content = "NOME_ESCOLA;INEP;NOME_GESTOR;EMAIL_GESTOR;FUNCAO_GESTOR\nEscola Municipal Exemplo;12345678;Joao Silva;joao@escola.com;DIRETOR";
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "modelo_carga_escolas.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const resetForms = () => {
        setSchoolForm({
            name: '',
            inep: '',
            resources: { funding: false, uniforms: false, textbooks: false, adminMaterials: false, extracurricular: false, internet: false, lab: false, accessibility: false, food: false, transportation: false, security: false, ac_cooling: false }
        });
        setClassForm({ name: '', series: '', shift: 'MANHA', schoolId: userSchoolId || '', room: '' });
        setStudentForm({ name: '', reg: '', classId: '' });
        setUserForm({ name: '', email: '', role: UserRole.PROFESSOR, schoolId: userSchoolId || '', classIds: [] });
    };

    const handleSubmit = () => {
        if (!canManageUsers) return alert('Você não tem permissão para realizar esta operação.');

        if (activeTab === 'SCHOOLS') {
            if (!schoolForm.name) return alert('Nome obrigatório');

            if (editingSchool) {
                state.updateSchool({
                    ...editingSchool,
                    name: schoolForm.name,
                    inep: schoolForm.inep,
                    resources: schoolForm.resources
                });
            } else {
                const newSchoolId = uuidv4();
                onAddSchool({
                    id: newSchoolId,
                    tenantId: currentTenantId,
                    name: schoolForm.name,
                    inep: schoolForm.inep,
                    resources: schoolForm.resources
                });

                // NOVO: Se o usuário é Diretor/Gestor e não tem escola vinculada ainda, vincular automaticamente
                if (isDirector && !userSchoolId && currentUser) {
                    onUpdateUser({
                        ...currentUser,
                        schoolId: newSchoolId
                    });
                    state.setCurrentUser({
                        ...currentUser,
                        schoolId: newSchoolId
                    });
                }
            }
        } else if (activeTab === 'CLASSES') {
            if (!classForm.name || !classForm.schoolId) return alert('Campos obrigatórios');

            if (editingClass) {
                state.updateClass({
                    ...editingClass,
                    schoolId: classForm.schoolId,
                    name: classForm.name,
                    series: classForm.series,
                    shift: classForm.shift as any,
                    room: classForm.room
                });
            } else {
                onAddClass({
                    id: uuidv4(),
                    schoolId: classForm.schoolId,
                    name: classForm.name,
                    series: classForm.series,
                    shift: classForm.shift as any,
                    room: classForm.room
                });
            }
        } else if (activeTab === 'STUDENTS') {
            if (!studentForm.name || !studentForm.classId) return alert('Campos obrigatórios');
            const selectedClass = state.classes.find(c => c.id === studentForm.classId);

            if (editingStudent) {
                state.updateStudent({
                    id: editingStudent.id,
                    tenantId: editingStudent.tenantId,
                    schoolId: selectedClass?.schoolId || editingStudent.schoolId,
                    classId: studentForm.classId,
                    name: studentForm.name,
                    registrationNumber: studentForm.reg
                });
            } else {
                onAddStudent({
                    id: uuidv4(),
                    tenantId: currentTenantId,
                    schoolId: selectedClass?.schoolId || '',
                    classId: studentForm.classId,
                    name: studentForm.name,
                    registrationNumber: studentForm.reg
                });
            }
        } else if (activeTab === 'USERS') {
            if (!userForm.name || !userForm.email) return alert('Campos obrigatórios');
            if (editingUser) {
                onUpdateUser({
                    ...editingUser,
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    schoolId: userForm.role === UserRole.TENANT_ADMIN || userForm.role === UserRole.SUPER_ADMIN ? undefined : userForm.schoolId,
                    classIds: userForm.classIds,
                    tenantId: currentTenantId
                });
            } else {
                onAddUser({
                    id: uuidv4(),
                    tenantId: currentTenantId,
                    schoolId: userForm.role === UserRole.TENANT_ADMIN || userForm.role === UserRole.SUPER_ADMIN ? undefined : userForm.schoolId,
                    classIds: userForm.classIds,
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    status: 'ACTIVE'
                });
            }
        }
        setIsModalOpen(false);
        resetForms();
        setEditingUser(null);
    };

    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (activeTab !== 'STUDENTS' && activeTab !== 'BATCH_IMPORT') return alert('Importação via CSV disponível apenas para Alunos neste momento.');

        const targetClassId = prompt("Digite o ID da Turma para importar estes alunos (copie da lista de turmas):");
        if (!targetClassId) return;
        const targetClass = visibleClasses.find(c => c.id === targetClassId);
        if (!targetClass) return alert("Turma não encontrada ou você não tem acesso a ela.");

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            let count = 0;
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const name = parts[0].trim();
                    const reg = parts[1].trim();
                    if (name && reg) {
                        onAddStudent({
                            id: uuidv4(),
                            tenantId: currentTenantId,
                            schoolId: targetClass.schoolId,
                            classId: targetClass.id,
                            name: name,
                            registrationNumber: reg
                        });
                        count++;
                    }
                }
            });
            alert(`Sucesso! ${count} alunos importados para a turma ${targetClass.name}.`);
        };
        reader.readAsText(file);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    const openModal = (item?: any, type?: 'SCHOOL' | 'USER' | 'STUDENT' | 'CLASS') => {
        if (activeTab === 'SCHOOLS' && item) {
            setEditingSchool(item);
            setSchoolForm({
                name: item.name,
                inep: item.inep,
                resources: item.resources || { funding: false, uniforms: false, textbooks: false, adminMaterials: false, extracurricular: false, internet: false, lab: false, accessibility: false, food: false, transportation: false, security: false, ac_cooling: false }
            });
        } else if (activeTab === 'USERS' && type === 'USER' && item) {
            setEditingUser(item);
            setUserForm({
                name: item.name,
                email: item.email,
                role: item.role,
                schoolId: item.schoolId || '',
                classIds: item.classIds || []
            });
        } else if (activeTab === 'CLASSES' && type === 'CLASS' && item) {
            setEditingClass(item);
            setClassForm({
                name: item.name,
                series: item.series,
                shift: item.shift,
                schoolId: item.schoolId,
                room: item.room || ''
            });
        } else if (activeTab === 'STUDENTS' && type === 'STUDENT' && item) {
            setStudentForm({
                name: item.name,
                reg: item.registrationNumber,
                classId: item.classId
            });
            setEditingStudent(item);
        } else {
            resetForms();
            setEditingUser(null);
            setEditingStudent(null);
            setEditingSchool(null);
            setEditingClass(null);
        }
        setIsModalOpen(true);
    };

    // User Actions
    const handleToggleBlock = (u: User) => {
        const newStatus = u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        if (confirm(`Deseja realmente ${newStatus === 'BLOCKED' ? 'bloquear' : 'desbloquear'} o usuário ${u.name}?`)) {
            onUpdateUser({ ...u, status: newStatus });
        }
    };

    const handleResetPassword = (email: string) => {
        if (confirm(`Enviar email de redefinição de senha para ${email}?`)) {
            onResetPassword(email);
        }
    };

    const handleDelete = async (id: string, type: 'SCHOOL' | 'CLASS' | 'STUDENT' | 'USER', name: string) => {
        if (confirm(`Tem certeza que deseja EXCLUIR ${type === 'SCHOOL' ? 'a escola' : type === 'CLASS' ? 'a turma' : type === 'STUDENT' ? 'o aluno' : 'o usuário'} "${name}"? Esta ação não pode ser desfeita.`)) {
            if (type === 'SCHOOL') {
                await state.deleteSchool(id);
            } else if (type === 'CLASS') {
                await state.deleteClass(id);
            } else if (type === 'STUDENT') {
                await state.deleteStudent(id);
            } else if (type === 'USER') {
                await state.deleteUser(id);
            }
        }
    };

    return {
        // State
        activeTab, setActiveTab,
        isModalOpen, setIsModalOpen,
        editingUser,
        editingStudent,
        editingSchool,
        editingClass,
        schoolForm, setSchoolForm,
        classForm, setClassForm,
        studentForm, setStudentForm,
        userForm, setUserForm,
        // Utils / Computed
        currentUser,
        currentTenantId,
        userSchoolId,
        isTenantAdmin,
        isDirector,
        visibleSchools,
        visibleClasses,
        visibleStudents,
        visibleUsers,
        canManageUsers,
        state,
        // Refs
        csvInputRef,
        batchSchoolInputRef,
        // Handlers
        handleBatchSchoolImport,
        downloadTemplate,
        handleSubmit,
        handleCsvImport,
        resetForms,
        openModal,
        handleToggleBlock,
        handleResetPassword,
        handleDelete,
        onUpdateSettings
    };
};
