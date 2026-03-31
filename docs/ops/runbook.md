# DevOps Runbook (Sprint 0)

## Local stack

1. Copy env template: `cp .env.example .env`
2. Start services: `docker compose up -d`
3. View status: `docker compose ps`
4. Stop services: `docker compose down`

Services started by default:
- FE: `http://localhost:${FE_PORT}` (nginx placeholder)
- BE: `http://localhost:${BE_PORT}` (node placeholder)
- PostgreSQL: `${POSTGRES_PORT}`
- Redis: `${REDIS_PORT}`
- MinIO API: `http://localhost:${MINIO_API_PORT}`
- MinIO Console: `http://localhost:${MINIO_CONSOLE_PORT}`

## CI baseline

Workflow file: `.github/workflows/ci.yml`
- Validates Docker Compose configuration
- Runs Node lint/test/build where `package.json` exists

## VPS deploy (MVP)

Script: `scripts/deploy_vps.sh`

Required env vars before running:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`

Optional:
- `DEPLOY_SSH_PORT` (default `22`)
- `DEPLOY_ENV_FILE` (default `.env`)

Example:

```bash
cp .env.example .env
export DEPLOY_HOST=1.2.3.4
export DEPLOY_USER=ubuntu
export DEPLOY_PATH=/opt/hyperz
./scripts/deploy_vps.sh
```

## Monitoring/logging baseline recommendations

- Keep container `restart: unless-stopped` for runtime resilience.
- Use `docker compose ps` and `docker compose logs -f <service>` for first-line triage.
- Add centralized logs (Loki/ELK) and metrics (Prometheus + Grafana) in next sprint.
