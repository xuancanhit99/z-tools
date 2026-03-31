# DevOps Runbook (Sprint 1)

## Local stack

1. Copy env template: `cp .env.example .env`
2. Start services: `docker compose up -d`
3. View status: `docker compose ps`
4. Stop services: `docker compose down`
5. Follow logs if startup fails: `docker compose logs -f be fe postgres redis minio`

Services started by default:
- FE: `http://localhost:${FE_PORT}` (Next.js app)
- BE: `http://localhost:${BE_PORT}/api/v1/health` (NestJS API)
- PostgreSQL: `${POSTGRES_PORT}`
- Redis: `${REDIS_PORT}`
- MinIO API: `http://localhost:${MINIO_API_PORT}`
- MinIO Console: `http://localhost:${MINIO_CONSOLE_PORT}`

FE runtime toggles:
- `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080/api/v1`)
- `NEXT_PUBLIC_USE_MOCK_API` (default `true`)

Auth seed defaults (local/dev only):
- `AUTH_SEED_ENABLED=true`
- `AUTH_SEED_EMAIL=admin@hyperz.local`
- `AUTH_SEED_PASSWORD=admin123`
- `AUTH_SEED_ROLE=admin`

## CI baseline

Workflow file: `.github/workflows/ci.yml`
- Validates Docker Compose configuration
- Runs per-app Node CI for `@hyperz/api` and `@hyperz/web`:
  - `pnpm install`
  - `pnpm --filter @hyperz/<app> lint`
  - `pnpm --filter @hyperz/<app> build`
- Builds `apps/api/Dockerfile` and `apps/web/Dockerfile`
- Boots compose stack in CI and waits for container health checks (`postgres`, `redis`, `be`, `fe`)

## VPS deploy (MVP)

Script: `scripts/deploy_vps.sh`

Behavior:
- Syncs repo source to remote path (excludes `.git`, `node_modules`, build artifacts).
- Uploads selected env file as remote `.env`.
- Runs `docker compose up -d --build --remove-orphans`.
- Probes health endpoint after deploy.
- If health fails, retags rollback images and restores prior release (`--no-build`).

Required env vars before running:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`

Optional:
- `DEPLOY_SSH_PORT` (default `22`)
- `DEPLOY_ENV_FILE` (default `.env`)
- `DEPLOY_HEALTHCHECK_URL` (default `http://127.0.0.1:8080/api/v1/health`)
- `DEPLOY_HEALTHCHECK_ATTEMPTS` (default `20`)
- `DEPLOY_HEALTHCHECK_INTERVAL_SECONDS` (default `5`)
- `DEPLOY_BE_IMAGE`, `DEPLOY_FE_IMAGE` (default compose image tags)
- `DEPLOY_BE_ROLLBACK_IMAGE`, `DEPLOY_FE_ROLLBACK_IMAGE`

Example:

```bash
cp .env.example .env
export DEPLOY_HOST=1.2.3.4
export DEPLOY_USER=ubuntu
export DEPLOY_PATH=/opt/stacks/z-tools
export DEPLOY_HEALTHCHECK_URL=http://127.0.0.1:8080/api/v1/health
./scripts/deploy_vps.sh
```

## Monitoring/logging baseline recommendations

- Keep container `restart: unless-stopped` for runtime resilience.
- Use `docker compose ps` and `docker compose logs -f <service>` for first-line triage.
- Use API health endpoint as deployment gate in automation.
- Add centralized logs (Loki/ELK) and metrics (Prometheus + Grafana) in next sprint.
