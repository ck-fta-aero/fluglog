import { useState } from 'react';
import { Hinweise } from './Flow';
import { diff1, durationMinutes, flightDate, formatDecimal, formatHM, formatTimeUTC, gallons } from './logic';
import { useObjectUrl } from './photo';
import type { Flight } from './types';

const num = (n: number | undefined, einheit = '', digits?: number) =>
  n === undefined ? '—' : `${formatDecimal(n, digits)}${einheit}`;

function Zeile({ id, label, wert }: { id: string; label: string; wert: string }) {
  return (
    <div className="zeile">
      <dt>{label}</dt>
      <dd data-testid={`sum-${id}`}>{wert}</dd>
    </div>
  );
}

function Thumb({ blob, label, onOpen }: { blob: Blob; label: string; onOpen: (url: string) => void }) {
  const url = useObjectUrl(blob);
  if (!url) return null;
  return (
    <button type="button" className="thumb" onClick={() => onOpen(url)} aria-label={`${label} vergrößern`}>
      <img src={url} alt={label} data-testid="thumb" />
      <span>{label}</span>
    </button>
  );
}

function Viewer({ url, onClose }: { url: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="Foto" data-testid="viewer">
      <div className="viewerleiste">
        <button type="button" className="btn" data-testid="zoom-out" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>
          Zoom −
        </button>
        <button type="button" className="btn" data-testid="zoom-in" onClick={() => setZoom((z) => Math.min(5, z + 0.5))}>
          Zoom +
        </button>
        <button type="button" className="btn primaer" data-testid="viewer-close" onClick={onClose}>
          Schließen
        </button>
      </div>
      <div className="viewerbild">
        <img src={url} alt="Foto vergrößert" style={{ width: `${zoom * 100}%` }} data-zoom={zoom} data-testid="viewer-bild" />
      </div>
    </div>
  );
}

export function Summary({ flight: f, onBack, onDelete }: { flight: Flight; onBack: () => void; onDelete: () => void }) {
  const [loeschen, setLoeschen] = useState(false);
  const [bild, setBild] = useState<string>();
  const block = durationMinutes(f.blockOff, f.blockOn);
  const flug = durationMinutes(f.takeOff, f.landing);
  const fotos: [Blob | undefined, string][] = [
    [f.photoStart, 'Zähler Start'],
    [f.photoFuel, 'Tankanzeige'],
    [f.photoEnd, 'Zähler Ende'],
  ];
  return (
    <main className="seite">
      <header className="kopf">
        <button type="button" className="btn leise" data-testid="zur-liste" onClick={onBack}>
          ‹ Liste
        </button>
        <h1>Zusammenfassung</h1>
      </header>
      <section className="inhalt">
        <dl className="daten">
          <Zeile id="kennzeichen" label="Kennzeichen" wert={f.aircraft ?? '—'} />
          <Zeile id="datum" label="Datum (UTC)" wert={flightDate(f)} />
          <Zeile id="blockoff" label="Block off" wert={formatTimeUTC(f.blockOff)} />
          <Zeile id="takeoff" label="Take off" wert={formatTimeUTC(f.takeOff)} />
          <Zeile id="landung" label="Landung" wert={formatTimeUTC(f.landing)} />
          <Zeile id="blockon" label="Block on" wert={formatTimeUTC(f.blockOn)} />
          <Zeile id="blockzeit" label="Blockzeit" wert={formatHM(block)} />
          <Zeile id="flugzeit" label="Flugzeit" wert={formatHM(flug)} />
          <Zeile id="landungen" label="Landungen" wert={String(f.landings)} />
          <Zeile id="hobbs-start" label="Hobbs Start" wert={num(f.hobbsStart, '', 1)} />
          <Zeile id="hobbs-ende" label="Hobbs Ende" wert={num(f.hobbsEnd, '', 1)} />
          <Zeile id="hobbs-diff" label="Hobbs Differenz" wert={num(diff1(f.hobbsStart, f.hobbsEnd), '', 1)} />
          <Zeile id="flight-start" label="Flight Start" wert={num(f.flightStart, '', 1)} />
          <Zeile id="flight-ende" label="Flight Ende" wert={num(f.flightEnd, '', 1)} />
          <Zeile id="flight-diff" label="Flight Differenz" wert={num(diff1(f.flightStart, f.flightEnd), '', 1)} />
          <Zeile id="oel" label="Öl" wert={num(f.oil, ' l', 1)} />
          <Zeile id="kraftstoff-l" label="Kraftstoff" wert={num(f.fuelL, ' l')} />
          <Zeile id="kraftstoff-gal" label="Kraftstoff (US-Gallonen)" wert={f.fuelL === undefined ? '—' : `${formatDecimal(gallons(f.fuelL), 1)} US gal`} />
        </dl>
        <Hinweise flight={f} />
        <h2>Fotos</h2>
        <div className="thumbs">
          {fotos.map(([b, l]) => b && <Thumb key={l} blob={b} label={l} onOpen={setBild} />)}
          {!fotos.some(([b]) => b) && <p data-testid="sum-fotos">—</p>}
        </div>
      </section>
      <footer className="leiste">
        <button type="button" className="btn gefahr" data-testid="flug-loeschen" onClick={() => setLoeschen(true)}>
          Flug löschen
        </button>
        <button type="button" className="btn primaer" onClick={onBack}>
          Fertig
        </button>
      </footer>
      {loeschen && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Flug löschen">
          <div className="karte">
            <p>Diesen Flug samt Fotos endgültig löschen?</p>
            <div className="reihe">
              <button type="button" className="btn" data-testid="loeschen-nein" onClick={() => setLoeschen(false)}>
                Abbrechen
              </button>
              <button type="button" className="btn gefahr" data-testid="loeschen-ja" onClick={onDelete}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
      {bild && <Viewer url={bild} onClose={() => setBild(undefined)} />}
    </main>
  );
}
