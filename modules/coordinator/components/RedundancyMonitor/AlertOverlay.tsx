import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import type { RedundancyTelemetryEvent, RedundancyEventCode } from '../../../../services/nativeBridgeService';

/**
 * AlertOverlay — Centro de notificações para erros CRÍTICOS OPERACIONAIS.
 *
 * REGRA DE GOVERNANÇA:
 * - Alertas visuais imediatos:
 *   - E2_SQLITE_LOCKED, E2_SQLITE_IO_ERROR (Persistência Secundária Degradada)
 *   - E3_DECRYPTION_ERROR em pacote válido
 *   - E1_BLE_FALSE_TOGGLE acima do limiar operacional (calculado na View pai)
 *
 * - Logs técnicos sem alerta visual:
 *   - E3_DUPLICATE_RID, E3_REPLAY_REJECTED, E3_CLOCK_SKEW_INVALID
 */

const CRITICAL_CODES: ReadonlySet<RedundancyEventCode> = new Set([
  'E2_SQLITE_LOCKED',
  'E2_SQLITE_IO_ERROR',
  'E3_DECRYPTION_ERROR',
]);

const ALERT_MESSAGES: Partial<Record<RedundancyEventCode, string>> = {
  E2_SQLITE_LOCKED: 'Persistência secundária bloqueada (SQLite LOCKED)',
  E2_SQLITE_IO_ERROR: 'Erro de I/O na persistência secundária (SQLite)',
  E3_DECRYPTION_ERROR: 'Falha de decriptação em pacote Mesh — verificar integridade',
};

interface AlertOverlayProps {
  events: ReadonlyArray<RedundancyTelemetryEvent>;
  /** Alerta externo: BLE anômalo acima do limiar */
  bleAnomalyAlert?: boolean;
}

interface AlertItem {
  id: string;
  timestamp: number;
  message: string;
  code: RedundancyEventCode;
  dismissed: boolean;
}

export const AlertOverlay: React.FC<AlertOverlayProps> = ({ events, bleAnomalyAlert = false }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const processedRef = useRef(new Set<string>());

  // Processa novos eventos críticos
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    for (const evt of events) {
      if (processedRef.current.has(evt.id)) continue;
      processedRef.current.add(evt.id);

      if (CRITICAL_CODES.has(evt.code)) {
        newAlerts.push({
          id: evt.id,
          timestamp: evt.timestamp,
          message: ALERT_MESSAGES[evt.code] || `Alerta: ${evt.code}`,
          code: evt.code,
          dismissed: false,
        });
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      setCollapsed(false); // Expandir ao receber novo alerta
    }
  }, [events]);

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const hasBleAnomaly = bleAnomalyAlert;
  const totalActive = activeAlerts.length + (hasBleAnomaly ? 1 : 0);

  if (totalActive === 0) return null;

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const dismissAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
  };

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-red-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {totalActive}
            </span>
          </div>
          <span className="text-sm font-semibold text-red-300 uppercase tracking-wider">
            Alertas Críticos
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); dismissAll(); }}
              className="text-[10px] text-red-400/70 hover:text-red-300 uppercase tracking-wider px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
            >
              Limpar tudo
            </button>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-red-400/50" />
          ) : (
            <ChevronUp className="w-4 h-4 text-red-400/50" />
          )}
        </div>
      </button>

      {/* Alert List */}
      {!collapsed && (
        <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {/* BLE Anomaly Alert (injectado externamente) */}
          {hasBleAnomaly && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-300 font-medium">Oscilação BLE anômala detectada</p>
                <p className="text-[10px] text-amber-400/60 mt-0.5">Taxa de false toggle acima do limiar operacional (janela 60s)</p>
              </div>
            </div>
          )}

          {/* Critical event alerts */}
          {activeAlerts.map(alert => (
            <div
              key={alert.id}
              className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 group"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-300 font-medium">{alert.message}</p>
                <p className="text-[10px] text-red-400/50 mt-0.5 tabular-nums">
                  {new Date(alert.timestamp).toLocaleTimeString('pt-BR')} — {alert.code}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20"
              >
                <X className="w-3 h-3 text-red-400/50" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
