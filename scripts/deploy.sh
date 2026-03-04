#!/usr/bin/env bash
# deploy.sh — Manual deployment fallback for nDrama
# Run on the VPS when you need to deploy without GitHub Actions.
#
# Usage (from VPS):
#   cd ~/app && ./scripts/deploy.sh
#
# Usage (from local machine):
#   ssh ndrama@your-vps "cd ~/app && ./scripts/deploy.sh"

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${APP_DIR}/.env.staging"
COMPOSE_FILE="${APP_DIR}/docker-compose.staging.yml"
COMPOSE="docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE}"

echo "=== nDrama Manual Deploy ==="
echo "Directory: ${APP_DIR}"
echo ""

# Pull latest code
echo "[1/5] Pulling latest code..."
cd "$APP_DIR"
git pull origin staging

# Pull latest images
echo "[2/5] Pulling latest Docker images..."
$COMPOSE pull

# Run migrations before restarting
echo "[3/5] Running database migrations..."
$COMPOSE up -d postgres
sleep 5
$COMPOSE run --rm backend alembic upgrade head

# Restart services
echo "[4/5] Restarting services..."
$COMPOSE up -d

# Health checks
echo "[5/5] Running health checks..."
sleep 5

HEALTHY=true

echo -n "  Backend:        "
if curl -sf http://127.0.0.1:8000/health > /dev/null; then
    echo "OK"
else
    echo "FAILED"
    HEALTHY=false
fi

echo -n "  Subscriber API: "
if curl -sf http://127.0.0.1:8001/health > /dev/null; then
    echo "OK"
else
    echo "FAILED"
    HEALTHY=false
fi

echo -n "  Frontend:       "
if curl -sf -o /dev/null http://127.0.0.1:3000; then
    echo "OK"
else
    echo "FAILED"
    HEALTHY=false
fi

echo ""
if [ "$HEALTHY" = true ]; then
    echo "=== Deploy successful! ==="
else
    echo "=== Deploy completed with health check failures. Check logs: ==="
    echo "  $COMPOSE logs --tail=50"
    exit 1
fi
