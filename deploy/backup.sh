#!/bin/sh
# Läuft im Backup-Container: täglich Datenbank-Dump (14 Tage aufbewahren),
# sonntags zusätzlich ein Archiv der Fotos (die letzten 4 aufbewahren).
set -eu

while true; do
  stamp=$(date +%F)
  echo "Backup $stamp …"

  pg_dump -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "/backups/db-$stamp.dump"
  find /backups -name 'db-*.dump' -mtime +14 -delete

  if [ "$(date +%u)" = "7" ] || ! ls /backups/fotos-*.tar >/dev/null 2>&1; then
    tar -cf "/backups/fotos-$stamp.tar" -C /uploads .
    ls -1t /backups/fotos-*.tar | tail -n +5 | xargs -r rm -f
  fi

  echo "Backup $stamp fertig."
  sleep 86400
done
