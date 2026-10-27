# Fluglog

Lokale Web-App fürs iPhone zum Erfassen von Flügen (Kennzeichen, Öl, Zählerstände, Tanken, Block off/Take off/Landung/Block on, Landungen).
Alle Zeiten sind UTC. Es gibt keinen Server und kein Login: Die Daten liegen nur auf dem Gerät (IndexedDB).

Die App ist eine PWA. In Safari öffnen, **Teilen → Zum Home-Bildschirm**. Nach einmaligem Laden läuft sie komplett offline.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev            # Entwicklungsserver, auch im WLAN erreichbar (--host)
```

Die App so wie veröffentlicht (mit Service Worker, offlinefähig) lokal ansehen:

```bash
npm run build
npm run preview        # http://localhost:4173
```

Auf dem iPhone im selben WLAN die Adresse des Rechners öffnen (zeigt Vite beim Start an). Die Installation auf dem Home-Bildschirm und der Offline-Betrieb brauchen HTTPS oder `localhost`, also die veröffentlichte Adresse.

## Tests

```bash
npx playwright install webkit   # einmalig
npm test                        # Vitest (Logik) und Playwright mit WebKit, iPhone 13 (390×844)
npm run ak-report               # Tabelle AK-Nr → Testname → bestanden (nach npm test)
```

## Aktualisieren

1. Änderungen am Code machen, `npm test` ausführen.
2. Veröffentlichen:
   ```bash
   npm run deploy
   ```
   Das baut die App und schiebt `dist/` auf den Branch `gh-pages`. GitHub Pages liefert diesen Branch aus.
3. Auf dem iPhone die App einmal öffnen und schließen. Der neue Service Worker lädt die neue Version im Hintergrund und übernimmt sie beim nächsten Start. Die gespeicherten Flüge bleiben erhalten.

## Daten sichern

Auf der Startseite **Alle Flüge sichern (ZIP)**. Das Teilen-Menü des iPhones öffnet sich, die ZIP-Datei enthält `flights.json` und alle Fotos als JPEG. Regelmäßig sichern, denn die Daten existieren nur auf dem Gerät.

## Aufbau

- `src/logic.ts`: reine Rechen- und Formatierfunktionen (Unit-getestet)
- `src/db.ts`: IndexedDB, jede Eingabe wird sofort gespeichert
- `src/Flow.tsx`, `src/Fields.tsx`: die zehn Schritte
- `src/Summary.tsx`, `src/Home.tsx`: Zusammenfassung und Flugliste
- `scripts/gen-sw.mjs`: erzeugt nach dem Build den Service Worker mit der Liste aller Dateien
