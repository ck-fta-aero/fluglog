// Erzeugt die App-Icons (orange Fläche mit weißem Pfeil) nach public/icons.
import { mkdirSync, writeFileSync } from 'node:fs';
import { makePng } from './png.mjs';

mkdirSync('public/icons', { recursive: true });

function icon(size) {
  return makePng(size, size, (x, y) => {
    const u = x / size;
    const v = y / size;
    // weißes, nach oben zeigendes Dreieck mit Schaft
    const spitze = v > 0.2 && v < 0.62 && Math.abs(u - 0.5) < (v - 0.2) * 0.62;
    const schaft = v >= 0.62 && v < 0.8 && Math.abs(u - 0.5) < 0.07;
    return spitze || schaft ? [255, 255, 255] : [255, 138, 0];
  });
}

for (const s of [180, 192, 512]) writeFileSync(`public/icons/icon-${s}.png`, icon(s));
console.log('Icons geschrieben');
