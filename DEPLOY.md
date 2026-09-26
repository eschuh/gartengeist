# Gartengeist auf einem Server betreiben

Damit ihr Gartengeist im Garten auf dem Handy nutzen könnt, läuft die App auf einem kleinen Cloud-Server. Die Befehle unten werden in PowerShell auf dem PC ausgeführt, im Ordner `c:\dev\gartengeist`.

## 1. Server mieten

Ein kleiner Linux-Server reicht, zum Beispiel:

- **Infomaniak VPS Lite** (Schweiz)
- **Hetzner Cloud CX22** (Deutschland/Finnland), ca. 4–5 € im Monat

Beim Anlegen:

- **Betriebssystem:** Ubuntu 24.04
- **Größe:** mindestens 2 GB RAM, besser 4 GB. Die App wird auf dem Server gebaut.
- **SSH-Key:** den eigenen öffentlichen Schlüssel hinterlegen (siehe unten). Kein Passwort-Login.
- **Backups:** Die Backup-Option des Anbieters einschalten (meist +20 %). Dann sind die Daten auch gesichert, wenn der ganze Server verloren geht.

### SSH-Schlüssel

Prüfen, ob schon einer existiert:

```powershell
Get-Content $HOME\.ssh\id_ed25519.pub
```

Falls nicht, einen anlegen und dabei die Fragen mit Enter bestätigen:

```powershell
ssh-keygen -t ed25519
```

Den Inhalt von `id_ed25519.pub` beim Anbieter als SSH-Key eintragen.

Danach einmal die Verbindung testen. Beim ersten Mal den Fingerabdruck mit `yes` bestätigen:

```powershell
ssh root@<IP-DES-SERVERS> "echo ok"
```

## 2. Adresse (Domain)

- **Ohne eigene Domain:** Die App ist automatisch unter `https://<ip-mit-bindestrichen>.sslip.io` erreichbar, z. B. `https://203-0-113-5.sslip.io`.
- **Mit eigener Domain**, z. B. `garten.meinname.ch`: beim Domain-Anbieter einen A-Eintrag auf die IP des Servers setzen und beim ersten Deploy `-Domain garten.meinname.ch` angeben.

Das HTTPS-Zertifikat holt der Server automatisch.

Falls die angezeigte sslip.io-Adresse eine interne IP enthält (z. B. `10-…` oder `172-…`), liegt der Server hinter einer Netzwerk-Übersetzung. Dann das Deployment mit `-Domain <öffentliche-ip-mit-bindestrichen>.sslip.io` wiederholen.

## 3. Erstes Deployment

Mit Übernahme der Daten vom PC (Garten, Flächen, Kulturen, Tagebuch, Fotos, Accounts):

```powershell
.\deploy\deploy.ps1 -Server root@<IP-DES-SERVERS> -DatenUebernehmen
```

Ohne Datenübernahme (neu anfangen):

```powershell
.\deploy\deploy.ps1 -Server root@<IP-DES-SERVERS>
```

Die Ausgabe zeigt **Adresse** und **Einladungscode**.

- **Bei Datenübernahme:** Die bisherigen Accounts sind mit dabei, ihr meldet euch mit den gewohnten Passwörtern an.
- **Zweiter Account:** Der zweite Account registriert sich mit dem Einladungscode.

### Auf dem Handy installieren

- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“
- **Android (Chrome):** Menü → „App installieren“

## 4. Updates

Nach Änderungen am Code (committen nicht vergessen):

```powershell
.\deploy\deploy.ps1 -Server root@<IP-DES-SERVERS>
```

Daten, Fotos und Konfiguration bleiben erhalten.

## Backups

- Der Server sichert jede Nacht die Datenbank (14 Tage aufbewahrt) und sonntags die Fotos (die letzten 4).
- Die Sicherungen liegen unter `/opt/gartengeist/backups`.
- Ab und zu auf den PC holen:

  ```powershell
  scp -r root@<IP>:/opt/gartengeist/backups .\backups-server
  ```

- Eine Datenbank-Sicherung wiederherstellen (auf dem Server, Dateiname anpassen):

  ```bash
  cd /opt/gartengeist/app
  docker compose -f docker-compose.prod.yml --env-file ../.env.prod stop api
  docker compose -f docker-compose.prod.yml --env-file ../.env.prod exec -T postgres \
    pg_restore --clean --if-exists --no-owner -U gartengeist -d gartengeist < ../backups/db-2026-10-01.dump
  docker compose -f docker-compose.prod.yml --env-file ../.env.prod start api
  ```

## Nützliches auf dem Server

```bash
cd /opt/gartengeist/app
docker compose -f docker-compose.prod.yml --env-file ../.env.prod ps            # Status
docker compose -f docker-compose.prod.yml --env-file ../.env.prod logs -f api   # Logs der API
cat /opt/gartengeist/.env.prod                                                  # Konfiguration (geheim!)
```

## Sicherheit

- Registrieren geht nur mit Einladungscode und höchstens für 2 Accounts.
- Pro Minute und IP sind maximal 10 Anmeldeversuche erlaubt.
- Die Firewall lässt nur SSH (22) und Web (80/443) durch. Die Datenbank ist von außen nicht erreichbar.
- Fotos sind über ihre zufälligen, nicht erratbaren Adressen ohne Login abrufbar. So kann der Browser sie anzeigen.
