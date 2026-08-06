/**
 * OpenTelemetry tracing (Pillar 04, Action Item 4).
 *
 * Initializes the Node SDK when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (no-op
 * otherwise so dev/test/build are unaffected). Auto-instrumentation covers
 * HTTP, fetch, and database calls. `getTraceIds()` bridges logs to the active
 * trace so every structured log line carries `trace_id`/`span_id`.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { trace, context, propagation } from "@opentelemetry/api";

let initialized = false;

export function initTracing(): void {
  if (initialized) return;
  if (process.env.NEXT_RUNTIME === "edge") return;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  initialized = true;

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": "suitora",
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-http": {
          ignoreIncomingRequestHook: () => true,
        },
      }),
    ],
  });

  sdk.start();

  const shutdown = () => {
    sdk
      .shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

export type TraceIds = { traceId: string; spanId: string };

/** Active trace ids for log/trace correlation, or null when not tracing. */
export function getTraceIds(): TraceIds | null {
  const span = trace.getSpan(context.active());
  if (!span) return null;
  const spanContext = span.spanContext();
  return { traceId: spanContext.traceId, spanId: spanContext.spanId };
}

export { propagation };
