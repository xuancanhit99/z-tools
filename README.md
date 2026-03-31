# HyperZ Tools

HyperZ Tools is an internal web platform that packages useful developer tools behind a single authenticated interface.

## Sprint 0 Baseline

- Monorepo: `pnpm` workspace + Turborepo
- Frontend: Next.js 14 (App Router) in `apps/web`
- Backend: NestJS in `apps/api`
- Data layer: PostgreSQL for source-of-truth relational data
- Cache and ephemeral state: Redis
- Auth: internal JWT, synchronous request/response for phase 1
- Runtime target: VPS + Docker Compose

## Repository Layout

```text
apps/
  api/        NestJS application
  web/        Next.js application
docs/
  api-contracts.md
  architecture-baseline.md
packages/
  typescript-config/
```

## Module Boundaries

- `apps/web` owns UI rendering, route composition, client-side form validation, and API consumption.
- `apps/api` owns authentication, tool catalog metadata, execution orchestration, admin CRUD, and persistence.
- Tool execution remains server-side. The frontend never executes arbitrary tool logic directly.
- Shared contracts should be promoted into a dedicated package only after FE and BE agree they are stable enough to version.

## Local Development

```bash
pnpm install
docker compose up -d postgres
DATABASE_URL=postgresql://hyperz:hyperz_dev_password@localhost:5432/hyperz pnpm --filter @hyperz/api migration:run
pnpm dev
```

Expected dev ports:

- Web: `3000`
- API: `8080`

For container-based local setup, copy `.env.example` to `.env` and use `docker compose up -d`.

Default local auth seed (when `AUTH_SEED_ENABLED=true`):
- email: `admin@hyperz.local`
- password: `admin123`

## Engineering Rules

- Keep route, module, and package names explicit and domain-driven.
- Prefer vertical slices by domain over shared dumping grounds.
- Treat `docs/api-contracts.md` as the current source of truth until shared DTO packages exist.
- Do not add infrastructure concerns into app modules; DevOps owns deployment, CI, and container wiring.

## Current Deliverables

- Architecture baseline: [docs/architecture-baseline.md](./docs/architecture-baseline.md)
- API contracts draft: [docs/api-contracts.md](./docs/api-contracts.md)
- Sprint 1 implementation guidance: [docs/sprint1-implementation-guidance.md](./docs/sprint1-implementation-guidance.md)
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
