import React from 'react';
import { Database, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { RedundancyTelemetryEvent } from '../../../../services/nativeBridgeService';

type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

interface PersistenceHealthCardProps {
  events: ReadonlyArray<RedundancyTelemetryEvent>;
}

function deriveE2Status(events: ReadonlyArray<RedundancyTelemetryEvent>): HealthStatus {
  const e2Events = events.filter(e => e.layer === 'E2');
  if (e2Events.length === 0) return 'UNKNOWN';

  const last10 = e2Events.slice(-10);
  const criticalCount = last10.filter(e => e.severity === 'CRITICAL').length;
  const warningCount = last10.filter(e => e.severity === 'WARNING').length;

  if (criticalCount >= 2) return 'CRITICAL';
  if (criticalCount >= 1 || warningCount >= 3) return 'DEGRADED';
  return 'HEALTHY';
}

const STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle }> = {
  HEALTHY:  { label: 'Operacional',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: CheckCircle },
  DEGRADED: { label: 'Degradado',    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   Icon: AlertTriangle },
  CRITICAL: { label: 'Crítico',      color: 'text-red-400',     bg: 'bg-red-500/10',      border: 'border-red-500/20',     Icon: XCircle },
  UNKNOWN:  { label: 'Sem Dados',    color: 'text-slate-500',   bg: 'bg-slate-500/10',    border: 'border-slate-500/20',   Icon: Database },
};

export const PersistenceHealthCard: React.FC<PersistenceHealthCardProps> = ({ events }) => {
  const idbStatus: HealthStatus = 'HEALTHY'; // IDB (E1) não tem falha observada nas ondas
  const sqliteStatus = deriveE2Status(events);

  const e2Events = events.filter(e => e.layer === 'E2');
  const totalE2 = e2Events.length;
  const successE2 = e2Events.filter(e => e.code === 'E2_SQLITE_OK').length;
  const failE2 = totalE2 - successE2;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Saúde da Persistência
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* IndexedDB (Primária) */}
        <StatusBadge label="IndexedDB" sublabel="Primária" status={idbStatus} />
        {/* SQLite (Secundária) */}
        <StatusBadge label="SQLite" sublabel="Secundária (E2)" status={sqliteStatus} />
      </div>

      {/* Contagem E2 */}
      <div className="mt-4 pt-3 border-t border-slate-700/50 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Operações" value={totalE2} color="text-slate-300" />
        <MiniStat label="Sucesso" value={successE2} color="text-emerald-400" />
        <MiniStat label="Falhas" value={failE2} color={failE2 > 0 ? 'text-red-400' : 'text-slate-500'} />
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ label: string; sublabel: string; status: HealthStatus }> = ({ label, sublabel, status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-200">{label}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{sublabel}</p>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
  </div>
);
