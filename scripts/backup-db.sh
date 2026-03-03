#!/usr/bin/env bash
# backup-db.sh — Daily PostgreSQL backup for nDrama
# Installed on VPS by provision-vps.sh, runs via cron.
#
# Backups are stored in ~/backups/ with 30-day retention.

set -euo pipefail

BACKUP_DIR="${HOME}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ndrama_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30
COMPOSE_FILE="${HOME}/app/docker-compose.prod.yml"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Dump via the running postgres container
docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-ndrama}" "${POSTGRES_DB:-ndrama}" \
    | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($FILESIZE)"

# Remove backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "ndrama_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Cleaned up $DELETED backup(s) older than ${RETENTION_DAYS} days"
fi

echo "[$(date)] Backup complete."
