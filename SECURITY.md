# Security Policy

Suitora takes the security of its software and user data seriously. If you
believe you have found a security vulnerability, please report it responsibly
using the process below.

## Supported Versions

Only the latest release on the `main` branch is actively supported with
security fixes. Older tags are not patched.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < main  | :x:                |

## Reporting a Vulnerability

**Do not open a public GitHub issue** for security vulnerabilities. Instead,
please report privately:

- Email the maintainers: **`security@suitora.app`** (replace with your real
  address before release).
- Optionally encrypt the report with the project's GPG key (see below) if a key
  is published.

Please include, when possible:

1. A concise description of the vulnerability and its impact.
2. The affected version / commit and reproduction steps.
3. Any proof-of-concept or suggested mitigation.

### Response timeline

- **Acknowledgement** — within 3 business days.
- **Triage + severity assessment** — within 7 business days.
- **Fix + coordinated disclosure** — within 30 days for high/critical issues.

We practice responsible disclosure: we ask that you give us time to fix and
release a patch before publishing details.

## Security Controls

The project implements, among others:

- Session-based auth via **Better Auth** with `httpOnly` + `Secure` +
  `SameSite=Lax` cookies and server-side session verification on every private
  API route.
- Strict transport: HSTS preload header, CSP, `X-Frame-Options: DENY`,
  `nosniff`, TLS 1.2/1.3 at the reverse proxy/ingress.
- **Zod** validation on all API request bodies/query params and an **SSRF guard**
  on user-supplied URLs.
- **Rate limiting** on abuse-prone endpoints (login, register, upload, analysis,
  stylist, password reset).
- **Environment fail-fast** validation and `.env*` git-ignored; CI runs **secret
  scanning** (gitleaks) and `npm audit` on every push/PR.

## Incident Response Runbook

1. **Triage** — classify by severity (critical/high/medium/low) and scope.
2. **Contain** — for credential leaks: rotate secrets, revoke sessions, block the
   affected key/provider. For data exposure: isolate or take the affected
   service offline.
3. **Remediate** — apply a fix, release a patched build, redeploy.
4. **Notify** — where required by law/regulation, notify affected users; document
   the incident.
5. **Post-mortem** — record root cause, timeline, and preventive measures.

## Acknowledgements

We thank the security community for their responsible research and disclosure.
