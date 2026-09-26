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
| Wetter | Open-Meteo API mit MeteoSchweiz-Modell ICON-CH1/CH2 (`meteoswiss_icon_seamless`, ~5 Tage, 1–2 km), danach globales Modell als Ersatz; kostenlos, kein API-Key |
| Ortssuche | Nominatim/OpenStreetMap (PLZ → Koordinaten; Open-Meteo-Geocoding findet PLZ unzuverlässig) |
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

### Pflanzen-Katalog (`pflanze`)
- `id`, `schluessel` (stabil, z.B. `tomate`), `name`, `lateinisch`, `familie`, `kategorie`
- Monatsfenster: `voranzucht`, `direktsaat`, `auspflanzen`, `ernte` (von/bis, über Jahreswechsel möglich)
- `voranzuchtWochen`, `tageBisErnte`, `pflanzabstandCm`, `reihenabstandCm` (→ Platzbedarf m²/Pflanze)
- `naehrstoffbedarf` (stark/mittel/schwach), `wasserbedarf`, `frostempfindlich`, `mehrjaehrig`
- `mischkulturGut[]`, `mischkulturSchlecht[]` (Schlüssel), `hinweis`
- Quelle: `backend/Gartengeist.Api/Data/Seed/pflanzen.json`, wird beim Start abgeglichen

### Bepflanzung (`bepflanzung`)
- `id`, `flaecheId`, `pflanzeId`
- `sorte`, `anzahl`
- `aussaatDatum`, `pflanzDatum`
- `voraussichtlicheErnte` (berechnet aus Datum + Kulturdauer)
- `notizen`, `beendetAm` (abgeerntet; bleibt für Fruchtfolge erhalten), `angelegtVon`

### Tagebuch (`tagebuch_eintrag`, `tagebuch_foto`)
- `id`, `nutzerId`, `datum`, `typ` (notiz | gegossen | geduengt | gejaetet | geerntet)
- `text`, `flaecheId?`, `bepflanzungId?`
- `menge`, `einheit` (kg | g | stueck | bund) – nur bei `geerntet`
- Fotos als eigene Tabelle (max. 5 pro Eintrag, Dateien unter `uploads/fotos`)
- Wetter-Snapshot (Temp min/max, Niederschlag, Wettercode) aus der Tagesprognose

### Aufgaben (`aufgabe`)
- `id`, `titel`, `beschreibung`, `faelligAm`, `intervallTage?` (gesetzt = wiederkehrend)
- `kategorie` (allgemein | voranzucht | winter), `quelle` (manuell | automatisch | ki | dokument)
- `schluessel` (eindeutig bei automatischen Aufgaben), `verworfenAm` (automatische werden verworfen statt gelöscht)
- `flaecheId?`, `bepflanzungId?`, `pflanzeId?`, `vorgaengerId?`
- `erledigtVon?`, `erledigtAm?`, `angelegtVon?`

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

### Ernte-Log
- Keine eigene Tabelle: Ernten sind Tagebucheinträge vom Typ `geerntet` (mit Kultur, Menge, Einheit, Person, Fotos)
- Saison-Summen werden daraus berechnet (`GET /api/tagebuch/ernte?jahr=`)

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
- [x] Projekt-Setup: Backend (ASP.NET), Frontend (React), Postgres, Docker Compose
- [x] Auth: Registrierung, Login, JWT
- [x] Einrichtungs-Wizard: Standort, Flächen anlegen, Haushaltsgröße
- [x] Flächen-Verwaltung (CRUD)
- [x] Pflanzen-Katalog (58 Gemüse/Kräuter/Blumen mit Anbaukalender, Mischkultur, Nährstoffbedarf)
- [x] Bepflanzung anlegen (was steht wo, Aussaat-/Pflanzungsdatum, Ernteprognose, Mischkultur- und einfacher Fruchtfolge-Hinweis)
- [x] Mobile Navigation (Bottom-Nav)
- [x] Dashboard: 7-Tage-Wetter, Frostwarnung mit betroffenen Kulturen, nächste Ernte, „Jetzt dran“ (Aufgaben kommen mit Phase 3 dazu)

### Phase 2 — Tagebuch & Fotos (Woche 3)
- [x] Tagebucheinträge erstellen mit Datum, Text, Fläche/Pflanze
- [x] Foto-Upload (Kamera/Galerie auf Handy, max 5 Fotos/Eintrag, vor Upload auf 2000 px verkleinert)
- [x] Schnell-Aktionen: „gegossen", „gedüngt", „gejätet" per 1 Tap auf der Fläche (mehrere Flächen über Tagebuch), mit Rückgängig; „geerntet" mit Menge
- [x] Ernte-Log: Menge erfassen (kg/g/Stück/Bund), Saison-Summe pro Kultur, Jahresübersicht
- [x] Einträge nach Fläche und Typ filtern (zeitlich gruppiert)
- [x] Wer hat was eingetragen (Nutzername + Avatar)
- [x] Foto-Verlauf pro Kultur (Entwicklung über Zeit)
- [x] Wetter-Snapshot bei Tagebucheintrag (aus der Tagesprognose)

### Phase 3 — Aufgaben & Kalender (Woche 4)
- [x] Aufgaben erstellen (manuell, wiederkehrend – nächste Fälligkeit ab Erledigungstag)
- [x] Kalenderansicht: Aufgaben + erwartete Ernten + geplante Voranzucht/Auspflanzen
- [x] Aufgaben als erledigt markieren (1 Tap, mit Rückgängig; sichtbar wer)
- [x] Gießprotokoll: zuletzt gegossen oder Regen ≥ 5 mm, Gewächshaus 2 / Freiland 4 Tage, bei Hitze früher; Warnung + 1-Tap-Gießen
- [x] Frostdaten aus 10 Jahren Wetterhistorie (Median + sichere Grenze 8/10 Jahre)
- [x] Voranzucht-Reminder: für angebaute Kulturen, berechnet aus Frostdaten, Aufgabe erscheint 3 Wochen vorher
- [x] Einkaufsliste & Vorrat (Saatgut mit Keimfähigkeit, „auf die Einkaufsliste“)
- [x] Wintervorbereitung-Checkliste (automatisch ab August, abgestimmt auf den ersten Frost, biologisch)

### Phase 4 — Wetter (Woche 5)
- [x] Open-Meteo Integration: 7-Tage-Prognose mit MeteoSchweiz-Modell (Schnittstelle `IWeatherProvider`, 30 min Cache)
- [ ] Historische Daten (Open-Meteo Archive)
- [ ] Optional: echte Messwerte der nächsten MeteoSchweiz-Station (Open Government Data, STAC-API `ch.meteoschweiz.ogd-smn`) für Wetterrückblick und Jahresvergleich
- [x] Wetter-Widget auf Dashboard
- [ ] Wetter-Snapshot bei Tagebucheintrag: für nachgetragene Einträge (vergangene Tage) Messwerte statt Prognose
- [ ] Automatische Aufgabe bei Frost-Warnung
- [ ] Wetterrückblick: was wirklich war vs. Vorhersage
- [ ] Jahresvergleich: „Diese Woche letztes Jahr..."

### Phase 5 — KI-Assistent (Woche 6–7)
- [ ] Claude-Integration im Backend
- [ ] Saatgut-Scanner: Foto der Samentüte → Pflanze + Sorte erkennen (aus Phase 1 verschoben, braucht Claude)
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

Phase 1–3 sind abgeschlossen. Weiter mit Phase 4 (Wetter: historische Daten, Messwerte für nachgetragene Einträge, automatische Frost-Aufgabe, Rückblick, Jahresvergleich) oder direkt Phase 5 (KI-Assistent).
