export type ZeitSchluessel = 'blockOff' | 'takeOff' | 'landing' | 'blockOn';

export interface Flight {
  id: string;
  /** laufende Nummer, höher = neuer */
  seq: number;
  status: 'laufend' | 'abgeschlossen';
  step: number;
  createdAt: string;
  aircraft?: string;
  oil?: number;
  hobbsStart?: number;
  flightStart?: number;
  hobbsEnd?: number;
  flightEnd?: number;
  photoStart?: Blob;
  photoEnd?: Blob;
  photoFuel?: Blob;
  fuelL?: number;
  blockOff?: string;
  takeOff?: string;
  landing?: string;
  blockOn?: string;
  landings: number;
}

export const DEFAULT_AIRCRAFT = ['D-EFTA', 'D-EFTD', 'D-ETRY', 'D-EZCD', 'OE-KMH'];

export const STEPS = [
  'Flugzeug',
  'Öl',
  'Zähler Start',
  'Tanken',
  'Block off',
  'Take off',
  'Landung',
  'Block on',
  'Zähler Ende',
  'Abschließen',
];
