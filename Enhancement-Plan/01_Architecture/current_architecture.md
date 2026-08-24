# Current Architecture

## Stack
- **Framework:** Next.js 16.2.10 (Turbopack)
- **React:** 19.2.4
- **Language:** TypeScript 5
- **Database:** SQLite via Turso (libSQL) with Drizzle ORM
- **Auth:** Better Auth (cookie-based sessions)
- **Cache:** ioredis (Redis) for trending; Upstash for rate limiting
- **AI Providers:** OpenAI, Groq, NVIDIA (vision analysis + stylist chat)
- **Storage:** Cloudinary for image uploads
- **Observability:** Prometheus metrics, Pino logging, OpenTelemetry tracing
- **Styling:** Tailwind CSS 4

## Data Flow
```
User → Client Component (SWR) → API Route (withApiRoute) → Validation → Business Logic → Drizzle ORM → Turso DB
```

## Key Patterns
- `withApiRoute()` wraps all API handlers with correlation IDs, metrics, and error handling
- `requireUser()` for authentication (cookie-based)
- `dbRead` / `dbWrite` for read replica / primary database separation
- SWR for client-side data fetching with deduplication
- Structured JSON logging with request context
- Prometheus histograms for latency tracking
