# Gartengeist

KI-gestützter Gartenassistent für unseren biologischen Schrebergarten – mobile-first, zwei Nutzer. Details und Roadmap: [PLAN.md](PLAN.md).

## Stack

- **Frontend:** React 19, React Router, Tailwind CSS 4, Vite (`frontend/`)
- **Backend:** ASP.NET Core (.NET 10), EF Core, JWT-Auth (`backend/`)
- **Datenbank:** PostgreSQL 16 + pgvector (Docker)

## Ports

| Dienst | Port |
|---|---|
| Postgres | 5433 |
| API | 5101 |
| Frontend | 5180 |

## Starten

1. `.env.example` nach `.env` kopieren und `Jwt__Key` setzen (mind. 32 Zeichen, z.B. `openssl rand -base64 48`).
2. Datenbank: `docker compose up -d`
3. API: `dotnet run --project backend/Gartengeist.Api` (Migrationen laufen beim Start automatisch)
4. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5180

In VS Code startet die Konfiguration **Full Stack** alles zusammen.

Der Dev-Server ist im WLAN erreichbar, zum Testen auf dem Handy die „Network“-Adresse aus der Vite-Ausgabe öffnen.

## Accounts

Die ersten zwei Registrierungen legen die Accounts an, danach ist die Registrierung gesperrt (`Auth:MaxNutzer` in `appsettings.json`).

## Migrationen

```sh
cd backend/Gartengeist.Api
dotnet ef migrations add <Name> -o Migrations
```
