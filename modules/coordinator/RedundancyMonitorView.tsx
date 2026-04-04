import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, RefreshCw, Trash2, Clock,
  Wifi, WifiOff, Eye, EyeOff, Layers
} from 'lucide-react';
import { nativeBridge } from '../../services/nativeBridgeService';
import type {
  RedundancyTelemetryEvent,
  RedundancyEventCode,
} from '../../services/nativeBridgeService';
import { PersistenceHealthCard } from './components/RedundancyMonitor/PersistenceHealthCard';
import { MeshStatsCard } from './components/RedundancyMonitor/MeshStatsCard';
import { AlertOverlay } from './components/RedundancyMonitor/AlertOverlay';

// ============================================================
// BLE Presence Configuration
// ============================================================

/** Throttle visual de atualização BLE: 2 segundos */
const BLE_VISUAL_THROTTLE_MS = 2000;

/** Janela móvel para contagem de oscilação: 60 segundos */
const BLE_OSCILLATION_WINDOW_MS = 60_000;

/** Limiar de false toggles na janela para considerar "oscilação anômala" */
const BLE_FALSE_TOGGLE_THRESHOLD = 5;

// ============================================================
// BLE Presence Panel (sub-component)
// ============================================================

interface BleState {
  present: boolean;
  stale: boolean;
  anomalous: boolean;
  falseToggleCount: number;
  lastUpdate: number;
}

function useBlePresence(): BleState {
  const [state, setState] = useState<BleState>({
    present: false,
    stale: true,
    anomalous: false,
    falseToggleCount: 0,
    lastUpdate: 0,
  });

  const toggleTimestamps = useRef<number[]>([]);
  const lastPresent = useRef<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!mounted) return;

      try {
        const result = await nativeBridge.isBleRoomPresent();
        const now = Date.now();

        // Detectar toggle
        if (lastPresent.current !== null && lastPresent.current !== result.present) {
          toggleTimestamps.current.push(now);
        }
        lastPresent.current = result.present;

        // Limpar toggles antigos (fora da janela de 60s)
        const windowStart = now - BLE_OSCILLATION_WINDOW_MS;
        toggleTimestamps.current = toggleTimestamps.current.filter(t => t > windowStart);

        const falseToggleCount = toggleTimestamps.current.length;
        const anomalous = falseToggleCount >= BLE_FALSE_TOGGLE_THRESHOLD;

        setState({
          present: result.present,
          stale: !result.ok,
          anomalous,
          falseToggleCount,
          lastUpdate: now,
        });

        // Emitir telemetria BLE
        if (anomalous) {
          // O emitTelemetryEvent é privado, mas podemos chamar via subscriber
          // Aqui apenas rastreamos no estado local
        }
      } catch {
        setState(prev => ({ ...prev, stale: true }));
      }

      // Throttle visual de 2 segundos
      timeoutId = setTimeout(poll, BLE_VISUAL_THROTTLE_MS);
    };

    poll();
    return () => { mounted = false; clearTimeout(timeoutId); };
  }, []);

  return state;
}

const BlePresencePanel: React.FC<{ ble: BleState }> = ({ ble }) => {
  const statusConfig = ble.stale
    ? { label: 'Stale', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', Icon: WifiOff }
    : ble.anomalous
    ? { label: 'Oscilação Anômala', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', Icon: Activity }
    : ble.present
    ? { label: 'Presente', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: Wifi }
    : { label: 'Ausente', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', Icon: WifiOff };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Presença BLE (E1)
        </h3>
      </div>

      <div className={`rounded-lg border p-4 ${statusConfig.border} ${statusConfig.bg}`}>
        <div className="flex items-center gap-3">
          <statusConfig.Icon className={`w-6 h-6 ${statusConfig.color}`} />
          <div>
            <p className={`text-base font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Atualização a cada 2s — Janela de oscilação: 60s
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="bg-slate-900/40 rounded-lg p-2">
          <p className={`text-sm font-bold tabular-nums ${ble.anomalous ? 'text-amber-400' : 'text-slate-400'}`}>
            {ble.falseToggleCount}
          </p>
          <p className="text-[10px] text-slate-500 uppercase">Toggles (60s)</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-2">
          <p className="text-sm font-bold tabular-nums text-slate-400">
            {ble.lastUpdate > 0 ? new Date(ble.lastUpdate).toLocaleTimeString('pt-BR') : '—'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase">Última leitura</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Event Log Panel
// ============================================================

const EVENT_CODE_COLORS: Record<string, string> = {
  E2_SQLITE_OK: 'text-emerald-400',
  E2_SQLITE_LOCKED: 'text-red-400',
  E2_SQLITE_IO_ERROR: 'text-red-400',
  E3_MESH_EMITTED: 'text-blue-400',
  E3_MESH_RECEIVED: 'text-emerald-400',
  E3_DECRYPTION_ERROR: 'text-red-400',
  E3_DUPLICATE_RID: 'text-amber-400',
  E3_REPLAY_REJECTED: 'text-amber-400',
  E3_CLOCK_SKEW_INVALID: 'text-amber-400',
};

const EventLogPanel: React.FC<{
  events: ReadonlyArray<RedundancyTelemetryEvent>;
  showTechnical: boolean;
}> = ({ events, showTechnical }) => {
  const filtered = useMemo(() => {
    if (showTechnical) return events;
    // Sem modo técnico, esconder logs que são "ruído esperado"
    const techOnlyCodes: RedundancyEventCode[] = ['E3_DUPLICATE_RID', 'E3_REPLAY_REJECTED', 'E3_CLOCK_SKEW_INVALID'];
    return events.filter(e => !techOnlyCodes.includes(e.code));
  }, [events, showTechnical]);

  const displayEvents = filtered.slice(-30).reverse();

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Log de Eventos
        </h3>
        <span className="ml-auto text-[10px] text-slate-600 tabular-nums">
          {events.length} / 200 buffer
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        <AnimatePresence initial={false}>
          {displayEvents.map(evt => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 rounded-md bg-slate-900/40 px-3 py-1.5 text-xs"
            >
              <span className="text-slate-600 tabular-nums shrink-0 w-16">
                {new Date(evt.timestamp).toLocaleTimeString('pt-BR')}
              </span>
              <span className={`font-mono font-medium shrink-0 ${EVENT_CODE_COLORS[evt.code] || 'text-slate-400'}`}>
                {evt.code}
              </span>
              <span className="text-slate-600 truncate">
                {evt.latency !== undefined ? `${evt.latency}ms` : ''}
                {evt.metadata?.requestId ? ` RID:${String(evt.metadata.requestId).slice(0, 8)}` : ''}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {displayEvents.length === 0 && (
          <p className="text-center text-slate-600 text-xs py-4">
            Nenhum evento capturado nesta sessão
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Main View
// ============================================================

export const RedundancyMonitorView: React.FC = () => {
  const [events, setEvents] = useState<ReadonlyArray<RedundancyTelemetryEvent>>([]);
  const [showTechnical, setShowTechnical] = useState(false);
  const ble = useBlePresence();

  // Subscriber para eventos de telemetria
  useEffect(() => {
    // Carregar buffer existente
    setEvents(nativeBridge.getTelemetryBuffer());

    // Inscrever para novos eventos
    const unsub = nativeBridge.subscribeTelemetry(() => {
      setEvents(nativeBridge.getTelemetryBuffer());
    });

    return unsub;
  }, []);

  const handleClearBuffer = useCallback(() => {
    nativeBridge.clearTelemetryBuffer();
    setEvents([]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Monitor de Redundância</h1>
              <p className="text-xs text-slate-500">Interface observacional — Fase 4 • Somente leitura</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle técnico */}
            <button
              onClick={() => setShowTechnical(t => !t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showTechnical
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              {showTechnical ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Modo Técnico
            </button>

            {/* Limpar buffer — apenas visual, sem impacto no núcleo */}
            <button
              onClick={() => {
                if (events.length === 0) return;
                if (window.confirm('Limpar o log visual desta sessão?\n\nIsso NÃO apaga dados do sistema, banco de dados ou prova.\nApenas limpa a visualização temporária do monitor.')) {
                  handleClearBuffer();
                }
              }}
              title="Limpa apenas o buffer visual desta sessão. Não afeta dados do sistema, banco de dados ou prova em andamento."
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-500 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Visão
            </button>

            {/* Indicador de sessão */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs tabular-nums text-slate-500">
                {events.length} eventos
              </span>
            </div>
          </div>
        </div>

        {/* Alert Overlay */}
        <div className="mb-4">
          <AlertOverlay events={events} bleAnomalyAlert={ble.anomalous} />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <PersistenceHealthCard events={events} />
          <MeshStatsCard events={events} />
          <BlePresencePanel ble={ble} />
        </div>

        {/* Event Log */}
        <EventLogPanel events={events} showTechnical={showTechnical} />

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-700 uppercase tracking-widest">
            Phase 4 — Observational Only • Buffer efêmero ({events.length}/200) • Não persiste no banco núcleo
          </p>
        </div>
      </div>
    </div>
  );
};
