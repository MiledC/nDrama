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
COMPOSE_FILE="${APP_DIR}/docker-compose.staging.yml"

echo "=== nDrama Manual Deploy ==="
echo "Directory: ${APP_DIR}"
echo ""

# Pull latest code
echo "[1/5] Pulling latest code..."
cd "$APP_DIR"
git pull origin staging

# Pull latest images
echo "[2/5] Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" pull

# Run migrations before restarting
echo "[3/5] Running database migrations..."
docker compose -f "$COMPOSE_FILE" up -d postgres
sleep 5
docker compose -f "$COMPOSE_FILE" run --rm backend alembic upgrade head

# Restart services
echo "[4/5] Restarting services..."
docker compose -f "$COMPOSE_FILE" up -d

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
    echo "  docker compose -f $COMPOSE_FILE logs --tail=50"
    exit 1
fi
