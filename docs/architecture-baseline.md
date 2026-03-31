# Architecture Baseline

## Chosen Stack

- Frontend: Next.js 14 with App Router
- Backend: NestJS
- Database: PostgreSQL
- Cache: Redis
- Auth: internal JWT
- Runtime: VPS + Docker Compose

## Domain Shape

Phase 1 scope is intentionally narrow:

- tool catalog
- tool detail
- tool execution
- auth
- admin CRUD

Execution is synchronous for phase 1. WebSocket or job-queue orchestration stays out of the initial slice unless latency or reliability forces a change.

## Monorepo Decision

Turborepo is the baseline because the current need is orchestration, caching, and a simple workspace topology. Nx would be viable later if the repo grows into heavier generators, graph enforcement, or multi-team plugin workflows.

## Proposed Backend Modules

- `auth`
- `health`
- `tools`
- `executions`
- `admin-tools`
- `users`

## Proposed Frontend Routes

- `/login`
- `/tools`
- `/tools/[toolSlug]`
- `/tools/[toolSlug]/execute`
- `/admin/tools`

## Data Ownership

- PostgreSQL stores users, tool definitions, execution history, and admin-managed metadata.
- Redis stores cache entries, throttling state, and short-lived execution coordination only.
- Binary assets are out of scope for phase 1 unless DevOps introduces object storage later.

## Review Gates

- FE cannot invent new response fields without API contract updates.
- BE cannot change DTOs without documenting contract impact.
- Shared abstractions must prove at least two real call sites before extraction.
