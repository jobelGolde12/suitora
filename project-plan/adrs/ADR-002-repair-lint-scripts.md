# ADR-002: Repair ESLint Tooling with Flat Config

- **Status:** Accepted
- **Date:** 2026-08-11
- **Related:** roadmap Phase A (A1, A2, A3)

## Context

The `lint` scripts in `package.json` referenced `./src/**/*.ts`, but the
repository has no `src/` wrapper — the tree lives at the root (`app/`,
`components/`, `lib/`, …). Running `npm run lint` therefore errored with
`No files matching the pattern "src/**/*.ts"` and CI lint was red.

Additionally, a file named `.eslintrc.js` existed that contained prose (an
AI-session summary), not a valid ESLint config. ESLint 9 uses the flat config
(`eslint.config.mjs`); the legacy `.eslintrc` file was dead weight and a
corruption risk (blocker G-01).

## Decision

- Retarget the scripts to the real tree and keep strictness:
  - `lint: eslint . --max-warnings=0`
  - `lint:fix: eslint . --fix`
  - `format: prettier --write "app/**" "components/**" "lib/**" …`
- Delete `.eslintrc.js`; `eslint.config.mjs` is the single source of truth.
- Keep `--max-warnings=0` so CI treats warnings as errors.
- Document the lint scope (globs + ignores) in comments inside
  `eslint.config.mjs` (flat-config coverage audit, A3).

## Consequences

- `npm run lint` exits 0 with zero warnings from a clean shell.
- One authoritative ESLint config; no split-brain between legacy and flat
  config files.
- Contributors must keep new files inside the globbed dirs or extend the
  config explicitly.

## Alternatives Rejected

- **Keep `.eslintrc.js` and migrate its content** — the file contained prose,
  not rules; nothing to migrate.
- **Point scripts at `**/*.{ts,tsx}`** — would lint `node_modules`, `.next`,
  and generated files; too broad.
- **Downgrade ESLint to a legacy-config version** — unnecessary; the flat
  config already lints the full tree cleanly.
