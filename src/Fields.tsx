import { useEffect, useRef, useState } from 'react';
import { adjustMinutes, changeLandings, formatDateUTC, formatDecimal, formatTimeUTC, nowMinute, parseDecimal, round1 } from './logic';
import { shrinkPhoto, useObjectUrl } from './photo';

interface NumProps {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  digits?: number;
  testid: string;
  suffix?: string;
}

export function NumField({ label, value, onChange, digits, testid, suffix }: NumProps) {
  const [text, setText] = useState(formatDecimal(value, digits));
  const fokus = useRef(false);
  useEffect(() => {
    if (!fokus.current && parseDecimal(text) !== value) setText(formatDecimal(value, digits));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className="feld">
      <span>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </span>
      <input
        data-testid={testid}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onFocus={() => (fokus.current = true)}
        onChange={(e) => {
          const t = e.target.value;
          if (!/^[0-9.,-]*$/.test(t)) return;
          setText(t);
          onChange(parseDecimal(t));
        }}
        onBlur={() => {
          fokus.current = false;
          if (value === undefined) return;
          const v = digits === undefined ? value : round1(value);
          if (v !== value) onChange(v);
          setText(formatDecimal(v, digits));
        }}
      />
    </label>
  );
}

interface PhotoProps {
  label: string;
  blob: Blob | undefined;
  onChange: (b: Blob | undefined) => void;
  testid: string;
}

export function PhotoField({ label, blob, onChange, testid }: PhotoProps) {
  const url = useObjectUrl(blob);
  const [fehler, setFehler] = useState('');
  return (
    <div className="foto">
      {url && <img src={url} alt={label} className="vorschau" data-testid={`${testid}-vorschau`} />}
      <div className="reihe">
        <label className="btn">
          {blob ? 'Neu aufnehmen' : label}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="versteckt"
            data-testid={testid}
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              try {
                setFehler('');
                onChange(await shrinkPhoto(file));
              } catch {
                setFehler('Das Foto konnte nicht verarbeitet werden.');
              }
              input.value = '';
            }}
          />
        </label>
        {blob && (
          <button type="button" className="btn leise" onClick={() => onChange(undefined)}>
            Foto entfernen
          </button>
        )}
      </div>
      {fehler && <p className="fehler">{fehler}</p>}
    </div>
  );
}

export function TimeStep({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const knopf = (d: number) => (
    <button
      key={d}
      type="button"
      className="btn zeit"
      data-testid={`t-${d < 0 ? 'm' : 'p'}${Math.abs(d)}`}
      aria-label={`Zeit ${d < 0 ? 'minus' : 'plus'} ${Math.abs(d)} Minute${Math.abs(d) > 1 ? 'n' : ''}`}
      onClick={() => onChange(adjustMinutes(value, d))}
    >
      {d < 0 ? '−' : '+'}
      {Math.abs(d)}
    </button>
  );
  return (
    <div>
      <div className="zeitanzeige" data-testid="zeit">
        {formatTimeUTC(value)}
      </div>
      <div className="zeitdatum">{value ? formatDateUTC(value) + ' (UTC)' : 'noch nicht gesetzt'}</div>
      <div className="zeitraster">
        <div className="spalte">{[-3, -2, -1].map(knopf)}</div>
        <button type="button" className="btn primaer jetzt" data-testid="jetzt" onClick={() => onChange(nowMinute())}>
          Jetzt
        </button>
        <div className="spalte">{[1, 2, 3].map(knopf)}</div>
      </div>
      {value && (
        <button type="button" className="btn leise" onClick={() => onChange(undefined)}>
          Zeit löschen
        </button>
      )}
    </div>
  );
}

export function LandingCounter({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="landungen" data-testid="landungen">
      <span>Landungen</span>
      <button type="button" className="btn" data-testid="l-minus" aria-label="Landungen minus 1" onClick={() => onChange(changeLandings(value, -1))}>
        −1
      </button>
      <strong data-testid="l-wert">{value}</strong>
      <button type="button" className="btn" data-testid="l-plus" aria-label="Landungen plus 1" onClick={() => onChange(changeLandings(value, 1))}>
        +1
      </button>
    </div>
  );
}
