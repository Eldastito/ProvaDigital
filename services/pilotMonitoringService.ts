
/**
 * PilotMonitoringService - Hub de Telemetria Global do Authority Pilot
 * Segue o padrão OpenTelemetry (Metrics, Logs, Traces).
 */
export interface PilotMetric {
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp: string;
}

export interface PilotTrace {
    trace_id: string;
    span_id: string;
    parent_id?: string;
    name: string;
    tags: Record<string, string>;
    duration_ms?: number;
    timestamp: string;
}

class PilotMonitoringService {
    private metrics: PilotMetric[] = [];
    private traces: PilotTrace[] = [];

    /**
     * Registra uma métrica de contador ou status.
     * Semantic Convention: Usar snake_case com prefixo 'pilot_'.
     */
    emitMetric(name: string, value: number, labels: Record<string, string> = {}): void {
        const metric: PilotMetric = {
            name,
            value,
            labels: { ...labels, app: 'authority_pilot', env: 'production' },
            timestamp: new Date().toISOString()
        };
        this.metrics.push(metric);
        console.log(`[OTEL][METRIC] ${name}: ${value} | Labels: ${JSON.stringify(labels)}`);
    }

    /**
     * Inicia um span de rastreabilidade (Trace).
     */
    startSpan(name: string, traceId?: string, parentId?: string, tags: Record<string, string> = {}): PilotTrace {
        const trace: PilotTrace = {
            trace_id: traceId || `tr_${Math.random().toString(36).substring(7)}`,
            span_id: `sp_${Math.random().toString(36).substring(7)}`,
            parent_id: parentId,
            name,
            tags: { ...tags, app: 'authority_pilot' },
            timestamp: new Date().toISOString()
        };
        this.traces.push(trace);
        console.log(`[OTEL][TRACE][START] ${name} | TraceID: ${trace.trace_id}`);
        return trace;
    }

    /**
     * Finaliza um span e anota a duração.
     */
    endSpan(trace: PilotTrace, duration_ms: number): void {
        trace.duration_ms = duration_ms;
        console.log(`[OTEL][TRACE][END] ${trace.name} finished in ${duration_ms}ms`);
    }

    getLatestMetrics(): PilotMetric[] {
        return this.metrics.slice(-10);
    }
}

export const pilotMonitoringService = new PilotMonitoringService();
