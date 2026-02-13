import { User, UserRole, Student, SchoolClass, Tenant } from '../types';
import { enrollmentService } from './enrollmentService';
import { supabase } from './supabaseClient';

/**
 * UserMigrationService
 * Sincroniza dados legados e garante consistência entre Users e Students
 */
export const userMigrationService = {
    /**
     * Executa o backfill de dados
     */
    syncLegacyData: async (
        users: User[],
        students: Student[],
        tenants: Tenant[]
    ): Promise<{ updatedUsers: User[], updatedStudents: Student[] }> => {
        console.log('🔄 Iniciando sincronização de dados legados...');

        const updatedUsers = [...users];
        const updatedStudents = [...students];
        let changesCount = 0;

        // 1. Garantir Matrícula e Vínculo para todo ALUNO
        for (const user of updatedUsers) {
            if (user.role === UserRole.ALUNO) {
                // Se o usuário aluno não tem matrícula no objeto User
                if (!user.registrationNumber) {
                    const tenant = tenants.find(t => t.id === user.tenantId);
                    user.registrationNumber = enrollmentService.generateRegistrationNumber(tenant?.type || 'PUBLIC_MUNICIPAL');
                    changesCount++;
                }

                // Verificar se existe registro em Students para este User (UUID deve ser o mesmo)
                const studentMatch = updatedStudents.find(s => s.id === user.id);

                if (!studentMatch) {
                    // Criar registro de estudante faltante
                    const newStudent: Student = {
                        id: user.id,
                        name: user.name,
                        registrationNumber: user.registrationNumber || '',
                        classId: user.classIds?.[0] || '',
                        schoolId: user.schoolId || '',
                        tenantId: user.tenantId
                    };
                    updatedStudents.push(newStudent);
                    changesCount++;
                    console.log(`➕ Criado registro de estudante para: ${user.name}`);
                } else {
                    // Sincronizar dados se houver discrepância
                    if (studentMatch.registrationNumber !== user.registrationNumber) {
                        studentMatch.registrationNumber = user.registrationNumber || '';
                        changesCount++;
                    }
                    if (studentMatch.name !== user.name) {
                        studentMatch.name = user.name;
                        changesCount++;
                    }
                }
            }
        }

        console.log(`✅ Sincronização concluída. ${changesCount} alterações detectadas.`);
        return { updatedUsers, updatedStudents };
    },

    /**
     * Persiste as alterações no Supabase (Batch update manual simulado)
     */
    persistMigration: async (updatedUsers: User[]) => {
        for (const user of updatedUsers) {
            if (user.registrationNumber) {
                await supabase.from('users').update({
                    registration_number: user.registrationNumber,
                    phone: user.phone,
                    class_ids: user.classIds,
                    school_id: user.schoolId
                }).eq('id', user.id);
            }
        }
        console.log('✅ Migração de usuários persistida em users table.');
    }
};
