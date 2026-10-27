import { useState } from 'react';
import { LandingCounter, NumField, PhotoField, TimeStep } from './Fields';
import { aircraftOptions, formatDecimal, gallons, hasInput, lastAircraft, plausibility } from './logic';
import { STEPS, type Flight, type ZeitSchluessel } from './types';

interface Props {
  flight: Flight;
  others: Flight[];
  update: (patch: Partial<Flight>) => void;
  onList: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}

const ZEIT_SCHRITTE: Record<number, ZeitSchluessel> = { 5: 'blockOff', 6: 'takeOff', 7: 'landing', 8: 'blockOn' };

export function Hinweise({ flight }: { flight: Flight }) {
  const meldungen = plausibility(flight);
  if (!meldungen.length) return null;
  return (
    <ul className="hinweise">
      {meldungen.map((m) => (
        <li key={m} data-testid="hinweis">
          ⚠ Hinweis: {m}
        </li>
      ))}
    </ul>
  );
}

function AircraftStep({ flight, others, update }: Pick<Props, 'flight' | 'others' | 'update'>) {
  const optionen = aircraftOptions(others);
  const zuletzt = lastAircraft(others);
  const [text, setText] = useState(flight.aircraft && !optionen.includes(flight.aircraft) ? flight.aircraft : '');
  return (
    <div>
      <div className="auswahl">
        {optionen.map((a) => (
          <button
            key={a}
            type="button"
            data-testid={`ac-${a}`}
            aria-pressed={flight.aircraft === a}
            className={`btn gross${flight.aircraft === a ? ' gewaehlt' : ''}${zuletzt === a ? ' zuletzt' : ''}`}
            onClick={() => {
              setText('');
              update({ aircraft: a });
            }}
          >
            {a}
            {zuletzt === a && <small>zuletzt geflogen</small>}
          </button>
        ))}
      </div>
      <label className="feld">
        <span>Anderes Kennzeichen</span>
        <input
          data-testid="aircraft-input"
          autoCapitalize="characters"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            const t = e.target.value.toUpperCase();
            setText(t);
            update({ aircraft: t.trim() || undefined });
          }}
        />
      </label>
    </div>
  );
}

function CounterStep({ flight, update, ende }: Pick<Props, 'flight' | 'update'> & { ende: boolean }) {
  const k = ende ? 'End' : 'Start';
  const hobbs = (ende ? flight.hobbsEnd : flight.hobbsStart);
  const fl = (ende ? flight.flightEnd : flight.flightStart);
  return (
    <div>
      <PhotoField
        label="Foto aufnehmen"
        testid={ende ? 'foto-ende' : 'foto-start'}
        blob={ende ? flight.photoEnd : flight.photoStart}
        onChange={(b) => update(ende ? { photoEnd: b } : { photoStart: b })}
      />
      <NumField label="Hobbs" digits={1} testid="hobbs" value={hobbs} onChange={(v) => update(ende ? { hobbsEnd: v } : { hobbsStart: v })} />
      <NumField label="Flight" digits={1} testid="flight" value={fl} onChange={(v) => update(ende ? { flightEnd: v } : { flightStart: v })} />
      <p className="klein" data-k={k}>Alle Angaben sind optional.</p>
    </div>
  );
}

export function Flow({ flight, others, update, onList, onFinish, onDiscard }: Props) {
  const step = flight.step;
  const go = (n: number) => update({ step: Math.min(10, Math.max(1, n)) });
  const [verwerfen, setVerwerfen] = useState(false);
  const zeitKey = ZEIT_SCHRITTE[step];

  let inhalt;
  switch (step) {
    case 1:
      inhalt = <AircraftStep flight={flight} others={others} update={update} />;
      break;
    case 2:
      inhalt = <NumField label="Öl" suffix="Liter" digits={1} testid="oel" value={flight.oil} onChange={(v) => update({ oil: v })} />;
      break;
    case 3:
      inhalt = <CounterStep flight={flight} update={update} ende={false} />;
      break;
    case 4:
      inhalt = (
        <div>
          <NumField label="Kraftstoff" suffix="Liter" testid="kraftstoff" value={flight.fuelL} onChange={(v) => update({ fuelL: v })} />
          <div className="gallonen" data-testid="gallonen">
            {flight.fuelL === undefined ? '—' : `${formatDecimal(gallons(flight.fuelL), 1)} US gal`}
          </div>
          <PhotoField label="Foto Tankanzeige" testid="foto-tank" blob={flight.photoFuel} onChange={(b) => update({ photoFuel: b })} />
        </div>
      );
      break;
    case 5:
    case 6:
    case 7:
    case 8:
      inhalt = zeitKey && <TimeStep value={flight[zeitKey]} onChange={(v) => update({ [zeitKey]: v })} />;
      break;
    case 9:
      inhalt = <CounterStep flight={flight} update={update} ende />;
      break;
    default: {
      const erfasst = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => hasInput(flight, n)).length;
      inhalt = (
        <div>
          <p className="gross-text">{erfasst} von 9 Schritten haben Eingaben. Fehlendes lässt sich über die Fortschrittsanzeige nachtragen.</p>
          <button type="button" className="btn leise" onClick={() => setVerwerfen(true)}>
            Flug verwerfen
          </button>
        </div>
      );
    }
  }

  return (
    <main className="seite">
      <header className="kopf">
        <button type="button" className="btn leise" data-testid="zur-liste" onClick={onList}>
          ‹ Liste
        </button>
        <h1 data-testid="schritt-titel">
          Schritt {step} von 10 · {STEPS[step - 1]}
        </h1>
      </header>
      <nav className="fortschritt" aria-label="Fortschritt">
        {STEPS.map((name, i) => {
          const n = i + 1;
          const mit = hasInput(flight, n);
          return (
            <button
              key={n}
              type="button"
              data-testid={`seg-${n}`}
              data-eingabe={mit ? 'ja' : 'nein'}
              aria-current={n === step ? 'step' : undefined}
              aria-label={`Schritt ${n}: ${name}${mit ? ' (mit Eingabe)' : ''}`}
              className={`seg${mit ? ' mit' : ''}${n === step ? ' aktuell' : ''}`}
              onClick={() => go(n)}
            >
              {n}
            </button>
          );
        })}
      </nav>
      <section className="inhalt">
        {inhalt}
        {step >= 5 && step <= 9 && <LandingCounter value={flight.landings} onChange={(n) => update({ landings: n })} />}
        {step >= 5 && <Hinweise flight={flight} />}
      </section>
      <footer className="leiste">
        <button type="button" className="btn" disabled={step === 1} onClick={() => go(step - 1)}>
          Zurück
        </button>
        {step < 10 ? (
          <>
            <button type="button" className="btn" onClick={() => go(step + 1)}>
              Überspringen
            </button>
            {hasInput(flight, step) && (
              <button type="button" className="btn primaer" onClick={() => go(step + 1)}>
                Weiter
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn primaer" onClick={onFinish}>
            Flug abschließen
          </button>
        )}
      </footer>
      {verwerfen && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Flug verwerfen">
          <div className="karte">
            <p>Laufenden Flug mit allen Eingaben verwerfen?</p>
            <div className="reihe">
              <button type="button" className="btn" onClick={() => setVerwerfen(false)}>
                Abbrechen
              </button>
              <button type="button" className="btn gefahr" onClick={onDiscard}>
                Verwerfen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
