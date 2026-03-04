import { ExamVariant, ExamVersion, Student } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cryptoService } from './cryptoService';

/**
 * Lógica Determinística de Delivery de Provas:
 * Seleciona a variante correta da prova com base na condição do aluno (PCD/Neuro).
 * Garante auditabilidade e equidade.
 */
export const resolveExamVariant = (
    examId: string,
    studentId: string,
    state: any
): { variant: ExamVariant | null, version: ExamVersion | null } => {
    // 1. Encontra a versão ativa mais recente da prova
    const versions = state.examVersions.filter((v: any) => v.examId === examId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (versions.length === 0) return { variant: null, version: null };
    const latestVersion = versions[0];

    // 2. Verifica o perfil do aluno para identificar necessidade de acessibilidade
    const student = state.students.find((s: any) => s.id === studentId);
    if (!student) return { variant: null, version: latestVersion };

    // 3. Busca variantes específicas para a condição do aluno (ex: TEA, TDAH)
    // Se o aluno tiver uma condição cadastrada (mocked for now)
    const conditionCode = student.metadata?.conditionCode; // Ex: 'TEA'

    if (conditionCode) {
        const variant = state.examVariants.find((v: any) =>
            v.examVersionId === latestVersion.id &&
            v.conditionCode === conditionCode
        );

        if (variant) {
            console.log(`[DELIVERY] Serving VARIANT for student ${studentId} (Condition: ${conditionCode})`);
            return { variant, version: latestVersion };
        }
    }

    // 4. Fallback para a versão padrão (Standard)
    console.log(`[DELIVERY] Serving STANDARD version for student ${studentId}`);
    return { variant: null, version: latestVersion };
};

/**
 * GERAÇÃO DE PACOTE BLINDADO (.epkg)
 * 
 * Cria um pacote de prova onde o conteúdo é cifrado via AES-256 GCM e a chave 
 * é selada (wrapped) com a chave pública de cada dispositivo de aluno.
 */
export const generateBlindPackage = async (
    examId: string,
    schoolId: string,
    state: any
): Promise<{
    packageInfo: any,
    encryptedPayload: string,
    keyDictionary: Record<string, string>,
    resourceList: string[] // URLs de mídias para cache offline
}> => {
    // 1. Localizar Prova e Alunos
    const exam = state.exams.find((e: any) => e.id === examId);
    if (!exam) throw new Error("Prova não encontrada para geração de pacote.");

    const students = state.students.filter((s: any) => s.schoolId === schoolId);

    // 2. Coletar Itens e Recursos (3D/Mídias)
    const examItemsConfig = exam.items_config || exam.items || [];
    const itemIds = examItemsConfig.map((i: any) => i.itemId);

    // Se for adaptativa, precisamos do POOL COMPLETO configurado, não apenas os IDs da "config"
    // (Em um cenário real, exam.items_config para ADAPTATIVA conteria o pool)
    const items = state.items.filter((i: any) => itemIds.includes(i.id));

    const resourceList: string[] = [];
    items.forEach((item: any) => {
        if (item.multimedia) {
            item.multimedia.forEach((m: any) => {
                if (m.url && !resourceList.includes(m.url)) {
                    resourceList.push(m.url);
                }
            });
        }
    });

    // 3. Gerar Chave AES para este pacote específico
    const jwkKey = await cryptoService.generateExamKey();
    const aesKey = await cryptoService.importKey(jwkKey);

    // 4. Encrypt Payload
    // Se a prova é adaptativa, incluímos os itens completos (com triParams e enunciados)
    // No modo normal, enviamos apenas o necessário.
    const payloadData = {
        id: exam.id,
        title: exam.title,
        model: exam.model,
        items: exam.model === 'ADAPTATIVO' ? items : examItemsConfig,
        timestamp: Date.now()
    };

    const encryptedResult = await cryptoService.encryptData(payloadData, aesKey);

    // 5. Wrap Key para cada aluno (Dicionário de Chaves)
    const keyDictionary: Record<string, string> = {};

    for (const student of students) {
        if (student.metadata?.publicKey) {
            try {
                const publicKey = await cryptoService.importPublicKey(student.metadata.publicKey);
                const wrappedKey = await cryptoService.wrapKey(aesKey, publicKey);
                keyDictionary[student.id] = wrappedKey;
            } catch (e) {
                console.error(`Falha ao embrulhar chave para aluno ${student.id}:`, e);
            }
        }
    }

    return {
        packageInfo: {
            examId,
            schoolId,
            generatedAt: new Date().toISOString(),
            version: "v1.0-secure",
            isAdaptive: exam.model === 'ADAPTATIVO',
            resourceCount: resourceList.length
        },
        encryptedPayload: JSON.stringify(encryptedResult),
        keyDictionary,
        resourceList
    };
};
