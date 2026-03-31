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
DEPLOY_HEALTHCHECK_URL="${DEPLOY_HEALTHCHECK_URL:-http://127.0.0.1:8080/api/v1/health}"
DEPLOY_HEALTHCHECK_ATTEMPTS="${DEPLOY_HEALTHCHECK_ATTEMPTS:-20}"
DEPLOY_HEALTHCHECK_INTERVAL_SECONDS="${DEPLOY_HEALTHCHECK_INTERVAL_SECONDS:-5}"
DEPLOY_BE_IMAGE="${DEPLOY_BE_IMAGE:-hyperz-be:local}"
DEPLOY_FE_IMAGE="${DEPLOY_FE_IMAGE:-hyperz-fe:local}"
DEPLOY_BE_ROLLBACK_IMAGE="${DEPLOY_BE_ROLLBACK_IMAGE:-hyperz-be:rollback}"
DEPLOY_FE_ROLLBACK_IMAGE="${DEPLOY_FE_ROLLBACK_IMAGE:-hyperz-fe:rollback}"

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

echo "Syncing repository to ${REMOTE}:${DEPLOY_PATH}"
ssh -p "$DEPLOY_SSH_PORT" -o StrictHostKeyChecking=accept-new "$REMOTE" "mkdir -p '$DEPLOY_PATH'"
rsync -az --delete \
  --exclude ".git" \
  --exclude ".turbo" \
  --exclude "node_modules" \
  --exclude ".next" \
  --exclude "dist" \
  --exclude ".env" \
  -e "ssh -p ${DEPLOY_SSH_PORT}" \
  ./ "$REMOTE:$DEPLOY_PATH/"
rsync -az -e "ssh -p ${DEPLOY_SSH_PORT}" "$ENV_FILE" "$REMOTE:$DEPLOY_PATH/.env"

echo "Deploying stack on remote host"
ssh -p "$DEPLOY_SSH_PORT" "$REMOTE" \
  DEPLOY_PATH="$DEPLOY_PATH" \
  DEPLOY_HEALTHCHECK_URL="$DEPLOY_HEALTHCHECK_URL" \
  DEPLOY_HEALTHCHECK_ATTEMPTS="$DEPLOY_HEALTHCHECK_ATTEMPTS" \
  DEPLOY_HEALTHCHECK_INTERVAL_SECONDS="$DEPLOY_HEALTHCHECK_INTERVAL_SECONDS" \
  DEPLOY_BE_IMAGE="$DEPLOY_BE_IMAGE" \
  DEPLOY_FE_IMAGE="$DEPLOY_FE_IMAGE" \
  DEPLOY_BE_ROLLBACK_IMAGE="$DEPLOY_BE_ROLLBACK_IMAGE" \
  DEPLOY_FE_ROLLBACK_IMAGE="$DEPLOY_FE_ROLLBACK_IMAGE" \
  'bash -s' <<'EOF'
set -euo pipefail

cd "$DEPLOY_PATH"

if docker compose version >/dev/null 2>&1; then
  compose_cmd=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose_cmd=(docker-compose)
else
  echo "Docker Compose is not installed on remote host" >&2
  exit 1
fi

copy_image_if_exists() {
  local source_image="$1"
  local target_image="$2"
  if docker image inspect "$source_image" >/dev/null 2>&1; then
    docker image tag "$source_image" "$target_image"
    return 0
  fi
  return 1
}

http_probe() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --silent --show-error "$url" >/dev/null
    return $?
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -q --spider "$url"
    return $?
  fi
  echo "Neither curl nor wget is installed on remote host" >&2
  return 127
}

wait_for_health() {
  local url="$1"
  local attempts="$2"
  local interval_seconds="$3"
  for ((i=1; i<=attempts; i++)); do
    if http_probe "$url"; then
      echo "Health check passed: $url"
      return 0
    fi
    echo "Waiting for health check ($i/$attempts): $url"
    sleep "$interval_seconds"
  done
  return 1
}

be_backup_exists=false
fe_backup_exists=false
if copy_image_if_exists "$DEPLOY_BE_IMAGE" "$DEPLOY_BE_ROLLBACK_IMAGE"; then
  be_backup_exists=true
  echo "Backed up $DEPLOY_BE_IMAGE -> $DEPLOY_BE_ROLLBACK_IMAGE"
else
  echo "No existing backup source image for $DEPLOY_BE_IMAGE"
fi
if copy_image_if_exists "$DEPLOY_FE_IMAGE" "$DEPLOY_FE_ROLLBACK_IMAGE"; then
  fe_backup_exists=true
  echo "Backed up $DEPLOY_FE_IMAGE -> $DEPLOY_FE_ROLLBACK_IMAGE"
else
  echo "No existing backup source image for $DEPLOY_FE_IMAGE"
fi

"${compose_cmd[@]}" up -d --build --remove-orphans
"${compose_cmd[@]}" ps

if wait_for_health "$DEPLOY_HEALTHCHECK_URL" "$DEPLOY_HEALTHCHECK_ATTEMPTS" "$DEPLOY_HEALTHCHECK_INTERVAL_SECONDS"; then
  echo "Remote deployment succeeded"
  exit 0
fi

echo "Health check failed; attempting rollback" >&2
if [ "$be_backup_exists" = true ] && [ "$fe_backup_exists" = true ]; then
  docker image tag "$DEPLOY_BE_ROLLBACK_IMAGE" "$DEPLOY_BE_IMAGE"
  docker image tag "$DEPLOY_FE_ROLLBACK_IMAGE" "$DEPLOY_FE_IMAGE"
  "${compose_cmd[@]}" up -d --no-build --remove-orphans
  "${compose_cmd[@]}" ps
  if wait_for_health "$DEPLOY_HEALTHCHECK_URL" "$DEPLOY_HEALTHCHECK_ATTEMPTS" "$DEPLOY_HEALTHCHECK_INTERVAL_SECONDS"; then
    echo "Rollback succeeded; previous release restored" >&2
  else
    echo "Rollback failed health check; manual intervention required" >&2
  fi
else
  echo "Rollback images missing; cannot automatically restore previous release" >&2
fi

exit 1
EOF

echo "Deployment completed"
