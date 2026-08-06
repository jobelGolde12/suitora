/**
 * Next.js instrumentation hook (Pillar 04, Action Item 4).
 *
 * Runs once when the server starts. Initializes OpenTelemetry tracing when
 * `OTEL_EXPORTER_OTLP_ENDPOINT` is configured; otherwise it is a no-op.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTracing } = await import("@/lib/tracing");
    initTracing();
  }
}
