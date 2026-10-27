import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { unzipSync, strFromU8 } from 'fflate';
import { abschliessen, neuerFlug, schnellflug, seg, setzeZeit, start, testbild, weiter } from './helpers';

test('AK-08, AK-10: Zeit-Tasten und Landungszähler', async ({ page }) => {
  await start(page, '2026-10-27T12:00:20Z');
  await neuerFlug(page);

  // Landungszähler nur auf den Schritten 5–9
  for (const n of [1, 2, 3, 4, 10]) {
    await seg(page, n);
    await expect(page.getByTestId('landungen')).toHaveCount(0);
  }
  await seg(page, 5);
  await expect(page.getByTestId('zeit')).toHaveText('—');
  // ohne gesetzte Zeit gilt die aktuelle Zeit als Basis
  await page.getByTestId('t-p2').click();
  await expect(page.getByTestId('zeit')).toHaveText('12:02 UTC');
  await page.getByTestId('t-m3').click();
  await expect(page.getByTestId('zeit')).toHaveText('11:59 UTC');
  await page.getByTestId('t-p3').click();
  await page.getByTestId('t-m1').click();
  await expect(page.getByTestId('zeit')).toHaveText('12:01 UTC');
  await page.getByTestId('jetzt').click();
  await expect(page.getByTestId('zeit')).toHaveText('12:00 UTC');

  // Startwert 0, Minimum 0
  await expect(page.getByTestId('l-wert')).toHaveText('0');
  await page.getByTestId('l-minus').click();
  await expect(page.getByTestId('l-wert')).toHaveText('0');
  await page.getByTestId('l-plus').click();
  await expect(page.getByTestId('l-wert')).toHaveText('1');
  for (const n of [6, 7, 8, 9]) {
    await seg(page, n);
    await expect(page.getByTestId('l-wert')).toHaveText('1');
  }
});

test('AK-17: Plausibilitätshinweise, Eingabe bleibt erlaubt', async ({ page }) => {
  await start(page, '2026-10-27T10:00:00Z');
  await neuerFlug(page);
  await seg(page, 5);
  await setzeZeit(page, '2026-10-27T10:00:00Z');
  await seg(page, 6);
  await setzeZeit(page, '2026-10-27T09:50:00Z');
  await expect(page.getByTestId('hinweis')).toContainText('Take off liegt vor Block off');
  await expect(page.getByRole('button', { name: 'Weiter' })).toBeEnabled();
  await weiter(page);
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 7 von 10');

  await seg(page, 3);
  await page.getByTestId('hobbs').fill('200');
  await seg(page, 9);
  await page.getByTestId('hobbs').fill('199,5');
  await page.getByTestId('hobbs').press('Tab');
  await expect(page.getByTestId('hinweis').filter({ hasText: 'Hobbs' })).toBeVisible();
  await seg(page, 10);
  await abschliessen(page);
  await page.getByTestId('flug-item').click();
  await expect(page.getByTestId('hinweis')).toHaveCount(2);
  await expect(page.getByTestId('sum-hobbs-diff')).toHaveText('-0,5');
});

test('AK-18: Flug löschen nur nach Rückfrage', async ({ page }) => {
  await start(page, '2026-10-27T10:00:00Z');
  await schnellflug(page, 'D-EFTA');
  await page.getByTestId('flug-item').click();
  await page.getByTestId('flug-loeschen').click();
  await expect(page.getByRole('dialog', { name: 'Flug löschen' })).toBeVisible();
  await page.getByTestId('loeschen-nein').click();
  await expect(page.getByTestId('sum-kennzeichen')).toHaveText('D-EFTA');
  await page.getByTestId('flug-loeschen').click();
  await page.getByTestId('loeschen-ja').click();
  await expect(page.getByTestId('leer')).toBeVisible();
  await expect(page.getByTestId('flug-item')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('leer')).toBeVisible();
});

test('AK-13: Flugliste, neueste zuerst', async ({ page }) => {
  await start(page, '2026-10-27T10:00:00Z');
  await schnellflug(page, 'D-EFTA');
  await schnellflug(page, 'D-ETRY');
  await schnellflug(page, 'OE-KMH');
  const liste = page.getByTestId('flug-item');
  await expect(liste).toHaveCount(3);
  await expect(liste.nth(0)).toContainText('OE-KMH');
  await expect(liste.nth(1)).toContainText('D-ETRY');
  await expect(liste.nth(2)).toContainText('D-EFTA');
});

test('AK-19: Export aller Flüge samt Fotos als ZIP', async ({ page }) => {
  // Teilen-Menü ist im Testbrowser nicht vorhanden: die App fällt auf einen Download zurück
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
  });
  await start(page, '2026-10-27T10:00:00Z');
  await neuerFlug(page);
  await page.getByTestId('ac-D-EFTA').click();
  await seg(page, 3);
  await page.getByTestId('foto-start').setInputFiles(testbild());
  await expect(page.getByTestId('foto-start-vorschau')).toBeVisible();
  await seg(page, 4);
  await page.getByTestId('kraftstoff').fill('50');
  await seg(page, 10);
  await abschliessen(page);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
  expect(download.suggestedFilename()).toMatch(/^fluglog-\d{4}-\d{2}-\d{2}\.zip$/);
  const pfad = await download.path();
  const zip = unzipSync(new Uint8Array(readFileSync(pfad)));
  const namen = Object.keys(zip);
  expect(namen).toContain('flights.json');
  const bilder = namen.filter((n) => n.startsWith('fotos/') && n.endsWith('.jpg'));
  expect(bilder).toHaveLength(1);
  expect([zip[bilder[0]][0], zip[bilder[0]][1]]).toEqual([0xff, 0xd8]); // JPEG
  const json = JSON.parse(strFromU8(zip['flights.json']));
  expect(json.fluege).toHaveLength(1);
  expect(json.fluege[0].aircraft).toBe('D-EFTA');
  expect(json.fluege[0].fuelUsGal).toBe(13.2);
  expect(json.fluege[0].fotos['zaehler-start']).toBe(bilder[0]);
});

test('AK-20: nach einmaligem Laden komplett offline, Manifest und Service Worker erreichbar', async ({ page, context }) => {
  await start(page, '2026-10-27T10:00:00Z');
  expect((await page.request.get('/manifest.webmanifest')).status()).toBe(200);
  expect((await page.request.get('/sw.js')).status()).toBe(200);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('neuer-flug')).toBeVisible();
  await schnellflug(page, 'D-EZCD');
  await expect(page.getByTestId('flug-item')).toContainText('D-EZCD');
  await context.setOffline(false);
});
