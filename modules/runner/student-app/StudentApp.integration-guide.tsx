/**
 * EXEMPLO DE INTEGRAÇÃO: useStudentSession no StudentApp
 * 
 * Este arquivo mostra como integrar o sistema multi-login no StudentApp.tsx
 * 
 * MUDANÇAS NECESSÁRIAS:
 * 1. Importar o hook
 * 2. Substituir estado local de respostas
 * 3. Auto-save ao responder questões
 * 4. Logout ao finalizar
 */

import { useStudentSession } from '../hooks/useStudentSession';

// ============================================
// 1. IMPORTAR O HOOK (linha ~15)
// ============================================
/*
import { useStudentSession } from '../hooks/useStudentSession';
*/

// ============================================
// 2. INICIALIZAR O HOOK (após linha ~91)
// ============================================
/*
const StudentAppContent = ({ onBack }: StudentAppProps) => {
    // ... código existente ...
    
    // ADICIONAR:
    const {
        currentSession,
        isSessionActive,
        startSession,
        saveAnswer,
        logSecurityEvent,
        finishSession,
        logout
    } = useStudentSession({
        examId: examIdParam || 'demo-exam',
        eventId: classIdParam || 'demo-event'
    });
    
    // REMOVER (substituído pelo hook):
    // const [answers, setAnswers] = useState<Record<string, string>>({});
*/

// ============================================
// 3. INICIAR SESSÃO AO FAZER LOGIN (função handleJoinClass)
// ============================================
/*
const handleJoinClass = async () => {
    setJoining(true);
    try {
        // ... código de validação existente ...
        
        // Gerar studentId
        const studentId = uuidv4();
        
        // ADICIONAR: Iniciar sessão multi-login
        await startSession(studentId, inputName.trim());
        
        // ... resto do código ...
        
        setStep('EXAM_COVER');
    } catch (error) {
        console.error(error);
    } finally {
        setJoining(false);
    }
};
*/

// ============================================
// 4. SALVAR RESPOSTAS VIA HOOK (função handleOptionSelect)
// ============================================
/*
const handleOptionSelect = async (qId: string, optId: string) => {
    // ANTES (estado local):
    // setAnswers(prev => ({ ...prev, [qId]: optId }));
    
    // DEPOIS (hook com auto-save no IndexedDB):
    const questionIndex = examItems.findIndex(q => q.id === qId);
    
    if (questionIndex >= 0) {
        await saveAnswer(questionIndex + 1, optId); // questionId começa em 1
    }
    
    // Atualizar UI local (opcional, para feedback imediato)
    setAnswers(prev => ({ ...prev, [qId]: optId }));
};
*/

// ============================================
// 5. REGISTRAR EVENTOS DE SEGURANÇA (hook useProctoring)
// ============================================
/*
const { videoRef, cameraActive, violationCount, securityLog } = useProctoring({
    isActive: proctoringActive,
    studentId: currentSession?.studentId || 'anon',
    onViolation: async (reason) => {
        console.log("Violação detectada:", reason);
        
        // ADICIONAR: Salvar no système multi-login
        await logSecurityEvent(
            reason,
            'HIGH',
            { timestamp: new Date().toISOString() }
        );
        
        // ... código existente ...
    }
});
*/

// ============================================
// 6. FINALIZAR SESSÃO AO TERMINAR PROVA
// ============================================
/*
const handleFinishExam = async () => {
    // Marcar como finalizando
    setStep('SENDING');
    
    try {
        // ADICIONAR: Finalizar sessão multi-login
        const completedSession = await finishSession();
        
        console.log('✅ Sessão finalizada:', completedSession.id);
        console.log('   Respostas:', completedSession.encryptedAnswers.length);
        console.log('   Eventos:', completedSession.securityEvents.length);
        
        // Se OFFLINE: ir para tela de QR Code
        if (sessionMode === 'OFFLINE') {
            setStep('OFFLINE_SUBMISSION');
            
            // Dados para QR Code virão de completedSession
            // (já estão em IndexedDB via sessionIsolationService)
        } else {
            // Se ONLINE: enviar para servidor
            await sendToServer(completedSession);
            setStep('COMPLETED');
        }
        
    } catch (error) {
        console.error('❌ Erro ao finalizar:', error);
        alert('Erro ao finalizar prova. Tente novamente.');
        setStep('EXAM');
    }
};
*/

// ============================================
// 7. LOGOUT AO MOSTRAR RESULTADO/QR CODE
// ============================================
/*
// Após mostrar QR Code ou resultado final:
useEffect(() => {
    if (step === 'COMPLETED') {
        // Aguardar 3 segundos para o aluno ver o resultado
        const timer = setTimeout(() => {
            console.log('🚪 Fazendo logout...');
            logout(); // Limpa RAM, mantém IndexedDB
            
            // Voltar para tela de login (próximo aluno)
            setStep('LOGIN_FORM');
            setInputName('');
            setCurrentQuestionIdx(0);
        }, 3000);
        
        return () => clearTimeout(timer);
    }
}, [step]);
*/

// ============================================
// 8. ACESSAR RESPOSTAS DO CURRENTSES SION
// ============================================
/*
// Para mostrar progresso ou revisar respostas:
const answeredCount = currentSession?.encryptedAnswers.length || 0;
const totalQuestions = examItems.length;
const progress = (answeredCount / totalQuestions) * 100;

console.log(`Progresso: ${progress}% (${answeredCount}/${totalQuestions})`);
*/

// ============================================
// 9. EXEMPLO COMPLETO: INTEGRAÇÃO MÍNIMA
// ============================================
/*
import React, { useState, useEffect } from 'react';
import { useStudentSession } from '../hooks/useStudentSession';

const StudentAppContent = ({ onBack }) => {
    // Hooks existentes...
    const params = new URLSearchParams(window.location.search);
    const examIdParam = params.get('examId');
    const classIdParam = params.get('classId');
    
    // ✨ NOVO: Hook multi-login
    const {
        currentSession,
        isSessionActive,
        startSession,
        saveAnswer,
        finishSession,
        logout
    } = useStudentSession({
        examId: examIdParam || 'demo',
        eventId: classIdParam || 'demo'
    });
    
    // Estado UI local
    const [step, setStep] = useState('LOGIN_FORM');
    const [inputName, setInputName] = useState('');
    
    // Login
    const handleLogin = async () => {
        const studentId = generateStudentId();
        await startSession(studentId, inputName);
        setStep('EXAM');
    };
    
    // Responder
    const handleAnswer = async (questionId: number, answer: string) => {
        await saveAnswer(questionId, answer);
    };
    
    // Finalizar
    const handleFinish = async () => {
        const session = await finishSession();
        setStep('COMPLETED');
        
        // Auto-logout após 3s
        setTimeout(() => {
            logout();
            setStep('LOGIN_FORM');
        }, 3000);
    };
    
    return (
        <div>
            {step === 'LOGIN_FORM' && (
                <button onClick={handleLogin}>Entrar</button>
            )}
            {step === 'EXAM' && (
                <button onClick={handleFinish}>Finalizar</button>
            )}
        </div>
    );
};
*/

// ============================================
// 10. BENEFÍCIOS DA INTEGRAÇÃO
// ============================================
/*
✅ Multi-login automático (3-4 alunos/dia no mesmo tablet)
✅ Isolamento total de dados entre sessões
✅ Persistência automática em IndexedDB
✅ Telemetria e logs de segurança incluídos
✅ Ciclo de vida gerenciado (RAM limpa ao logout)
✅ Dados mantidos até upload confirmado
✅ API simples e React-friendly
*/

export { };
