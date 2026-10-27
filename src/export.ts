import { zipSync, strToU8 } from 'fflate';
import { gallons } from './logic';
import type { Flight } from './types';

const FOTOS = [
  ['photoStart', 'zaehler-start'],
  ['photoFuel', 'tankanzeige'],
  ['photoEnd', 'zaehler-ende'],
] as const;

/** Alle Flüge als ZIP: flights.json plus fotos/*.jpg */
export async function buildZip(flights: Flight[]): Promise<Uint8Array> {
  const dateien: Record<string, Uint8Array> = {};
  const eintraege = [];
  for (const f of [...flights].sort((a, b) => a.seq - b.seq)) {
    const { photoStart, photoEnd, photoFuel, ...rest } = f;
    void photoStart;
    void photoEnd;
    void photoFuel;
    const fotos: Record<string, string> = {};
    for (const [feld, name] of FOTOS) {
      const blob = f[feld];
      if (!blob) continue;
      const pfad = `fotos/${f.id}-${name}.jpg`;
      dateien[pfad] = new Uint8Array(await blob.arrayBuffer());
      fotos[name] = pfad;
    }
    eintraege.push({
      ...rest,
      fuelUsGal: f.fuelL === undefined ? undefined : gallons(f.fuelL),
      fotos,
    });
  }
  dateien['flights.json'] = strToU8(
    JSON.stringify({ app: 'Fluglog', version: 1, zeiten: 'UTC', fluege: eintraege }, null, 2)
  );
  return zipSync(dateien, { level: 0 });
}

/** Teilen-Menü; ohne Web-Share-Unterstützung als Download */
export async function shareZip(bytes: Uint8Array): Promise<'geteilt' | 'abgebrochen' | 'geladen'> {
  const name = `fluglog-${new Date().toISOString().slice(0, 10)}.zip`;
  const kopie = new Uint8Array(bytes);
  const file = new File([kopie], name, { type: 'application/zip' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Fluglog' });
      return 'geteilt';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'abgebrochen';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'geladen';
}
