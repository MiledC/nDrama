#!/usr/bin/env bash
# provision-vps.sh — Set up a fresh Linode VPS for nDrama staging
#
# Usage:
#   ./scripts/provision-vps.sh --host 172.105.xx.xx --domain yourdomain.com
#   ./scripts/provision-vps.sh --host 172.105.xx.xx --domain yourdomain.com --ssh-key ~/.ssh/id_rsa
#
# Note: Environment files (.env.staging, .env.subscriber.staging) are managed
# via GitHub Secrets and written to the VPS automatically during CI/CD deployment.
#
# Prerequisites:
#   - DNS A records for admin.DOMAIN, admin-api.DOMAIN, api.DOMAIN pointing to VPS IP
#   - SSH access to VPS as root

set -euo pipefail

# --- Argument parsing ---
HOST=""
DOMAIN=""
SSH_KEY=""
APP_USER="ndrama"
APP_DIR="/home/${APP_USER}/app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
    echo "Usage: $0 --host <ip> --domain <domain> [--ssh-key <path>]"
    echo ""
    echo "Options:"
    echo "  --host         VPS IP address (required)"
    echo "  --domain       Base domain, e.g., ndrama.com (required)"
    echo "  --ssh-key      SSH private key path (default: default SSH agent)"
    echo ""
    echo "Note: Env files are managed via GitHub Secrets (ENV_STAGING,"
    echo "      ENV_SUBSCRIBER_STAGING) and written during CI/CD deploy."
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --host) HOST="$2"; shift 2 ;;
        --domain) DOMAIN="$2"; shift 2 ;;
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
echo "[1/9] Updating system packages..."
ssh_run "apt-get update -qq && apt-get upgrade -y -qq"

# --- Step 2: Install Docker ---
echo "[2/9] Installing Docker..."
ssh_run "
    if ! command -v docker &>/dev/null; then
        curl -fsSL https://get.docker.com | sh
    fi
    # Ensure docker compose plugin is available
    docker compose version
"

# --- Step 3: Install Nginx + Certbot ---
echo "[3/9] Installing Nginx and Certbot..."
ssh_run "
    apt-get install -y -qq nginx certbot python3-certbot-nginx
    systemctl enable nginx
"

# --- Step 4: Create app user + SSH key ---
echo "[4/9] Creating app user '${APP_USER}' and SSH keypair..."
ssh_run "
    if ! id -u ${APP_USER} &>/dev/null; then
        useradd -m -s /bin/bash ${APP_USER}
        usermod -aG docker ${APP_USER}
    fi

    # Generate SSH keypair if not already present
    if [ ! -f /home/${APP_USER}/.ssh/id_ed25519 ]; then
        sudo -u ${APP_USER} mkdir -p /home/${APP_USER}/.ssh
        sudo -u ${APP_USER} ssh-keygen -t ed25519 -f /home/${APP_USER}/.ssh/id_ed25519 -N '' -C '${APP_USER}@\$(hostname)'
        cat /home/${APP_USER}/.ssh/id_ed25519.pub >> /home/${APP_USER}/.ssh/authorized_keys
        chmod 600 /home/${APP_USER}/.ssh/authorized_keys
        chown ${APP_USER}:${APP_USER} /home/${APP_USER}/.ssh/authorized_keys
    fi
"

# Copy private key to local machine
LOCAL_KEY_PATH="${REPO_ROOT}/${APP_USER}_id_ed25519"
scp $SSH_OPTS "root@${HOST}:/home/${APP_USER}/.ssh/id_ed25519" "${LOCAL_KEY_PATH}"
chmod 600 "${LOCAL_KEY_PATH}"
echo "  SSH private key saved to: ${LOCAL_KEY_PATH}"
echo "  Use this for LINODE_SSH_KEY GitHub Secret and local SSH access."

# --- Step 5: Configure UFW firewall ---
echo "[5/9] Configuring firewall (UFW)..."
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

# --- Step 6: Copy project files to VPS ---
echo "[6/9] Copying project files to ${APP_DIR}..."
ssh_run "
    mkdir -p ${APP_DIR}/scripts
    chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
"
scp_to "${REPO_ROOT}/docker-compose.staging.yml" "${APP_DIR}/docker-compose.staging.yml"
scp_to "${REPO_ROOT}/nginx.prod.conf" "${APP_DIR}/nginx.prod.conf"
scp_to "${REPO_ROOT}/scripts/backup-db.sh" "${APP_DIR}/scripts/backup-db.sh"
ssh_run "chown -R ${APP_USER}:${APP_USER} ${APP_DIR}"

# --- Step 7: Obtain TLS certificates ---
echo "[7/9] Obtaining TLS certificates with Certbot..."
# Get certs BEFORE configuring nginx (nginx config references per-domain cert paths)
ssh_run "
    systemctl stop nginx
    certbot certonly --standalone -d admin.${DOMAIN} \
        --non-interactive --agree-tos --email admin@${DOMAIN}
    certbot certonly --standalone -d admin-api.${DOMAIN} \
        --non-interactive --agree-tos --email admin@${DOMAIN}
    certbot certonly --standalone -d api.${DOMAIN} \
        --non-interactive --agree-tos --email admin@${DOMAIN}
"

# --- Step 8: Configure Nginx ---
echo "[8/9] Configuring Nginx reverse proxy..."
ssh_run "
    cp ${APP_DIR}/nginx.prod.conf /etc/nginx/sites-available/ndrama
    sed -i 's/DOMAIN/${DOMAIN}/g' /etc/nginx/sites-available/ndrama
    ln -sf /etc/nginx/sites-available/ndrama /etc/nginx/sites-enabled/ndrama
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl start nginx
"

# --- Step 9: Set up backup cron ---
echo "[9/9] Setting up daily database backup..."
ssh_run "
    cp ${APP_DIR}/scripts/backup-db.sh /home/${APP_USER}/backup-db.sh
    chmod +x /home/${APP_USER}/backup-db.sh
    mkdir -p /home/${APP_USER}/backups

    # Add cron job for daily backup at 3 AM
    (crontab -u ${APP_USER} -l 2>/dev/null || true; \
     echo '0 3 * * * /home/${APP_USER}/backup-db.sh >> /home/${APP_USER}/backups/cron.log 2>&1') \
     | sort -u | crontab -u ${APP_USER} -
"

echo ""
echo "=== Provisioning complete! ==="
echo "Admin panel: https://admin.${DOMAIN}"
echo "Admin API:   https://admin-api.${DOMAIN}"
echo "Public API:  https://api.${DOMAIN}"
echo ""
echo "Next: Push to the 'staging' branch to trigger CI/CD deployment."
echo "CI/CD will write env files (from GitHub Secrets) and start Docker services."
