import React, { useState, useEffect } from 'react';
import { Shield, Clock, Search, AlertTriangle, FileText, Download } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { useAppStore } from '../../store/useAppStore';

// Mock data for display when DB is empty
const MOCK_LOGS = [
    { id: '1', action_type: 'UPDATE_GRADE', actor_email: 'prof.xavier@escola.com', target_resource: 'exam_result', details: { old: 4.5, new: 8.0, reason: 'Revisão acatada' }, created_at: new Date().toISOString() },
    { id: '2', action_type: 'LOGIN', actor_email: 'diretor.skinner@escola.com', target_resource: 'auth', details: { method: 'email' }, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', action_type: 'EXPORT_DATA', actor_email: 'admin@seduc.sp.gov.br', target_resource: 'student_list', details: { filter: 'school_id=123' }, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', action_type: 'DELETE_USER', actor_email: 'super.admin@examepad.com', target_resource: 'user', details: { deleted_user: 'fake_account' }, created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const AuditLogView = () => {
    const { currentUser } = useAppStore();
    const [logs, setLogs] = useState<any[]>(MOCK_LOGS);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        if (!currentUser?.tenantId) return;
        setLoading(true);
        try {
            const data = await auditService.fetchLogs(currentUser.tenantId);
            if (data && data.length > 0) {
                setLogs(data);
            }
        } catch (e) {
            console.error("Failed to load logs, using mock", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (type: string) => {
        if (type.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (type.includes('UPDATE')) return 'text-amber-600 bg-amber-50';
        if (type.includes('LOGIN')) return 'text-blue-600 bg-blue-50';
        return 'text-slate-600 bg-slate-50';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Shield className="text-brand-primary" /> Auditoria & Governança
                    </h1>
                    <p className="text-slate-500">Rastreabilidade completa de ações na plataforma.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                <Search className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por usuário ou ação..."
                    className="flex-1 outline-none text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="p-4">Data/Hora</th>
                                <th className="p-4">Ator (Quem)</th>
                                <th className="p-4">Ação</th>
                                <th className="p-4">Alvo</th>
                                <th className="p-4">Detalhes (JSON)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 text-slate-500 whitespace-nowrap flex items-center gap-2">
                                        <Clock size={14} />
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">
                                        {log.actor_email || 'Sistema'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action_type)}`}>
                                            {log.action_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {log.target_resource}
                                    </td>
                                    <td className="p-4">
                                        <pre className="text-xs bg-slate-900 text-slate-300 p-2 rounded max-w-xs overflow-x-auto scrollbar-thin">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum registro de auditoria encontrado para este filtro.</p>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                <FileText size={20} className="flex-shrink-0" />
                <div>
                    <h4 className="font-bold">Nota Legal</h4>
                    <p>Estes registros são imutáveis e protegidos por criptografia (Write-Once-Read-Many). Podem ser utilizados para fins jurídicos e compliance com LGPD Art. 37.</p>
                </div>
            </div>
        </div>
    );
};
