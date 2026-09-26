<#
.SYNOPSIS
  Bringt den aktuellen (committeten) Stand von Gartengeist auf den Server und startet ihn.

.EXAMPLE
  .\deploy\deploy.ps1 -Server root@203.0.113.5
  .\deploy\deploy.ps1 -Server root@203.0.113.5 -Domain garten.example.ch
  .\deploy\deploy.ps1 -Server root@203.0.113.5 -DatenUebernehmen

.NOTES
  -Domain         Nur nötig für eine eigene Domain; ohne wird <ip>.sslip.io verwendet.
  -DatenUebernehmen  Kopiert die lokale Datenbank und Fotos auf den Server (ERSETZT die Daten dort).
  Siehe DEPLOY.md.
#>
param(
    [Parameter(Mandatory = $true)] [string]$Server,
    [string]$Domain = '',
    [switch]$DatenUebernehmen,
    # Sicherheitsabfrage vor der Datenübernahme überspringen (z.B. für nicht-interaktive Aufrufe)
    [switch]$OhneRueckfrage
)

$ErrorActionPreference = 'Stop'

# Native Befehle (git, ssh, scp, docker) setzen nur $LASTEXITCODE – hier in Fehler umwandeln
function Invoke-Checked([string]$Description, [scriptblock]$Command) {
    Write-Host "→ $Description" -ForegroundColor Green
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "Fehlgeschlagen: $Description (Exit-Code $LASTEXITCODE)" }
}

$root = Split-Path $PSScriptRoot -Parent
$remoteApp = '/opt/gartengeist/app'
$compose = "cd $remoteApp && docker compose -f docker-compose.prod.yml --env-file ../.env.prod"
Push-Location $root
try {
    if (git status --porcelain) {
        Write-Warning 'Es gibt nicht committete Änderungen – deployt wird nur der letzte Commit.'
    }

    $archive = Join-Path $env:TEMP 'gartengeist-deploy.tar'
    Invoke-Checked 'Code packen' { git archive --format=tar -o $archive HEAD }
    Invoke-Checked 'Code und Einrichtungs-Skript hochladen' {
        scp -q $archive "${Server}:/tmp/gartengeist.tar"
        if ($LASTEXITCODE -eq 0) { scp -q deploy/server-setup.sh "${Server}:/tmp/gartengeist-setup.sh" }
    }
    Invoke-Checked 'Server einrichten (Docker, Firewall, Konfiguration)' {
        ssh $Server "bash /tmp/gartengeist-setup.sh '$Domain'"
    }
    Invoke-Checked 'Bauen und starten (beim ersten Mal einige Minuten)' {
        ssh $Server "set -e; rm -rf $remoteApp; mkdir -p $remoteApp; tar --warning=no-timestamp -xf /tmp/gartengeist.tar -C $remoteApp; $compose up -d --build --remove-orphans; docker image prune -f >/dev/null"
    }

    if ($DatenUebernehmen) {
        if (-not $OhneRueckfrage) {
            $answer = Read-Host 'Die Daten auf dem Server werden durch die lokalen ERSETZT. Fortfahren? (ja/nein)'
            if ($answer -ne 'ja') { Write-Host 'Datenübernahme übersprungen.'; return }
        }

        $dump = Join-Path $env:TEMP 'gartengeist-daten.dump'
        Invoke-Checked 'Lokale Datenbank sichern' {
            docker exec gartengeist-postgres-1 pg_dump -U gartengeist -d gartengeist -Fc -f /tmp/gartengeist-daten.dump
            if ($LASTEXITCODE -eq 0) { docker cp gartengeist-postgres-1:/tmp/gartengeist-daten.dump $dump }
        }
        Invoke-Checked 'Datenbank hochladen' { scp -q $dump "${Server}:/tmp/gartengeist-daten.dump" }
        Invoke-Checked 'Datenbank auf dem Server einspielen' {
            ssh $Server "set -e; $compose stop api; $compose exec -T postgres pg_restore --clean --if-exists --no-owner -U gartengeist -d gartengeist < /tmp/gartengeist-daten.dump; $compose start api"
        }

        $photos = 'backend/Gartengeist.Api/uploads/fotos'
        if (Test-Path $photos) {
            $photoArchive = Join-Path $env:TEMP 'gartengeist-fotos.tar'
            Invoke-Checked 'Fotos packen' { tar -cf $photoArchive -C backend/Gartengeist.Api/uploads fotos }
            Invoke-Checked 'Fotos hochladen und einspielen' {
                scp -q $photoArchive "${Server}:/tmp/gartengeist-fotos.tar"
                if ($LASTEXITCODE -eq 0) { ssh $Server "$compose exec -T api tar -xf - -C /app/uploads < /tmp/gartengeist-fotos.tar" }
            }
        }
    }

    Write-Host ''
    Write-Host 'Fertig. Adresse und Einladungscode stehen oben in der Ausgabe der Server-Einrichtung.' -ForegroundColor Green
}
finally {
    Pop-Location
}
