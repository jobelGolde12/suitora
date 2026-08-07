# Suitora Documentation

Central index for Suitora's long-form documentation. This folder is the single
source of truth for technical and operational knowledge beyond the top-level
`README.md`.

## Structure

| Path                              | Contents                                              |
|-----------------------------------|-------------------------------------------------------|
| `docs/api/swagger.yaml`           | OpenAPI 3.0 spec for the public API. Source of truth for `/api/docs`. |
| `docs/runbooks.md`                | Alert runbooks tied to the observability stack        |
| `docs/data_schema.md`             | Database schema reference                             |
| `docs/testing_policy.md`          | Test strategy and coverage requirements               |
| `docs/migration.md`               | Migration workflow and conventions                    |
| `../ARCHITECTURE.md`              | High-level system architecture and data flow           |
| `../CONTRIBUTING.md`              | Contributor onboarding guide                           |
| `../runbooks/`                    | Operational incident runbooks (backup, restart, crash) |

This index lists only the key entry points; other planning and design docs
live alongside them in `docs/`.

## How to Contribute Updates

1. Make a focused change and keep it in sync with the code it documents.
2. If you change an API route or schema, update `docs/api/swagger.yaml` **in
   the same PR** — CI validates the spec and the docs route serves it.
3. If you change how a service is deployed or monitored, update the relevant
   runbook in `../runbooks/`.
4. Run the markdown checks locally before pushing (see below).

## Markdown Checks

Documentation is validated in CI and can be run locally:

```bash
npm run lint:md          # markdownlint over all .md files
npm run check:links      # markdown-link-check over key docs
```

Rules are defined in `.markdownlint.json` at the repository root. Broken links
or lint errors block merging.

## Ownership Model

| Section                       | Owner          |
|-------------------------------|----------------|
| `docs/api/swagger.yaml`       | Backend/API    |
| `docs/runbooks.md`, `../runbooks/` | On-call/Platform |
| `docs/testing_policy.md`      | QA/Engineering |
| `docs/data_schema.md`         | Backend/Data   |
| `../ARCHITECTURE.md`          | Engineering lead |
| `../CONTRIBUTING.md`          | Engineering lead |

Review this folder quarterly to keep links and examples current.
