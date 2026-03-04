import { MeshNetworkService } from '../meshNetworkService';
import { WebRTCClient } from '../webrtcClient';

/**
 * Simulação de Teste de Handshake Mesh
 * Este script simula o comportamento de um Professor e um Aluno
 * trocando mensagens de habilitação e telemetria.
 */
async function testMeshHandshake() {
    console.log('🧪 Iniciando Teste de Handshake Mesh...');

    // 1. Criar instâncias (Simuladas - em ambiente real usariam WebRTCClient real)
    // Para simplificar o teste de lógica, vamos focar nos handlers

    const professorMesh = new MeshNetworkService();
    const studentMesh = new MeshNetworkService();

    // Mock do client para não tentar conexão real em ambiente de teste sem Node-WebRTC
    (professorMesh as any).client = {
        broadcast: (type: string, payload: any) => {
            console.log(`[PROFESSOR BROADCAST] ${type}`, payload);
            // Simular entrega para o aluno
            (studentMesh as any).handleMessage({
                type,
                from: 'professor-id',
                payload,
                timestamp: Date.now()
            });
        },
        sendTo: (to: string, type: string, payload: any) => {
            console.log(`[PROFESSOR SEND TO ${to}] ${type}`, payload);
        },
        onMessage: (type: string, handler: any) => {
            if (!(professorMesh as any).mockHandlers) (professorMesh as any).mockHandlers = {};
            (professorMesh as any).mockHandlers[type] = handler;
        },
        getStats: () => ({ config: { peerId: 'professor-id' } })
    };

    (studentMesh as any).client = {
        broadcast: (type: string, payload: any) => {
            console.log(`[STUDENT BROADCAST] ${type}`, payload);
            // Simular entrega para o professor
            (professorMesh as any).handleMessage({
                type,
                from: 'student-id',
                payload,
                timestamp: Date.now()
            });
        },
        onMessage: (type: string, handler: any) => {
            if (!(studentMesh as any).mockHandlers) (studentMesh as any).mockHandlers = {};
            (studentMesh as any).mockHandlers[type] = handler;
        },
        getStats: () => ({ config: { peerId: 'student-id' } })
    };

    // 2. Configurar Handlers (Como no App)
    let studentUnlocked = false;
    studentMesh.setOnMessageReceived((msg) => {
        if (msg.type === 'ENABLE_EXAM') {
            console.log('✅ Aluno: Recebeu ENABLE_EXAM!');
            studentUnlocked = true;
        }
    });

    let teacherReceivedTelemetry = false;
    professorMesh.setOnMessageReceived((msg) => {
        if (msg.type === 'TELEMETRY') {
            console.log('✅ Professor: Recebeu Telemetria do Aluno!', msg.payload);
            teacherReceivedTelemetry = true;
        }
    });

    // 3. Executar Fluxo
    console.log('\n--- Passo 1: Professor habilita a prova ---');
    professorMesh.broadcastMessage('ENABLE_EXAM', { examId: 'exam-123' });

    console.log('\n--- Passo 2: Aluno envia telemetria ---');
    studentMesh.sendTelemetry({ studentId: 'student-id', battery: 88, progress: 10 });

    // 4. Asserts
    console.log('\n--- Resultados ---');
    if (studentUnlocked && teacherReceivedTelemetry) {
        console.log('✨ TESTE PASSOU: Comunicação Mesh Handshake Funcional!');
    } else {
        console.error('❌ TESTE FALHOU');
    }
}

// Simulando a classe handleMessage para o mock funcionar
MeshNetworkService.prototype['handleMessage'] = function (msg: any) {
    const handler = (this as any).mockHandlers[msg.type];
    if (handler) handler(msg);
};

testMeshHandshake().catch(console.error);
