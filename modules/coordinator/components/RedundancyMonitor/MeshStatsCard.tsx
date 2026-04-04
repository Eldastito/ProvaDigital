import React from 'react';
import { Radio, ArrowUpCircle, ArrowDownCircle, ShieldAlert } from 'lucide-react';
import type { RedundancyTelemetryEvent } from '../../../../services/nativeBridgeService';

type MeshHealth = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

interface MeshStatsCardProps {
  events: ReadonlyArray<RedundancyTelemetryEvent>;
}

function deriveMeshStats(events: ReadonlyArray<RedundancyTelemetryEvent>) {
  const e3 = events.filter(e => e.layer === 'E3');
  const emitted = e3.filter(e => e.code === 'E3_MESH_EMITTED').length;
  const received = e3.filter(e => e.code === 'E3_MESH_RECEIVED').length;
  const duplicates = e3.filter(e => e.code === 'E3_DUPLICATE_RID').length;
  const replays = e3.filter(e => e.code === 'E3_REPLAY_REJECTED').length;
  const clockSkew = e3.filter(e => e.code === 'E3_CLOCK_SKEW_INVALID').length;
  const decryptionErrors = e3.filter(e => e.code === 'E3_DECRYPTION_ERROR').length;

  const discards = duplicates + replays + clockSkew;
  const rate = emitted > 0 ? Math.round((received / emitted) * 100) : null;

  let health: MeshHealth = 'UNKNOWN';
  if (emitted === 0) {
    health = 'UNKNOWN';
  } else if (decryptionErrors > 0 || (rate !== null && rate < 50)) {
    health = 'CRITICAL';
  } else if (rate !== null && rate < 70) {
    health = 'DEGRADED';
  } else {
    health = 'HEALTHY';
  }

  return { emitted, received, duplicates, replays, clockSkew, decryptionErrors, discards, rate, health };
}

const HEALTH_LABEL: Record<MeshHealth, { text: string; dot: string }> = {
  HEALTHY:  { text: 'Saudável',  dot: 'bg-emerald-400' },
  DEGRADED: { text: 'Degradada', dot: 'bg-amber-400' },
  CRITICAL: { text: 'Crítica',   dot: 'bg-red-400' },
  UNKNOWN:  { text: 'Sem Dados', dot: 'bg-slate-500' },
};

export const MeshStatsCard: React.FC<MeshStatsCardProps> = ({ events }) => {
  const stats = deriveMeshStats(events);
  const hl = HEALTH_LABEL[stats.health];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Rede Mesh (E3)
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${hl.dot} ${stats.health !== 'UNKNOWN' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium text-slate-400">{hl.text}</span>
        </div>
      </div>

      {/* Indicadores principais */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Indicator
          icon={<ArrowUpCircle className="w-4 h-4 text-blue-400" />}
          label="Emissões"
          value={stats.emitted}
        />
        <Indicator
          icon={<ArrowDownCircle className="w-4 h-4 text-emerald-400" />}
          label="Recepções"
          value={stats.received}
        />
        <Indicator
          icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          label="Descartes"
          value={stats.discards}
        />
      </div>

      {/* Taxa bruta da sessão */}
      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Taxa bruta da sessão</span>
          <span className={`text-lg font-bold tabular-nums ${
            stats.rate === null ? 'text-slate-500' :
            stats.rate >= 70 ? 'text-emerald-400' :
            stats.rate >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {stats.rate !== null ? `${stats.rate}%` : '—'}
          </span>
        </div>
        {stats.rate !== null && (
          <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                stats.rate >= 70 ? 'bg-emerald-400' :
                stats.rate >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(stats.rate, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Descartes detalhados */}
      <div className="pt-3 border-t border-slate-700/50 grid grid-cols-3 gap-2 text-center">
        <DiscardStat label="Duplicados" value={stats.duplicates} />
        <DiscardStat label="Replay" value={stats.replays} />
        <DiscardStat label="Clock Skew" value={stats.clockSkew} />
      </div>

      {/* Erro de decriptação — alerta especial */}
      {stats.decryptionErrors > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300">
            {stats.decryptionErrors} erro(s) de decriptação detectado(s) — verificação urgente recomendada
          </span>
        </div>
      )}
    </div>
  );
};

const Indicator: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="bg-slate-900/40 rounded-lg p-3 text-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <p className="text-lg font-bold tabular-nums text-slate-200">{value}</p>
    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
  </div>
);

const DiscardStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <p className={`text-sm font-bold tabular-nums ${value > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{value}</p>
    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
  </div>
);
