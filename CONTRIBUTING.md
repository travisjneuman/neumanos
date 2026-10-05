# Contributing to NeumanOS

Thank you for your interest in contributing to NeumanOS! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/neumanos.git
   cd neumanos
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Development

### Prerequisites

- Node.js 22+ (see `.node-version`)
- npm 10+

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run unit tests (Vitest) |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run test:browser:inventory` | Static browser-test inventory (no browser launch) |
| `npm run test:e2e` | Hosted GitHub Actions only; fails closed outside the approved runner |

Browser tests run only through the repository's manual **Hosted browser tests** GitHub Actions workflow. Do not install or launch Playwright browsers locally, and never point the suite at production or provide account credentials. The hosted workflow builds a local production preview and uses synthetic test data.

### Before Submitting

1. Run tests: `npm run test`
2. Run type-check: `npm run type-check`
3. Ensure the build succeeds: `npm run build`

## Code Style

- TypeScript strict mode, no `any` types
- Tailwind CSS with semantic tokens (no hardcoded colors)
- Zustand for state management
- Zod for validation at I/O boundaries
- Small functions (<50 lines), small files (<300 lines)

## Architecture

NeumanOS is a local-first application. All data stays on the user's device via IndexedDB (Dexie). There is no backend server.

Key principles:
- **Privacy first**: no PII collection, no server data exfiltration
- **Local-first**: works offline, all data in IndexedDB
- **Build, don't wrap**: we build features, we use utility libraries

The codebase uses React 19, TypeScript 5.9 (strict), Vite 7, and Zustand 5 for state management. Data persistence is handled by Dexie (IndexedDB wrapper).

## Pull Requests

- Keep PRs focused and atomic
- Include a clear description of what changed and why
- Update tests for new behavior
- Update relevant documentation if feature behavior changed

## Reporting Issues

Open an issue at [github.com/travisjneuman/neumanos/issues](https://github.com/travisjneuman/neumanos/issues).

Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
