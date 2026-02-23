# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.0.x   | Yes       |
| 1.5.x   | Yes       |
| < 1.5   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in NeumanOS, please report it responsibly.

**Email:** [os@neuman.dev](mailto:os@neuman.dev)

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

You will receive an acknowledgment within 48 hours. We aim to provide a fix or mitigation within 7 days for critical issues.

## Security Architecture

NeumanOS is a local-first application with a zero-data-host architecture:

- **No backend server** — all data stored locally in IndexedDB
- **No accounts or authentication** — nothing to breach
- **BYOK (Bring Your Own Key)** — AI provider API keys are encrypted with AES-256-GCM using PBKDF2 (600k iterations) before storage
- **Encryption passwords are never persisted** — they exist only in memory during the session
- **Content Security Policy** — strict CSP headers enforced via Cloudflare Pages `_headers` file

## Known Limitations

- `unsafe-eval` is required in CSP for WebContainers (Phantom Shell feature)
- AI provider API keys transit the browser network when making API calls (inherent to BYOK browser apps)
- Some npm dependencies have reported vulnerabilities in transitive packages (eslint toolchain, archiver in write-excel-file) that do not affect end users — these are dev-time or client-side-only with no exploitable attack vector

## Scope

The following are **in scope** for security reports:

- XSS, injection, or data exfiltration vulnerabilities
- Encryption implementation weaknesses
- Privacy violations (data leaving the device without user action)
- CSP bypass vectors

The following are **out of scope**:

- Vulnerabilities requiring physical access to the user's device
- Issues in third-party dependencies with no exploitable path in NeumanOS
- Browser-level vulnerabilities
