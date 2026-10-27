import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  adjustMinutes,
  aircraftOptions,
  changeLandings,
  diff1,
  durationMinutes,
  fitSize,
  flightDate,
  formatDecimal,
  formatHM,
  formatTimeUTC,
  gallons,
  lastAircraft,
  nowMinute,
  parseDecimal,
  plausibility,
} from './logic';
import type { Flight } from './types';

const flug = (p: Partial<Flight> = {}): Flight => ({
  id: 'x',
  seq: 1,
  status: 'abgeschlossen',
  step: 10,
  createdAt: '2026-10-27T10:00:00.000Z',
  landings: 0,
  ...p,
});

afterEach(() => vi.useRealTimers());

describe('Zahlen', () => {
  it('AK-05/AK-06: Dezimalkomma und Dezimalpunkt werden gleich gelesen', () => {
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal('1234.5')).toBe(1234.5);
    expect(parseDecimal('')).toBeUndefined();
    expect(parseDecimal('abc')).toBeUndefined();
    expect(parseDecimal(',')).toBeUndefined();
  });
  it('AK-05/AK-06: Anzeige mit Komma und fester Nachkommastelle', () => {
    expect(formatDecimal(1, 1)).toBe('1,0');
    expect(formatDecimal(0.2, 1)).toBe('0,2');
    expect(formatDecimal(1234.5, 1)).toBe('1234,5');
    expect(formatDecimal(undefined, 1)).toBe('');
  });
  it('AK-07: 1 US gal = 3,78541 l, eine Nachkommastelle', () => {
    expect(gallons(3.78541)).toBe(1);
    expect(gallons(50)).toBe(13.2);
    expect(gallons(100)).toBe(26.4);
  });
  it('AK-15: Differenzen nur mit beiden Werten', () => {
    expect(diff1(1234.5, 1235.7)).toBe(1.2);
    expect(diff1(undefined, 5)).toBeUndefined();
    expect(diff1(5, undefined)).toBeUndefined();
  });
});

describe('Zeiten', () => {
  it('AK-09: Anzeige immer als HH:MM UTC', () => {
    expect(formatTimeUTC('2026-10-27T09:05:00.000Z')).toBe('09:05 UTC');
    expect(formatTimeUTC(undefined)).toBe('—');
  });
  it('AK-08: Jetzt auf die Minute genau', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T14:47:42.900Z'));
    expect(nowMinute()).toBe('2026-10-27T14:47:00.000Z');
  });
  it('AK-08: ± ohne gesetzte Zeit nutzt die aktuelle Zeit als Basis', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T14:47:42.900Z'));
    expect(adjustMinutes(undefined, 2)).toBe('2026-10-27T14:49:00.000Z');
    expect(adjustMinutes('2026-10-27T14:47:00.000Z', -3)).toBe('2026-10-27T14:44:00.000Z');
  });
  it('AK-16: Flug über Mitternacht UTC wird korrekt berechnet', () => {
    expect(durationMinutes('2026-10-27T23:50:00.000Z', '2026-10-28T00:35:00.000Z')).toBe(45);
    expect(formatHM(45)).toBe('0:45');
    expect(adjustMinutes('2026-10-27T23:59:00.000Z', 3)).toBe('2026-10-28T00:02:00.000Z');
  });
  it('AK-14/AK-15: Format h:mm, fehlende Werte als Strich', () => {
    expect(formatHM(98)).toBe('1:38');
    expect(formatHM(605)).toBe('10:05');
    expect(formatHM(undefined)).toBe('—');
    expect(durationMinutes(undefined, '2026-10-27T10:00:00.000Z')).toBeUndefined();
  });
  it('AK-13: Datum kommt aus Block off (UTC)', () => {
    expect(flightDate(flug({ blockOff: '2026-10-27T23:50:00.000Z' }))).toBe('27.10.2026');
  });
});

describe('Plausibilität und Zähler', () => {
  it('AK-17: Zeit vor der vorherigen und kleinere Endstände erzeugen Hinweise', () => {
    const f = flug({
      blockOff: '2026-10-27T10:00:00.000Z',
      takeOff: '2026-10-27T09:50:00.000Z',
      hobbsStart: 10,
      hobbsEnd: 9,
      flightStart: 5,
      flightEnd: 4,
    });
    const m = plausibility(f);
    expect(m).toHaveLength(3);
    expect(m[0]).toContain('Take off');
  });
  it('AK-17: stimmige Werte erzeugen keinen Hinweis', () => {
    expect(
      plausibility(flug({ blockOff: '2026-10-27T10:00:00.000Z', takeOff: '2026-10-27T10:10:00.000Z', hobbsStart: 1, hobbsEnd: 2 }))
    ).toEqual([]);
  });
  it('AK-10: Landungszähler hat das Minimum 0', () => {
    expect(changeLandings(0, -1)).toBe(0);
    expect(changeLandings(1, 1)).toBe(2);
  });
});

describe('Flugzeuge und Fotos', () => {
  it('AK-04: eingetippte Kennzeichen werden Auswahltasten, zuletzt geflogenes erkannt', () => {
    const alt = [flug({ seq: 1, aircraft: 'D-ABCD' }), flug({ seq: 2, aircraft: 'D-EFTA' })];
    expect(aircraftOptions(alt)).toEqual(['D-EFTA', 'D-EFTD', 'D-ETRY', 'D-EZCD', 'OE-KMH', 'D-ABCD']);
    expect(lastAircraft(alt)).toBe('D-EFTA');
    expect(lastAircraft([])).toBeUndefined();
  });
  it('Technik: Fotos werden auf max. 1600 px lange Kante verkleinert', () => {
    expect(fitSize(2400, 1200)).toEqual({ w: 1600, h: 800 });
    expect(fitSize(1000, 3200)).toEqual({ w: 500, h: 1600 });
    expect(fitSize(800, 600)).toEqual({ w: 800, h: 600 });
  });
});
