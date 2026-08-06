## Current State Analysis
- README may be minimal, API docs absent
- No OpenAPI Spec
- No runbooks for incidents
- No CONTRIBUTING.md or ARCHITECTURE.md

## Production Gaps
- Missing OpenAPI spec
- No runbooks for common incidents such as DB overload service crash
- No contribution guidelines
- No architecture overview document

## Strategic Action Items
1. Generate OpenAPI spec from API routes output /docs/api/swagger.yaml
2. Serve Swagger UI at /api/docs using swagger-ui-express
3. Create CONTRIBUTING.md outlining development workflow, linting, testing
4. Create ARCHITECTURE.md summarizing services, data flow, scaling strategy
5. Write runbooks
   - /runbooks/database-backup.md
   - /runbooks/service-restart.md
   - /runbooks/crash-alert.md
6. Add CI step to validate Markdown links and structure
7. Host documentation on GitHub Pages from /docs

## Success Metrics
- OpenAPI spec is up to date, UI accessible and renders correctly
- All runbooks reviewed and stored in /runbooks each covers RTO RPO
- New contributors can onboarding within one day using CONTRIBUTING.md
- Documentation builds successfully on each CI run without errors