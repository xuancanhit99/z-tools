# Contributing

## Workflow

- Create small, reviewable changes.
- Keep one concern per pull request.
- Update docs when contracts, conventions, or setup expectations change.
- Do not merge API shape changes without updating `docs/api-contracts.md`.

## Naming Conventions

- Packages and folders: `kebab-case`
- NestJS modules, services, controllers, DTOs: `PascalCase`
- Variables, functions, hooks, methods: `camelCase`
- React components: `PascalCase`
- Route segments: use stable nouns such as `tools`, `auth`, `admin`

## Folder Structure Rules

- Place domain code close to the owning module.
- Avoid generic folders such as `helpers`, `utils`, or `common` until a second concrete use case exists.
- Backend feature modules should follow `src/<domain>/<domain>.module.ts` plus colocated controller, service, and DTO files.
- Frontend feature code should live under `src/app` for routes and under `src/features` once reusable domain UI appears.

## TypeScript Rules

- Enable strict typing everywhere.
- Prefer explicit return types for exported functions and NestJS public methods.
- Never use `any` in application code unless accompanied by a comment explaining why the boundary cannot be typed yet.
- Centralize environment parsing at process boundaries.

## API and Data Rules

- All external payloads must have DTO or schema ownership on the API side.
- IDs use UUIDs at the API boundary.
- Timestamps use ISO 8601 UTC strings.
- Tool execution endpoints must be auditable and idempotency-aware where retries may happen.

## Review Gates

- No merge without passing lint, typecheck, and test steps for touched packages.
- No silent contract drift between FE and BE.
- No cross-package imports that bypass declared package boundaries.
- Database schema changes require migration ownership in the backend layer.

## Ownership Split

- Tech Lead owns architecture baseline, module boundaries, and contract direction.
- FE owns route implementation and UI state handling inside `apps/web`.
- BE owns domain logic, persistence, and auth inside `apps/api`.
- DevOps owns Docker Compose, CI, deployment scripts, and environment provisioning.
