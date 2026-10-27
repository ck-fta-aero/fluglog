import { useState } from 'react';
import { buildZip, shareZip } from './export';
import { durationMinutes, flightDate, formatHM, formatTimeUTC } from './logic';
import type { Flight } from './types';

interface Props {
  flights: Flight[];
  laufend: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
}

export function Home({ flights, laufend, onNew, onOpen }: Props) {
  const [meldung, setMeldung] = useState('');
  const liste = flights.filter((f) => f.status === 'abgeschlossen').sort((a, b) => b.seq - a.seq);
  return (
    <main className="seite">
      <header className="kopf">
        <h1>Fluglog</h1>
      </header>
      <section className="inhalt">
        <button type="button" className="btn primaer riesig" data-testid="neuer-flug" onClick={onNew}>
          Neuer Flug
        </button>
        {laufend && <p className="klein">Ein laufender Flug wird fortgesetzt.</p>}
        <h2>Flugliste</h2>
        {liste.length === 0 && <p className="klein" data-testid="leer">Noch keine Flüge.</p>}
        <ul className="liste">
          {liste.map((f) => (
            <li key={f.id}>
              <button type="button" className="eintrag" data-testid="flug-item" onClick={() => onOpen(f.id)}>
                <strong>{f.aircraft ?? '—'}</strong>
                <span>{flightDate(f)} (UTC)</span>
                <span>Block off {formatTimeUTC(f.blockOff)}</span>
                <span>Blockzeit {formatHM(durationMinutes(f.blockOff, f.blockOn))}</span>
                <span>Landungen {f.landings}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn"
          data-testid="export"
          disabled={flights.length === 0}
          onClick={async () => {
            const r = await shareZip(await buildZip(flights));
            setMeldung(r === 'abgebrochen' ? '' : r === 'geteilt' ? 'Export geteilt.' : 'Export als Datei geladen.');
          }}
        >
          Alle Flüge sichern (ZIP)
        </button>
        {meldung && <p className="klein" data-testid="export-meldung">{meldung}</p>}
      </section>
    </main>
  );
}
