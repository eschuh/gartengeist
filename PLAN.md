# Gartengeist — Implementierungsplan

## Vision

Gartengeist ist ein KI-gestützter Gartenassistent für zwei Nutzer (Login-basiert), optimiert für mobile Nutzung im Garten. Die App hilft bei der Planung, Pflege und Dokumentation eines biologischen Schrebergartens — mit Gewächshaus, Tomatenhaus und naturnahem Bereich.

---

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 19 + React Router + Tailwind CSS 4 (mobile-first) |
| Backend | ASP.NET Core (.NET 10) + Entity Framework Core |
| Datenbank | PostgreSQL + pgvector (für RAG/Embeddings) |
| KI | Claude API (Chat, Analyse, Planung) |
| Wetter | Open-Meteo API (kostenlos, kein API-Key) |
| Fotos | Lokaler Upload → Dateisystem oder Blob-Storage |
| Auth | JWT-basiert, zwei Nutzer-Accounts |

---

## Datenmodell

### Nutzer
- `id`, `name`, `email`, `passwordHash`

### Garten-Konfiguration
- `id`, `standortName`, `plz`, `lat`, `lng`, `haushaltsgroesse`
- Einmalig pro Garten, geteilt von beiden Nutzern

### Flächen (`areas`)
- `id`, `name`, `typ` (freiland | gewächshaus | tomatenhaus | naturnah)
- `breite`, `länge` (in Metern)
- `beschreibung`

### Pflanzen-Katalog (`plant_catalog`)
- `id`, `name`, `lateinisch`, `kategorie`
- `aussaatVon`, `aussaatBis` (Monate)
- `ernteDauerTage`, `platzbedarf` (m²/Pflanze)
- `wasserbedarf`, `düngebedarf`
- `mischkulturGut[]`, `mischkulturSchlecht[]`

### Bepflanzung (`plantings`)
- `id`, `areaId`, `plantCatalogId`
- `sorte`, `anzahl`
- `aussaatDatum`, `pflanzDatum`
- `voraussichtlicheErnte`
- `notizen`

### Tagebuch (`journal_entries`)
- `id`, `userId`, `datum`
- `titel`, `text`
- `areaId?`, `plantingId?`
- `fotos[]` (Pfade)
- `wetterSnapshot` (Temp, Niederschlag)

### Aufgaben (`tasks`)
- `id`, `titel`, `beschreibung`
- `faelligAm`, `wiederkehrend`, `intervallTage?`
- `areaId?`, `plantingId?`
- `erledigtVon?` (userId), `erledigtAm?`
- `quelle` (manuell | ki | dokument)

### Dokumente (`documents`)
- `id`, `dateiname`, `typ` (pdf | bild)
- `pfad`, `hochgeladenVon`, `hochgeladenAm`
- `embedding` (vector, für RAG)
- `verarbeitet` (bool)

### KI-Empfehlungen (`ai_recommendations`)
- `id`, `userId`, `erstelltAm`
- `typ` (diagnose | pflanzplan | aufgabe | gestaltung | sonstiges)
- `frage` (was der Nutzer gefragt hat)
- `antwort` (was die KI geantwortet hat)
- `areaId?`, `plantingId?`
- `embedding` (vector, für spätere RAG-Abfragen)
- Wird automatisch bei jeder KI-Antwort gespeichert

### Ernte-Log (`harvest_logs`)
- `id`, `plantingId`, `userId`, `datum`
- `menge`, `einheit` (kg | stück | bund)
- `notizen`

### Einkaufsliste (`shopping_items`)
- `id`, `name`, `menge`, `einheit`
- `kategorie`, `erledigt`, `hinzugefuegtVon`

### Vorrat (`inventory`)
- `id`, `name`, `menge`, `einheit`
- `kategorie` (saatgut | dünger | werkzeug | sonstiges)
- `notizen`

---

## Features nach Phase

### Phase 1 — Grundstruktur (Woche 1–2)
- [ ] Projekt-Setup: Backend (ASP.NET), Frontend (React), Postgres, Docker Compose
- [ ] Auth: Registrierung, Login, JWT
- [ ] Einrichtungs-Wizard: Standort, Flächen anlegen, Haushaltsgröße
- [ ] Flächen-Verwaltung (CRUD)
- [ ] Pflanzen-Katalog (Basis-Daten mit ~50 Gemüse/Kräuter, inkl. Saatgut-Scanner via Foto)
- [ ] Bepflanzung anlegen (was steht wo, Aussaat-/Pflanzungsdatum)
- [ ] Mobile Navigation (Bottom-Nav)
- [ ] Dashboard: heutige Aufgaben, nächste Ernte, Wetterwarnung

### Phase 2 — Tagebuch & Fotos (Woche 3)
- [ ] Tagebucheinträge erstellen mit Datum, Text, Fläche/Pflanze
- [ ] Foto-Upload (Kamera auf Handy, max 5 Fotos/Eintrag)
- [ ] Schnell-Aktionen: „gegossen", „gedüngt", „geerntet" per 1 Tap
- [ ] Ernte-Log: Menge erfassen (kg/Stück), Saison-Summe pro Pflanze
- [ ] Einträge nach Datum und Fläche filtern
- [ ] Wer hat was eingetragen (Nutzername + Avatar)
- [ ] Foto-Verlauf pro Pflanze (Entwicklung über Zeit)

### Phase 3 — Aufgaben & Kalender (Woche 4)
- [ ] Aufgaben erstellen (manuell, wiederkehrend)
- [ ] Kalenderansicht: Aufgaben + Ernte-Fenster + Aussaat-Termine
- [ ] Aufgaben als erledigt markieren (auch vom anderen Nutzer)
- [ ] Gießprotokoll: wann zuletzt gegossen, Warnung bei zu langer Pause
- [ ] Voranzucht-Reminder: automatisch berechnet aus Standort + Frostdaten
- [ ] Einkaufsliste & Vorrat
- [ ] Wintervorbereitung-Checkliste (automatisch im Herbst)

### Phase 4 — Wetter (Woche 5)
- [ ] Open-Meteo Integration (aktuell + 7-Tage + historische Daten)
- [ ] Wetter-Widget auf Dashboard
- [ ] Wetter-Snapshot bei Tagebucheintrag
- [ ] Automatische Aufgabe bei Frost-Warnung
- [ ] Wetterrückblick: was wirklich war vs. Vorhersage
- [ ] Jahresvergleich: „Diese Woche letztes Jahr..."

### Phase 5 — KI-Assistent (Woche 6–7)
- [ ] Claude-Integration im Backend
- [ ] Chat-Interface (Kontext: Flächen, Pflanzen, Aufgaben, Wetter, Tagebuch)
- [ ] Dokument-Upload + RAG (pgvector Embeddings)
- [ ] Foto-Analyse: Pflanzenkrankheiten, Schädlinge erkennen
- [ ] Foto-Verlauf-Analyse: KI erkennt Veränderungen über Zeit
- [ ] Aufgaben aus Dokumenten extrahieren
- [ ] KI-Empfehlungen automatisch speichern (jede Diagnose, jeder Vorschlag)
- [ ] Gespeicherte Empfehlungen als Kontext in Folgegesprächen nutzen
- [ ] Mengenplanung rückwärts: „2× pro Woche Salat" → wie viele Pflanzen, wann aussäen
- [ ] Bodenanalyse: Testergebnis eingeben → Dünge- und Pflanzempfehlung

### Phase 6 — Planung & Optimierung (Woche 8–9)
- [ ] Pflanzplan-Generator: für X Personen, welche Mengen welcher Gemüse
- [ ] Fruchtfolge-Validierung (warnt bei falscher Reihenfolge)
- [ ] Mischkultur-Empfehlungen
- [ ] Ernte-Prognose mit Wetterkorrektur
- [ ] Gestaltungsideen (naturnaher Bereich, Biodiversität)
- [ ] Saisonrückblick: was lief gut, was nächstes Jahr anders
- [ ] Wöchentliche KI-Zusammenfassung: was empfohlen, was getan, was daraus wurde
- [ ] Export: Saisonbericht als PDF
- [ ] Saatgut-Tausch-Notiz (habe X übrig)

---

## UX / Design-Prinzipien

- **Mobile-first**: große Tipp-Flächen, keine kleinen Links
- **Kamera-nah**: Foto-Upload immer 1 Tap entfernt
- **Bottom-Navigation**: Dashboard | Garten | Tagebuch | Aufgaben | KI
- **Zwei Nutzer sichtbar**: Avatare/Farben zeigen wer was gemacht hat
- **Offline-tolerant**: Lesen funktioniert ohne Netz (später)

---

### Phase 7 — Wetterstation (optional, nach Phase 6)
- [ ] Abstrakte Wetterdaten-Schnittstelle im Backend (von Anfang an vorbereitet)
- [ ] Unterstützung für Ecowitt / Bresser API (fertige Stationen)
- [ ] Unterstützung für eigene Station (Raspberry Pi / ESP32 → REST-Endpoint)
- [ ] Bodenfeuchte-Sensor → automatische Gießempfehlung
- [ ] Gewächshaus als eigene Klimazone (Innen- vs. Außentemperatur)
- [ ] Historische Sensordaten speichern + visualisieren

---

## Offene Entscheidungen

- Foto-Speicherung: Dateisystem (einfach) vs. S3/Blob (skalierbar) → erstmal Dateisystem
- Gewächshaus/Tomatenhaus: eigene Mikro-Klimazonen → Phase 7 (Wetterstation)
- Push-Benachrichtigungen für Aufgaben → später (PWA)
- Hausarbeiten (Renovierung): separate App nach Gartengeist
- Wetterstation: Ecowitt/Bresser (fertig, ~100€) vs. Eigenbau ESP32 (günstiger, mehr Aufwand) → Entscheidung wenn App läuft

---

## Nächster Schritt

Projekt-Setup: Docker Compose (Postgres), Backend-Grundgerüst (ASP.NET), Frontend-Grundgerüst (React + Tailwind), Auth-Endpunkte.
