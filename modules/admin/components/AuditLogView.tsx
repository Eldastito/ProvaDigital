import React, { useState, useEffect } from 'react';
import { Shield, Clock, Search, AlertTriangle, FileText, Download } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { translateActionType, translateResource } from '../../../utils/translations';
import { maskPII } from '../../../utils/privacyUtils';

// Safe string coercion — always returns a renderable string
const safe = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

export const AuditLogView = () => {
    const { currentUser, auditLogs, fetchAuditLogs } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (currentUser?.tenantId) {
            setLoading(true);
            fetchAuditLogs(currentUser.tenantId).finally(() => setLoading(false));
        }
    }, [currentUser?.tenantId]);

    const logs = Array.isArray(auditLogs) ? auditLogs : [];

    const filteredLogs = logs.filter(log => {
        if (!log) return false;
        const email = safe(log.actorEmail).toLowerCase();
        const action = safe(log.actionType).toLowerCase();
        const term = searchTerm.toLowerCase();
        return email.includes(term) || action.includes(term);
    });

    const getActionColor = (type: string) => {
        const t = type.toUpperCase();
        if (t.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (t.includes('UPDATE')) return 'text-amber-600 bg-amber-50';
        if (t.includes('LOGIN')) return 'text-blue-600 bg-blue-50';
        return 'text-slate-600 bg-slate-50';
    };

    const handleExport = () => {
        try {
            const rows = filteredLogs.map(l => ({
                data: safe(l.createdAt),
                ator: safe(l.actorEmail),
                acao: safe(l.actionType),
                recurso: safe(l.targetResource),
            }));
            const csv = [Object.keys(rows[0] || {}).join(',')]
                .concat(rows.map(r => Object.values(r).join(','))).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Erro ao exportar CSV:', e);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Shield className="text-brand-primary" /> Auditoria &amp; Governança
                    </h1>
                    <p className="text-slate-500">Rastreabilidade completa de ações na plataforma.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                    <Download size={16} /> Exportar CSV
                </button>
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

            {/* Loading */}
            {loading && (
                <div className="text-center py-8 text-slate-400 font-medium">Carregando registros...</div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                <tr>
                                    <th className="p-4">Data/Hora</th>
                                    <th className="p-4">Ator (Quem)</th>
                                    <th className="p-4">Ação</th>
                                    <th className="p-4">Alvo</th>
                                    <th className="p-4">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map((log, idx) => {
                                    // Guard: skip malformed log entries entirely
                                    if (!log) return null;

                                    const rowKey = safe(log.id) || `log-${idx}`;
                                    const dateStr = log.createdAt
                                        ? new Date(safe(log.createdAt)).toLocaleString('pt-BR')
                                        : 'N/A';
                                    const actorStr = safe(log.actorEmail)
                                        ? maskPII(safe(log.actorEmail), 'EMAIL')
                                        : 'Sistema';
                                    const actionTypeStr = safe(log.actionType);
                                    const actionLabel = actionTypeStr
                                        ? translateActionType(actionTypeStr)
                                        : 'Ação Desconhecida';
                                    const resourceStr = safe(log.targetResource);
                                    const resourceLabel = resourceStr
                                        ? translateResource(resourceStr)
                                        : 'N/A';
                                    const detailsStr = log.details
                                        ? (typeof log.details === 'object'
                                            ? JSON.stringify(log.details, null, 2)
                                            : safe(log.details))
                                        : '{}';

                                    return (
                                        <tr key={rowKey} className="hover:bg-slate-50 transition">
                                            <td className="p-4 text-slate-500 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    {dateStr}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-800">
                                                {actorStr}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(actionTypeStr)}`}>
                                                    {actionLabel}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                {resourceLabel}
                                            </td>
                                            <td className="p-4">
                                                <pre className="text-xs bg-slate-900 text-slate-300 p-2 rounded max-w-xs overflow-x-auto">
                                                    {detailsStr}
                                                </pre>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredLogs.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum registro de auditoria encontrado.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                <FileText size={20} className="flex-shrink-0" />
                <div>
                    <h4 className="font-bold">Nota Legal</h4>
                    <p>Estes registros são imutáveis e protegidos (Write-Once-Read-Many). Podem ser usados para fins jurídicos e compliance com a LGPD Art. 37.</p>
                </div>
            </div>
        </div>
    );
};
