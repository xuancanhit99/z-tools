#!/usr/bin/env bash
set -euo pipefail

required_env_vars=(DEPLOY_HOST DEPLOY_USER DEPLOY_PATH)
for name in "${required_env_vars[@]}"; do
  if [ -z "${!name:-}" ]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
done

ENV_FILE="${DEPLOY_ENV_FILE:-.env}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

for cmd in ssh rsync; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

echo "Syncing compose assets to ${REMOTE}:${DEPLOY_PATH}"
ssh -p "$DEPLOY_SSH_PORT" -o StrictHostKeyChecking=accept-new "$REMOTE" "mkdir -p '$DEPLOY_PATH'"
rsync -az --delete -e "ssh -p ${DEPLOY_SSH_PORT}" docker-compose.yml "$ENV_FILE" "$REMOTE:$DEPLOY_PATH/"

echo "Deploying stack on remote host"
ssh -p "$DEPLOY_SSH_PORT" "$REMOTE" "set -euo pipefail; cd '$DEPLOY_PATH'; if docker compose version >/dev/null 2>&1; then C='docker compose'; elif command -v docker-compose >/dev/null 2>&1; then C='docker-compose'; else echo 'Docker Compose is not installed' >&2; exit 1; fi; \$C pull || true; \$C up -d --remove-orphans; \$C ps"

echo "Deployment completed"
