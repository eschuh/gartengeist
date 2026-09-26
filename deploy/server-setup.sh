#!/bin/bash
# Einmalige (und wiederholbare) Einrichtung des Servers. Wird von deploy.ps1 aufgerufen.
# Aufruf: bash server-setup.sh [domain]
# Ohne Domain wird <ip-mit-bindestrichen>.sslip.io verwendet.
set -euo pipefail

DOMAIN="${1:-}"
BASE=/opt/gartengeist
ENV_FILE="$BASE/.env.prod"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker wird installiert …"
  curl -fsSL https://get.docker.com | sh
fi

# Firewall: nur SSH und Web
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw allow 443/udp >/dev/null
  ufw --force enable >/dev/null
fi

mkdir -p "$BASE/backups"

if [ ! -f "$ENV_FILE" ]; then
  if [ -z "$DOMAIN" ]; then
    IP=$(hostname -I | tr ' ' '\n' | grep -E '^[0-9]+(\.[0-9]+){3}$' | head -n 1)
    DOMAIN="${IP//./-}.sslip.io"
  fi
  cat > "$ENV_FILE" <<EOF
DOMAIN=$DOMAIN
POSTGRES_DB=gartengeist
POSTGRES_USER=gartengeist
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_KEY=$(openssl rand -hex 48)
REGISTRIERUNGSCODE=$(tr -dc 'a-z0-9' </dev/urandom | head -c 10)
BACKUP_DIR=$BASE/backups
ANTHROPIC_API_KEY=
EOF
  chmod 600 "$ENV_FILE"
  echo "Neue Konfiguration angelegt: $ENV_FILE"
elif [ -n "$DOMAIN" ]; then
  sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|" "$ENV_FILE"
fi

echo "----------------------------------------"
grep -E '^(DOMAIN|REGISTRIERUNGSCODE)=' "$ENV_FILE"
echo "----------------------------------------"
