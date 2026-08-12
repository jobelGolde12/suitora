# syntax=docker/dockerfile:1
# Multi-stage production image. `next.config.ts` sets `output: "standalone"`,
# so the runtime stage only carries the self-contained build output.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BETTER_AUTH_SECRET is required by the app's env validation even for static
# page collection. It is supplied as a BuildKit secret so it never lands in
# image layers or ENV. If none is provided (e.g. a stub/PR build) a dummy value
# is used; the real secret is injected via container env at runtime.
# Build with real value: docker build --secret id=better_auth_secret,src=<(printf %s \"$BETTER_AUTH_SECRET\") .
RUN --mount=type=secret,id=better_auth_secret \
  export BETTER_AUTH_SECRET="$(cat /run/secrets/better_auth_secret 2>/dev/null)"; \
  [ -n "$BETTER_AUTH_SECRET" ] || export BETTER_AUTH_SECRET=dummy-secret-for-build; \
  npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
# Standalone output bundles the server and traced production dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# Background worker target: runs the Redis subscriber that reacts to sync events.
# Uses the full dependency tree (includes tsx + ioredis) rather than the
# standalone web output.
FROM node:20-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/services ./services
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
CMD ["npx", "tsx", "services/worker/index.ts"]