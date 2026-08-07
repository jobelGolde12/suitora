# Contributing to Suitora

Thanks for your interest in contributing to **Suitora**, an AI-powered fashion
compatibility platform built with Next.js (App Router), React 19, TypeScript,
Tailwind CSS, Turso (SQLite), and Drizzle ORM.

This guide gets you from a fresh clone to your first pull request within one
day. If anything is unclear, open an issue — keeping this document accurate is a
team responsibility.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Branching Strategy](#branching-strategy)
- [Commit Messages](#commit-messages)
- [Development Workflow](#development-workflow)
- [Pull Requests](#pull-requests)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## Code of Conduct

Be respectful and constructive. Assume positive intent in every review
discussion. Harassment, discrimination, or abusive behavior is not tolerated.

## Prerequisites

- **Node.js 20+** (LTS recommended; CI runs on Node 22).
- **npm** — the lockfile (`package-lock.json`) is committed. Use `npm`, not
  yarn/pnpm, to avoid lockfile drift.
- **Turso CLI** (optional) — only needed to manage a remote database or push
  schema directly.
- **Git** — for cloning and branching.

## Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/suitora/suitora.git
   cd suitora
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   > `install` automatically runs the `prepare` hook, which sets up Husky git
   > hooks (lint-staged on commit, commit-msg lint).

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in at least `BETTER_AUTH_SECRET` (min 16 characters) and optionally a
   database URL. For pure UI work the app runs with fallbacks, but auth flows
   need a real secret.

4. **Apply database migrations**

   For a local file database, push the schema directly:

   ```bash
   npx drizzle-kit push
   ```

   Migration SQL also ships under `drizzle/migrations/`. For a live Turso DB,
   apply the SQL against the remote database (Turso CLI); for local
   development, `npx drizzle-kit push` targets `file:./data/suitora.db`. New
   schema changes belong in both `drizzle/schema.ts` and a dated migration SQL
   file (see `CONTRIBUTING` coding standards).

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and set at minimum:

| Variable             | Required | Description                                  |
|----------------------|----------|----------------------------------------------|
| `BETTER_AUTH_SECRET` | Yes      | Auth signing secret (min 16 chars)          |
| `BETTER_AUTH_URL`    | Dev only | App origin, e.g. `http://localhost:3000`    |
| `TURSO_DATABASE_URL` | Prod     | Turso/libSQL URL; falls back to a local file |
| `TURSO_AUTH_TOKEN`   | Prod     | Turso auth token                            |

Full documentation for every variable lives in `.env.example` itself. Never
commit real secrets — the repo ignores `.env`/`.env.local`.

## Available Scripts

| Command                 | Description                            |
|-------------------------|----------------------------------------|
| `npm run dev`           | Start the development server           |
| `npm run build`         | Production build                       |
| `npm run start`         | Start the production server            |
| `npm run lint`          | Run ESLint (no warnings allowed)       |
| `npm run lint:fix`      | Auto-fix ESLint issues                 |
| `npm run format`        | Format with Prettier                   |
| `npm run test`          | Run Vitest unit tests (one shot)       |
| `npm run test:watch`    | Run Vitest in watch mode               |
| `npm run test:coverage` | Run tests with coverage report          |
| `npm run test:e2e`      | Run Cypress end-to-end tests            |
| `npm run db:migrate`    | Apply pending migrations                |
| `npm run db:generate`   | Generate a migration from schema changes |
| `npm run db:rollback`   | Roll back the last migration            |
| `npm run db:status`     | Show migration status                   |
| `npm run backup`        | Run the database backup job             |
| `npm run restore`       | Restore the database from a dump        |
| `npm run worker`        | Start the background worker locally     |

## Project Structure

The repository uses a feature-first layout at the repository root (no `src/`
wrapper):

```
app/           Next.js App Router — pages and API route handlers
components/    Reusable React components (ui/, layout/, feature folders)
features/      Feature-scoped business logic
hooks/         Shared React hooks
lib/           Core libraries (auth, db, ai, env validation)
services/      External service integrations (OpenAI, Cloudinary, worker)
actions/       Server Actions
types/         Shared TypeScript types
utils/         Pure utility functions
db/            Database access layer
drizzle/       Drizzle schema, client, and migrations
docs/          Long-form documentation (architecture, API spec, runbooks)
runbooks/      Operational incident runbooks
scripts/       Standalone scripts (migrations, rollback, health checks)
jobs/          Scheduled jobs (backup, restore, trend sync)
tests/         Shared/misc test utilities
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a deeper walkthrough of module
boundaries and data flow.

## Branching Strategy

We follow **trunk-based development** with short-lived feature branches.

- **`main`** is the always-deployable trunk. Pushes to `main` trigger CI and
  staging deployment.
- Create a branch off the latest `main`:

  ```bash
  git checkout main
  git pull
  git checkout -b feat/my-short-description
  ```

- Branch naming conventions:

  | Prefix      | Purpose                          |
  |-------------|----------------------------------|
  | `feat/`     | New feature or user-facing change |
  | `fix/`      | Bug fix                          |
  | `chore/`    | Tooling, refactors, housekeeping  |
  | `docs/`     | Documentation only               |
  | `refactor/` | Code structure without behavior change |

## Commit Messages

We use **Conventional Commits**. Format:

```
<type>(<scope>): <short summary>

[optional body — explain the *why*, not the *what*]
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`,
`ci`. Examples:

```
feat(auth): add forgot-password flow
fix(analysis): guard against null product image
docs(api): document rate-limit headers in OpenAPI spec
```

A commit-msg hook enforces this format — non-conforming commits are rejected
locally.

## Development Workflow

1. Pull latest `main` and create your feature branch.
2. Make focused Conventional Commits as you go. `lint-staged` runs Prettier and
   ESLint on staged files before each commit.
3. Run the full validation suite locally before pushing:

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run test
   npm run build
   ```

4. Push your branch and open a pull request against `main`.

## Pull Requests

Before opening a PR, confirm the [Before Submitting](#before-submitting)
checklist. The PR should describe:

- **What** the change does.
- **Why** it's needed (link to an issue when one exists).
- **How** it was tested (unit, e2e, manual).
- **Screenshots/GIFs** for UI changes.

### Required Checks (CI)

CI runs on every PR and must pass before merge:

- ESLint (no warnings)
- TypeScript typecheck (`tsc --noEmit`)
- Unit tests with a coverage gate (see `docs/testing_policy.md`)
- Production build
- Markdown linting / link validation (for docs changes)

### Review Process

- At least **one** maintainer approval is required.
- Address review comments with new commits (no force-push over reviewed work).
- Keep PRs small and focused; split large PRs into logical parts.
- Squash-merge with a Conventional Commit message when approved.

### Before Submitting

- [ ] `npm run lint` passes with no warnings
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test` passes and coverage is not reduced
- [ ] `npm run build` succeeds
- [ ] New behavior has tests
- [ ] No leftover `console.log`, dead code, or unused imports
- [ ] Docs/README updated if behavior or APIs changed

## Coding Standards

- **TypeScript everywhere** — `strict: true`. No `any` unless truly necessary.
- **Server Components by default** — add `"use client"` only when a component
  needs interactivity, state, or browser APIs.
- **Small, single-responsibility components** — split anything past ~250 lines.
- **Named exports** — prefer named exports over default exports.
- **Early returns & small functions** — avoid deep nesting and nested ternaries.
- **No magic numbers** — extract named constants.
- **Styling** — Tailwind utilities; reuse existing patterns; avoid inline styles.
- **Forms** — React Hook Form + Zod validation with user-friendly messages.
- **Data fetching** — prefer Server Actions / Route Handlers / `fetch()`;
  use `React.cache()` where appropriate.
- **Security** — validate all input, never expose secrets, respect auth on all
  protected routes.
- **Comments** — explain *why*, not *what*.

## Testing

- **Unit/integration**: Vitest. Run with `npm run test` or `npm run test:watch`.
- **Coverage**: `npm run test:coverage` (see `docs/testing_policy.md`).
- **E2E**: Cypress via `npm run test:e2e`.

Write tests for new behavior and update existing tests when behavior changes.
Prefer behavior-over-implementation tests — assert observable outcomes.

## Documentation

Documentation lives in `docs/`. See [`docs/README.md`](./docs/README.md) for
the structure and contribution rules. Highlights:

- **API spec**: `docs/api/swagger.yaml` — keep in sync with route changes. It is
  validated in CI and served at `/api/docs`.
- **Runbooks**: `runbooks/` — operational incident procedures. Update them
  whenever you change how a service is deployed or monitored.

When you change an endpoint, a schema, or an architectural decision, update the
corresponding documentation in the same PR.

## Troubleshooting

| Problem | Likely cause & fix |
|---------|--------------------|
| `npm install` fails on the `prepare` hook | Husky needs git; run `npm install --ignore-scripts` in CI/containers. |
| Dev server can't start / auth errors | `BETTER_AUTH_SECRET` missing or < 16 chars — set it in `.env.local`. |
| `drizzle-kit push` fails on a remote DB | Point `TURSO_DATABASE_URL` locally (`file:./data/suitora.db`) or use Turso CLI / apply migration SQL directly. |
| Tests pass locally but fail in CI | CI uses a fresh DB at `/tmp/ci-migrate.db` — don't depend on local state. |
| Lint flags unused imports/vars | Remove them; CI treats warnings as errors. |
| Real providers firing in dev | Providers fall back to mock in dev; only enable real keys when intended. |

## License

This is a private, proprietary project. All rights reserved — see `README.md`.
