import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { makePng } from '../../scripts/png.mjs';

let bildPfad: string | undefined;

/** Testbild 2400×1200 (soll auf 1600×800 verkleinert werden) */
export function testbild(): string {
  if (!bildPfad) {
    bildPfad = join(mkdtempSync(join(tmpdir(), 'fluglog-')), 'testbild.png');
    writeFileSync(bildPfad, makePng(2400, 1200, (x: number, y: number) => [x % 256, y % 256, 120]));
  }
  return bildPfad;
}

/** Feste Uhrzeit setzen und die App öffnen */
export async function start(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(iso));
  await page.goto('/');
}

export const uhr = (page: Page, iso: string) => page.clock.setFixedTime(new Date(iso));
export const neuerFlug = (page: Page) => page.getByTestId('neuer-flug').click();
export const skip = (page: Page) => page.getByRole('button', { name: 'Überspringen' }).click();
export const weiter = (page: Page) => page.getByRole('button', { name: 'Weiter' }).click();
export const seg = (page: Page, n: number) => page.getByTestId(`seg-${n}`).click();
export const abschliessen = (page: Page) => page.getByRole('button', { name: 'Flug abschließen' }).click();

/** „Jetzt“ mit fester Uhrzeit */
export async function setzeZeit(page: Page, iso: string) {
  await uhr(page, iso);
  await page.getByTestId('jetzt').click();
}

/** Minimaler Flug nur mit Kennzeichen */
export async function schnellflug(page: Page, kennzeichen: string) {
  await neuerFlug(page);
  await page.getByTestId(`ac-${kennzeichen}`).click();
  await seg(page, 10);
  await abschliessen(page);
}
