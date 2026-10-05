# AGENTS.md — Provider-Agnostic Agent Instructions

## Workspace storage conservation

<!-- workspace-scratch-storage-contract-v1 -->
Use only this repository's existing canonical live checkout. A dirty, divergent, detached, ambiguous, or concurrently owned checkout is a blocker: preserve it and stop. Do not create a clone, fork, worktree, feature branch, full repository/workspace copy, or external dependency/build environment to bypass that blocker. Never place repositories, worktrees, workspace copies, package installations, builds, or development servers under `/tmp` or `/private/tmp`, including aliases that resolve there. Small, bounded non-repository temporary files remain allowed. Load the Agent Operating Layer `workspace-scratch-storage-policy` contract through the workspace registry when available.


<!-- phase-5-provider-agnostic-baseline -->

Last updated: 2026-04-29

## Project overview

NeumanOS is a privacy-first, local-only productivity app built with React, TypeScript, Vite, IndexedDB/local storage, Vitest, and a hosted-only Playwright browser-test suite.

## Operating rules for AI agents

- Read before editing: inspect README.md, package.json, docs/config, and nearby source before making changes.
- Preserve existing documentation. Do not delete docs; update or append when behavior changes.
- Do not modify CLAUDE.md files if one is added later.
- Prefer compatibility-first changes. Avoid breaking data storage, import/export behavior, public routes, or documented workflows unless explicitly requested.
- Do not commit, push, deploy, rotate secrets, or run destructive commands unless explicitly asked in the current session.

## Documentation expectations

- Update README/docs when commands, user-visible behavior, data contracts, environment variables, or operational procedures change.
- Include or update tests for code changes when the documented test toolchain applies.

## Public Copy Style (owner rule, 2026-10-05)

Canonical copy: `tjn.portfolio/AGENTS.md`. Everything a visitor can read (site copy, README, docs pages, meta tags, titles, alt text, UI strings) must sound like Travis wrote it.

- **No em dashes (—)** anywhere public, and no spaced en dashes used as em dashes. Use a colon, a comma, parentheses, or a new sentence. Titles use ` | ` (for example `About | Site Name`).
- First person where a person is speaking, plain words, short sentences. Say what it does and what happened.
- Avoid AI tells: "not X but Y" / "rather than" setups, "built as a … surface", "demonstrates", "showcases", "leverage", "seamless", "robust", "passionate", "journey", slogans, and stacked triplets used for rhythm.
- No meta talk about the project's public positioning. If something is private, say so once, plainly.
- Only verified facts and numbers. Employers stay anonymized; named clients need Travis's OK.

## Build, test, and local commands

Only run commands supported by checked-in docs/config. Confidently discovered commands:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run build:production`
- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npm run test:browser:inventory` (static, no browser)
- `npm run type-check`
- `npm run audit`
- `npm run ci`

Browser tests are prohibited on TJNMPM. Do not run `npm run test:e2e`, a Playwright CLI, a browser installer, or a browser server locally. The sole approved execution lane is the manual `Hosted browser tests` GitHub Actions workflow on GitHub-hosted Linux. It uses synthetic data and a task-owned production preview; it must not target production or receive credentials.

Current unit-test baseline after the April 29, 2026 maintenance pass: `npm test -- --run` runs 24 Vitest files / 694 tests.

## Dependency/security maintenance notes

- Use controlled `npm audit fix` / targeted package updates first; avoid `npm audit fix --force` unless the breaking changes are understood and verified.
- `uuid` is intentionally constrained to `^14.0.0`, and package overrides keep transitive `serialize-javascript` / Mermaid `uuid` on fixed versions. Re-check these before removing overrides.
- Vitest setup installs an in-memory `localStorage` shim before test modules load. Zustand persisted stores hydrate during import, so do not move that shim later in the setup file.

## Compatibility and safety constraints

- Local-first privacy is a core constraint: do not add server dependency, account requirement, or cloud sync without explicit approval.
- Preserve IndexedDB/local-storage data compatibility, `.brain` backup/restore behavior, and export/import paths.
- Treat API-provider keys as local user secrets. Never print, commit, or invent credentials, tokens, cookies, private keys, OAuth secrets, API keys, personal data, or production-only configuration. Use placeholders in docs/examples.

## Showcase facts contract

This repo is showcased on travisjneuman.com and github.com/travisjneuman.
`showcase.json` is the only source for public facts about this project
(schema: travisjneuman/travisjneuman `showcase/schema/showcase-v1.json`).

- If a change affects anything in it (counts, version, status, stack, links,
  summary), update `showcase.json` in the same commit. Re-run each metric's
  `source` command; never guess. `floor-2sig` metrics round down to two
  significant digits plus "+" (398 -> "390+").
- Set `updated` (and the touched metric's `asOf`) to today's date.
- Never put private URLs, hostnames, user data, or private names in it.
- The profile repo's `scripts/showcase/sync-showcase.mjs` regenerates the GitHub
  cards, README table, and portfolio data from these files.
