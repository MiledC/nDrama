#!/usr/bin/env bash
# provision-vps.sh — Set up a fresh Linode VPS for nDrama production
#
# Usage:
#   ./scripts/provision-vps.sh --host 172.105.xx.xx --domain yourdomain.com
#   ./scripts/provision-vps.sh --host 172.105.xx.xx --domain yourdomain.com --env-file .env.production
#   ./scripts/provision-vps.sh --host 172.105.xx.xx --domain yourdomain.com --ssh-key ~/.ssh/id_rsa
#
# Prerequisites:
#   - DNS A records for admin.DOMAIN, admin-api.DOMAIN, api.DOMAIN pointing to VPS IP
#   - SSH access to VPS as root

set -euo pipefail

# --- Argument parsing ---
HOST=""
DOMAIN=""
ENV_FILE=""
SUB_ENV_FILE=""
SSH_KEY=""
REPO_URL="https://github.com/MiledC/nDrama.git"
APP_USER="ndrama"
APP_DIR="/home/${APP_USER}/app"

usage() {
    echo "Usage: $0 --host <ip> --domain <domain> [--env-file <path>] [--sub-env-file <path>] [--ssh-key <path>]"
    echo ""
    echo "Options:"
    echo "  --host         VPS IP address (required)"
    echo "  --domain       Base domain, e.g., ndrama.com (required)"
    echo "  --env-file     Local .env.production file to copy to VPS"
    echo "  --sub-env-file Local .env.subscriber.production file to copy to VPS"
    echo "  --ssh-key      SSH private key path (default: default SSH agent)"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --host) HOST="$2"; shift 2 ;;
        --domain) DOMAIN="$2"; shift 2 ;;
        --env-file) ENV_FILE="$2"; shift 2 ;;
        --sub-env-file) SUB_ENV_FILE="$2"; shift 2 ;;
        --ssh-key) SSH_KEY="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

if [[ -z "$HOST" || -z "$DOMAIN" ]]; then
    echo "Error: --host and --domain are required."
    usage
fi

SSH_OPTS="-o StrictHostKeyChecking=accept-new"
if [[ -n "$SSH_KEY" ]]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

ssh_run() {
    ssh $SSH_OPTS "root@${HOST}" "$@"
}

scp_to() {
    scp $SSH_OPTS "$1" "root@${HOST}:$2"
}

echo "=== nDrama VPS Provisioning ==="
echo "Host:   $HOST"
echo "Domain: $DOMAIN"
echo ""

# --- Step 1: System packages ---
echo "[1/13] Updating system packages..."
ssh_run "apt-get update -qq && apt-get upgrade -y -qq"

# --- Step 2: Install Docker ---
echo "[2/13] Installing Docker..."
ssh_run "
    if ! command -v docker &>/dev/null; then
        curl -fsSL https://get.docker.com | sh
    fi
    # Ensure docker compose plugin is available
    docker compose version
"

# --- Step 3: Install Nginx + Certbot ---
echo "[3/13] Installing Nginx and Certbot..."
ssh_run "
    apt-get install -y -qq nginx certbot python3-certbot-nginx
    systemctl enable nginx
"

# --- Step 4: Create app user ---
echo "[4/13] Creating app user '${APP_USER}'..."
ssh_run "
    if ! id -u ${APP_USER} &>/dev/null; then
        useradd -m -s /bin/bash ${APP_USER}
        usermod -aG docker ${APP_USER}
    fi
"

# --- Step 5: Configure UFW firewall ---
echo "[5/13] Configuring firewall (UFW)..."
ssh_run "
    apt-get install -y -qq ufw
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo 'y' | ufw enable
    ufw status
"

# --- Step 6: Clone repository ---
echo "[6/13] Cloning repository to ${APP_DIR}..."
ssh_run "
    if [ -d ${APP_DIR} ]; then
        echo 'App directory exists, pulling latest...'
        cd ${APP_DIR} && git pull
    else
        git clone ${REPO_URL} ${APP_DIR}
        chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
    fi
"

# --- Step 7: Configure Nginx ---
echo "[7/13] Configuring Nginx reverse proxy..."
ssh_run "
    cp ${APP_DIR}/nginx.prod.conf /etc/nginx/sites-available/ndrama
    sed -i 's/DOMAIN/${DOMAIN}/g' /etc/nginx/sites-available/ndrama
    ln -sf /etc/nginx/sites-available/ndrama /etc/nginx/sites-enabled/ndrama
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
"

# --- Step 8: TLS certificates ---
echo "[8/13] Obtaining TLS certificates with Certbot..."
# Temporarily allow HTTP for certbot challenge (nginx must serve port 80)
ssh_run "
    # Stop nginx briefly to get certs via standalone if needed, or use nginx plugin
    certbot --nginx -d admin.${DOMAIN} -d admin-api.${DOMAIN} -d api.${DOMAIN} \
        --non-interactive --agree-tos --email admin@${DOMAIN} \
        --redirect
    systemctl reload nginx
"

# --- Step 9: Set up backup cron ---
echo "[9/13] Setting up daily database backup..."
ssh_run "
    cp ${APP_DIR}/scripts/backup-db.sh /home/${APP_USER}/backup-db.sh
    chmod +x /home/${APP_USER}/backup-db.sh
    mkdir -p /home/${APP_USER}/backups

    # Add cron job for daily backup at 3 AM
    (crontab -u ${APP_USER} -l 2>/dev/null || true; \
     echo '0 3 * * * /home/${APP_USER}/backup-db.sh >> /home/${APP_USER}/backups/cron.log 2>&1') \
     | sort -u | crontab -u ${APP_USER} -
"

# --- Step 10: Copy environment files ---
echo "[10/13] Setting up environment files..."
if [[ -n "$ENV_FILE" ]]; then
    echo "  Copying backend env file..."
    scp_to "$ENV_FILE" "${APP_DIR}/.env.production"
    ssh_run "chown ${APP_USER}:${APP_USER} ${APP_DIR}/.env.production && chmod 600 ${APP_DIR}/.env.production"
else
    echo "  No --env-file provided. Copy .env.production.example and fill in values:"
    echo "    scp .env.production root@${HOST}:${APP_DIR}/.env.production"
fi

if [[ -n "$SUB_ENV_FILE" ]]; then
    echo "  Copying subscriber API env file..."
    scp_to "$SUB_ENV_FILE" "${APP_DIR}/.env.subscriber.production"
    ssh_run "chown ${APP_USER}:${APP_USER} ${APP_DIR}/.env.subscriber.production && chmod 600 ${APP_DIR}/.env.subscriber.production"
else
    echo "  No --sub-env-file provided. Copy .env.subscriber.production.example and fill in values:"
    echo "    scp .env.subscriber.production root@${HOST}:${APP_DIR}/.env.subscriber.production"
fi

# --- Step 11: Start Docker services ---
echo "[11/13] Starting Docker services..."
ssh_run "
    cd ${APP_DIR}
    sudo -u ${APP_USER} docker compose -f docker-compose.prod.yml pull
    sudo -u ${APP_USER} docker compose -f docker-compose.prod.yml up -d
"

# --- Step 12: Run migrations ---
echo "[12/13] Running database migrations..."
ssh_run "
    cd ${APP_DIR}
    # Wait for postgres to be ready
    sleep 5
    sudo -u ${APP_USER} docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
"

# --- Step 13: Health checks ---
echo "[13/13] Running health checks..."
sleep 3
ssh_run "
    echo 'Backend health:'
    curl -sf http://127.0.0.1:8000/health && echo ' OK' || echo ' FAILED'
    echo 'Subscriber API health:'
    curl -sf http://127.0.0.1:8001/health && echo ' OK' || echo ' FAILED'
    echo 'Frontend:'
    curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 && echo ' OK' || echo ' FAILED'
"

echo ""
echo "=== Provisioning complete! ==="
echo "Admin panel: https://admin.${DOMAIN}"
echo "Admin API:   https://admin-api.${DOMAIN}"
echo "Public API:  https://api.${DOMAIN}"
