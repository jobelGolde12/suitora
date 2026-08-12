/**
 * Structured JSON logger (Pillar 04, Action Item 2).
 *
 * pino instance with a stable `service`/`env` base, redaction for secrets, and
 * request/trace bindings. `getLogger()` returns a child bound to the current
 * request context (requestId/correlationId/route/method/userId) plus the active
 * trace_id/span_id when tracing is enabled, so every line is correlatable.
 */

import pino, { type Logger, type LoggerOptions } from "pino";
import { getRequestContext } from "@/lib/request-context";
import { getTraceIds } from "@/lib/tracing";

const isDev = process.env.NODE_ENV !== "production";

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: {
    service: "suitora",
    env: process.env.NODE_ENV || "development",
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "access_token",
      "refresh_token",
      "id_token",
      "authorization",
      "cookie",
      "set-cookie",
      "*.secret",
      "BETTER_AUTH_SECRET",
      "apiKey",
      "*.apiKey",
      "*.key",
      "x-amz-security-token",
      "x-amz-credential",
    ],
    censor: "[redacted]",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

function buildLogger(): Logger {
  if (isDev) {
    try {
      return pino(
        options,
        pino.transport({
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,service",
          },
        })
      );
    } catch {
      // fall back to plain JSON if the pretty transport can't be built
    }
  }
  return pino(options);
}

export const logger = buildLogger();

/**
 * Child logger bound to the current request and trace context. When no request
 * context is active (jobs, startup), falls back to the root logger.
 */
export function getLogger(): Logger {
  const ctx = getRequestContext();
  const traceIds = getTraceIds();
  if (!ctx && !traceIds) return logger;

  const bindings: Record<string, unknown> = {};
  if (ctx) {
    bindings.requestId = ctx.requestId;
    bindings.correlationId = ctx.correlationId;
    bindings.route = ctx.route;
    bindings.method = ctx.method;
    if (ctx.userId) bindings.userId = ctx.userId;
  }
  if (traceIds) {
    bindings.trace_id = traceIds.traceId;
    bindings.span_id = traceIds.spanId;
  }
  return logger.child(bindings);
}
