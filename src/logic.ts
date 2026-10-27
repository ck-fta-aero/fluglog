import { DEFAULT_AIRCRAFT, type Flight } from './types';

export const GAL_L = 3.78541;

export const round1 = (x: number) => Math.round((x + Number.EPSILON) * 10) / 10;

/** Dezimalkomma und Dezimalpunkt; leer oder ungültig = undefined */
export function parseDecimal(s: string): number | undefined {
  const t = s.trim().replace(',', '.');
  if (!/^-?\d*\.?\d*$/.test(t) || t === '' || t === '.' || t === '-' || t === '-.') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Anzeige mit Komma; digits = feste Nachkommastellen */
export function formatDecimal(n: number | undefined, digits?: number): string {
  if (n === undefined) return '';
  const s = digits === undefined ? String(n) : n.toFixed(digits);
  return s.replace('.', ',');
}

export const gallons = (liter: number) => round1(liter / GAL_L);

const p2 = (n: number) => String(n).padStart(2, '0');

export function formatTimeUTC(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC`;
}

export function formatDateUTC(iso: string): string {
  const d = new Date(iso);
  return `${p2(d.getUTCDate())}.${p2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** aktuelle Zeit auf die Minute genau als UTC-ISO-Zeitstempel */
export function nowMinute(): string {
  return new Date(Math.floor(Date.now() / 60000) * 60000).toISOString();
}

/** Zeit um Minuten verschieben; ohne gesetzte Zeit ist die aktuelle Zeit die Basis */
export function adjustMinutes(iso: string | undefined, delta: number): string {
  const basis = iso ? Date.parse(iso) : Math.floor(Date.now() / 60000) * 60000;
  return new Date(basis + delta * 60000).toISOString();
}

export function durationMinutes(von?: string, bis?: string): number | undefined {
  if (!von || !bis) return undefined;
  return Math.round((Date.parse(bis) - Date.parse(von)) / 60000);
}

/** h:mm */
export function formatHM(min?: number): string {
  if (min === undefined) return '—';
  const vorzeichen = min < 0 ? '−' : '';
  const a = Math.abs(Math.round(min));
  return `${vorzeichen}${Math.floor(a / 60)}:${p2(a % 60)}`;
}

export function diff1(start?: number, ende?: number): number | undefined {
  if (start === undefined || ende === undefined) return undefined;
  return round1(ende - start);
}

export const changeLandings = (n: number, delta: number) => Math.max(0, n + delta);

export function fitSize(w: number, h: number, max = 1600): { w: number; h: number } {
  const lang = Math.max(w, h);
  if (lang <= max) return { w, h };
  const f = max / lang;
  return { w: Math.round(w * f), h: Math.round(h * f) };
}

export function flightDate(f: Flight): string {
  return formatDateUTC(f.blockOff ?? f.takeOff ?? f.landing ?? f.blockOn ?? f.createdAt);
}

export function plausibility(f: Flight): string[] {
  const meldungen: string[] = [];
  const zeiten: [string, string | undefined][] = [
    ['Block off', f.blockOff],
    ['Take off', f.takeOff],
    ['Landung', f.landing],
    ['Block on', f.blockOn],
  ];
  let vorher: [string, string] | undefined;
  for (const [name, wert] of zeiten) {
    if (!wert) continue;
    if (vorher && Date.parse(wert) < Date.parse(vorher[1])) {
      meldungen.push(`${name} liegt vor ${vorher[0]}.`);
    }
    vorher = [name, wert];
  }
  if (f.hobbsStart !== undefined && f.hobbsEnd !== undefined && f.hobbsEnd < f.hobbsStart) {
    meldungen.push('Hobbs am Ende ist kleiner als am Start.');
  }
  if (f.flightStart !== undefined && f.flightEnd !== undefined && f.flightEnd < f.flightStart) {
    meldungen.push('Flight am Ende ist kleiner als am Start.');
  }
  return meldungen;
}

export function hasInput(f: Flight, step: number): boolean {
  switch (step) {
    case 1:
      return !!f.aircraft;
    case 2:
      return f.oil !== undefined;
    case 3:
      return f.hobbsStart !== undefined || f.flightStart !== undefined || !!f.photoStart;
    case 4:
      return f.fuelL !== undefined || !!f.photoFuel;
    case 5:
      return !!f.blockOff;
    case 6:
      return !!f.takeOff;
    case 7:
      return !!f.landing;
    case 8:
      return !!f.blockOn;
    case 9:
      return f.hobbsEnd !== undefined || f.flightEnd !== undefined || !!f.photoEnd;
    default:
      return false;
  }
}

/** Auswahltasten: Standard plus früher eingetippte Kennzeichen (neueste zuerst) */
export function aircraftOptions(others: Flight[]): string[] {
  const extra: string[] = [];
  for (const f of [...others].sort((a, b) => b.seq - a.seq)) {
    if (f.aircraft && !DEFAULT_AIRCRAFT.includes(f.aircraft) && !extra.includes(f.aircraft)) {
      extra.push(f.aircraft);
    }
  }
  return [...DEFAULT_AIRCRAFT, ...extra];
}

export function lastAircraft(others: Flight[]): string | undefined {
  return [...others]
    .filter((f) => f.status === 'abgeschlossen' && f.aircraft)
    .sort((a, b) => b.seq - a.seq)[0]?.aircraft;
}
