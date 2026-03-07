/**
 * Live Dashboard - Professor
 * 
 * Dashboard em tempo real para professor monitorar alunos
 * durante prova offline via rede mesh.
 * 
 * Sprint 2 - Fase 4
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    Wifi,
    AlertTriangle,
    CheckCircle,
    Clock,
    Send,
    X,
    Eye,
    EyeOff,
    Battery,
    Signal,
    Play
} from 'lucide-react';
import { getMeshNetwork, MeshNode, MeshMessage } from '../../../services/meshNetworkService';

interface StudentData {
    id: string;
    name: string;
    currentQuestion: number;
    answeredCount: number;
    totalQuestions: number;
    violations: number;
    lastViolation?: string;
    batteryLevel: number;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    lastSeen: number;
    submissionStatus?: 'IN_PROGRESS' | 'SUBMITTED' | 'CONFIRMED';
}

interface LiveDashboardProps {
    eventId: string;
    examId: string;
    totalQuestions: number;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
    eventId,
    examId,
    totalQuestions
}) => {
    const [students, setStudents] = useState<Map<string, StudentData>>(new Map());
    const [meshStats, setMeshStats] = useState<any>(null);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'NORMAL' | 'ATTENTION' | 'VIOLATION'>('ALL');

    const mesh = getMeshNetwork();

    // Inicializar mesh network
    useEffect(() => {
        const initMesh = async () => {
            try {
                await mesh.initialize({
                    signalingServerUrl: 'http://192.168.43.1:8080',
                    roomId: eventId,
                    nodeId: `professor_${Date.now()}`,
                    nodeType: 'PROFESSOR',
                    nodeName: 'Professor Dashboard'
                });

                console.log('✅ Dashboard conectado à mesh');

            } catch (error) {
                console.error('❌ Erro ao conectar à mesh:', error);
            }
        };

        initMesh();

        return () => {
            mesh.shutdown();
        };
    }, [eventId]);

    // Atualizar estatísticas a cada 2s
    useEffect(() => {
        const interval = setInterval(() => {
            const stats = mesh.getStats();
            setMeshStats(stats);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Processar mensagens da mesh
    useEffect(() => {
        // Handler para telemetria de alunos
        mesh.setOnMessageReceived((message: MeshMessage) => {
            if (message.type === 'TELEMETRY') {
                updateStudentData(message);
            } else if (message.type === 'HEARTBEAT') {
                updateStudentHeartbeat(message);
            } else if (message.type === 'HANDSHAKE_SUBMIT') {
                handleHandshakeSubmit(message);
            }
        });

        // Handler para novos nodes
        mesh.setOnNodeJoined((node: MeshNode) => {
            if (node.type === 'STUDENT') {
                console.log('👋 Aluno entrou:', node.name);
            }
        });

        // Handler para nodes saindo
        mesh.setOnNodeLeft((nodeId: string) => {
            console.log('👋 Aluno saiu:', nodeId);
            setStudents(prev => {
                const newMap = new Map(prev);
                newMap.delete(nodeId);
                return newMap;
            });
        });
    }, []);

    /**
     * Atualizar dados do aluno a partir de telemetria
     */
    const updateStudentData = (message: MeshMessage) => {
        const { studentId, studentName, currentQuestion, answeredCount, violations, lastViolation, batteryLevel } = message.payload;

        setStudents(prev => {
            const newMap = new Map(prev);

            const existing = newMap.get(studentId);

            const studentData: StudentData = {
                id: studentId,
                name: studentName || existing?.name || 'Aluno Desconhecido',
                currentQuestion: currentQuestion || existing?.currentQuestion || 0,
                answeredCount: answeredCount || existing?.answeredCount || 0,
                totalQuestions,
                violations: violations || existing?.violations || 0,
                lastViolation: lastViolation || existing?.lastViolation,
                batteryLevel: batteryLevel || existing?.batteryLevel || 100,
                connectionQuality: 'good',
                lastSeen: Date.now(),
                submissionStatus: existing?.submissionStatus
            };

            newMap.set(studentId, studentData);
            return newMap;
        });
    };

    /**
     * Processar pedido de handshake do aluno
     */
    const handleHandshakeSubmit = (message: MeshMessage) => {
        const { studentId } = message.payload;
        setStudents(prev => {
            const newMap = new Map(prev);
            const student = newMap.get(studentId);
            if (student) {
                student.submissionStatus = 'SUBMITTED';
                newMap.set(studentId, student);
            }
            return newMap;
        });
    };

    /**
     * Confirmar recebimento (Handshake Lógico)
     */
    const handleConfirmReceipt = async (studentId: string) => {
        const state = (window as any).appStore || {}; // Access store via window if needed or via hook if available
        // Note: In a real refactor, we would pass 'confirmLogicDelivery' via props or use a context
        
        mesh.sendMessage(studentId, 'CONFIRM_RECEIPT', {
            professorId: 'PROFESSOR_LOCAL',
            timestamp: Date.now()
        });

        // Tentar atualizar o store global se disponível no contexto
        try {
             // Simulando a chamada do store (Idealmente usaríamos o hook useAppStore no componente pai e passaríamos a func)
             // Como estamos em um componente complexo, vamos assumir que o professor quer o feedback imediato
             console.log(`📡 Solicitando gravação de Handshake para ${studentId}...`);
        } catch (e) {
            console.warn("Store sync failed, relying on Mesh only for now.");
        }

        setStudents(prev => {
            const newMap = new Map(prev);
            const student = newMap.get(studentId);
            if (student) {
                student.submissionStatus = 'CONFIRMED';
                newMap.set(studentId, student);
            }
            return newMap;
        });

        console.log(`✅ Entrega lógica confirmada para ${studentId}`);
    };

    /**
     * Atualizar heartbeat do aluno
     */
    const updateStudentHeartbeat = (message: MeshMessage) => {
        const { peerId, peerName } = message.payload;

        setStudents(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(peerId);

            if (existing) {
                existing.lastSeen = Date.now();
                newMap.set(peerId, existing);
            }

            return newMap;
        });
    };

    /**
     * Enviar alerta para aluno
     */
    const handleSendAlert = () => {
        if (!selectedStudent || !alertMessage.trim()) return;

        mesh.sendMessage(selectedStudent, 'ALERT', {
            message: alertMessage,
            from: 'Professor',
            timestamp: Date.now()
        });

        console.log(`📨 Alerta enviado para ${selectedStudent}`);

        setShowAlertModal(false);
        setAlertMessage('');
        setSelectedStudent(null);
    };

    /**
     * Broadcast de alerta para todos
     */
    const handleBroadcastAlert = () => {
        if (!alertMessage.trim()) return;

        mesh.broadcastMessage('ALERT', {
            message: alertMessage,
            from: 'Professor',
            timestamp: Date.now()
        });

        console.log('📢 Alerta enviado para todos');

        setShowAlertModal(false);
        setAlertMessage('');
    };

    /**
     * Habilitar prova para todos os alunos (Broadcast)
     */
    const handleEnableExamForAll = () => {
        if (!confirm('Deseja habilitar o início da prova para todos os alunos conectados?')) return;

        mesh.broadcastMessage('ENABLE_EXAM', {
            examId,
            timestamp: Date.now()
        });

        console.log('🚀 Comando ENABLE_EXAM enviado para todos os nodes');
        alert('✅ Comando enviado! A prova será liberada nos dispositivos dos alunos.');
    };

    /**
     * Filtrar alunos
     */
    const getFilteredStudents = (): StudentData[] => {
        const allStudents = Array.from(students.values());

        switch (filter) {
            case 'NORMAL':
                return allStudents.filter(s => s.violations === 0);
            case 'ATTENTION':
                return allStudents.filter(s => s.violations > 0 && s.violations < 3);
            case 'VIOLATION':
                return allStudents.filter(s => s.violations >= 3);
            default:
                return allStudents;
        }
    };

    const filteredStudents = getFilteredStudents();
    const normalCount = Array.from(students.values()).filter(s => s.violations === 0).length;
    const attentionCount = Array.from(students.values()).filter(s => s.violations > 0 && s.violations < 3).length;
    const violationCount = Array.from(students.values()).filter(s => s.violations >= 3).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Ao Vivo</h1>
                            <p className="text-gray-600">Monitoramento em tempo real via rede mesh</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-green-600">
                                    <Wifi size={20} />
                                    <span className="font-bold">Mesh Ativa</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {meshStats?.connectedNodes || 0} nodes conectados
                                </p>
                            </div>

                            <button
                                onClick={() => setShowAlertModal(true)}
                                className="px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                <Send size={20} />
                                Alerta
                            </button>

                            <button
                                onClick={handleEnableExamForAll}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg animate-pulse"
                            >
                                <Play size={20} fill="white" />
                                Liberar Provas
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-gray-900">{students.size}</div>
                            <div className="text-sm text-gray-600">Total de Alunos</div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-green-600">{normalCount}</div>
                            <div className="text-sm text-gray-600">Normal</div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-yellow-600">{attentionCount}</div>
                            <div className="text-sm text-gray-600">Atenção</div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-red-600">{violationCount}</div>
                            <div className="text-sm text-gray-600">Violações</div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Todos ({students.size})
                        </button>
                        <button
                            onClick={() => setFilter('NORMAL')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'NORMAL' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            🟢 Normal ({normalCount})
                        </button>
                        <button
                            onClick={() => setFilter('ATTENTION')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'ATTENTION' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            🟡 Atenção ({attentionCount})
                        </button>
                        <button
                            onClick={() => setFilter('VIOLATION')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'VIOLATION' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            🔴 Violação ({violationCount})
                        </button>
                    </div>
                </div>

                {/* Grid de Alunos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredStudents.map(student => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            onSendAlert={() => {
                                setSelectedStudent(student.id);
                                setShowAlertModal(true);
                            }}
                            onConfirmReceipt={() => handleConfirmReceipt(student.id)}
                        />
                    ))}
                </div>

                {filteredStudents.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
                        <Users className="mx-auto text-gray-400 mb-4" size={64} />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum aluno conectado</h3>
                        <p className="text-gray-600">Aguardando alunos se conectarem à rede mesh...</p>
                    </div>
                )}
            </div>

            {/* Modal de Alerta */}
            {showAlertModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Enviar Alerta</h2>
                            <button
                                onClick={() => setShowAlertModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {selectedStudent && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Para:</strong> {students.get(selectedStudent)?.name}
                                </p>
                            </div>
                        )}

                        <textarea
                            value={alertMessage}
                            onChange={(e) => setAlertMessage(e.target.value)}
                            placeholder="Digite a mensagem do alerta..."
                            className="w-full border-2 border-gray-300 rounded-xl p-4 h-32 resize-none focus:border-blue-500 focus:outline-none"
                        />

                        <div className="flex gap-3 mt-4">
                            {selectedStudent ? (
                                <button
                                    onClick={handleSendAlert}
                                    disabled={!alertMessage.trim()}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Enviar para Aluno
                                </button>
                            ) : (
                                <button
                                    onClick={handleBroadcastAlert}
                                    disabled={!alertMessage.trim()}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Enviar para Todos
                                </button>
                            )}

                            <button
                                onClick={() => setShowAlertModal(false)}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Card de Aluno
 */
interface StudentCardProps {
    student: StudentData;
    onSendAlert: () => void;
    onConfirmReceipt: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onSendAlert, onConfirmReceipt }) => {
    const progress = (student.answeredCount / student.totalQuestions) * 100;

    const getStatusColor = () => {
        if (student.violations >= 3) return 'bg-red-500';
        if (student.violations > 0) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusIcon = () => {
        if (student.violations >= 3) return <AlertTriangle className="text-red-500" size={20} />;
        if (student.violations > 0) return <Eye className="text-yellow-500" size={20} />;
        return <CheckCircle className="text-green-500" size={20} />;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 truncate">{student.name}</h3>
                    <p className="text-xs text-gray-500">ID: {student.id.slice(0, 8)}...</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            </div>

            {/* Progresso */}
            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-bold text-gray-900">{student.answeredCount}/{student.totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                        {getStatusIcon()}
                        Violações
                    </span>
                    <span className="font-bold">{student.violations}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                        <Battery size={16} />
                        Bateria
                    </span>
                    <span className="font-bold">{student.batteryLevel}%</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                        <Clock size={16} />
                        Questão Atual
                    </span>
                    <span className="font-bold">{student.currentQuestion}</span>
                </div>
            </div>

            {/* Última Violação */}
            {student.lastViolation && (
                <div className="mb-3 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-800">
                        <strong>Última:</strong> {student.lastViolation}
                    </p>
                </div>
            )}

            {/* Ações */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onSendAlert}
                    className="py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                    <Send size={16} />
                    Alerta
                </button>

                {student.submissionStatus === 'SUBMITTED' ? (
                    <button
                        onClick={onConfirmReceipt}
                        className="py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 animate-bounce"
                    >
                        <CheckCircle size={16} />
                        Confirmar
                    </button>
                ) : student.submissionStatus === 'CONFIRMED' ? (
                    <div className="py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-200">
                        <CheckCircle size={16} />
                        Recebido
                    </div>
                ) : (
                    <div className="py-2 bg-gray-100 text-gray-400 rounded-lg font-medium flex items-center justify-center gap-2 border border-gray-200 cursor-not-allowed">
                        Aguardando
                    </div>
                )}
            </div>
        </div>
    );
};
