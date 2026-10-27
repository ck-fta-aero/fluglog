import { expect, test } from '@playwright/test';
import { abschliessen, neuerFlug, schnellflug, seg, setzeZeit, skip, start, testbild, weiter } from './helpers';

const sum = (page: import('@playwright/test').Page, id: string) => page.getByTestId(`sum-${id}`);

test('AK-01, AK-02, AK-04, AK-06, AK-07, AK-08, AK-10, AK-12, AK-13, AK-14: kompletter Flug mit allen Schritten und Foto-Testbildern', async ({ page }) => {
  await start(page, '2026-10-27T10:00:30Z');
  await expect(page.getByTestId('neuer-flug')).toHaveText('Neuer Flug');
  await expect(page.getByRole('heading', { name: 'Flugliste' })).toBeVisible();
  await neuerFlug(page);

  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 1 von 10');
  await page.getByTestId('ac-D-EFTA').click();
  await weiter(page);

  await page.getByTestId('oel').fill('1,0');
  await weiter(page);

  await page.getByTestId('foto-start').setInputFiles(testbild());
  await expect(page.getByTestId('foto-start-vorschau')).toBeVisible();
  await expect(page.getByText('Neu aufnehmen')).toBeVisible();
  await weiter(page);

  await page.getByTestId('kraftstoff').fill('80');
  await expect(page.getByTestId('gallonen')).toHaveText('21,1 US gal');
  await page.getByTestId('foto-tank').setInputFiles(testbild());
  await expect(page.getByTestId('foto-tank-vorschau')).toBeVisible();
  await weiter(page);

  await setzeZeit(page, '2026-10-27T10:15:40Z');
  await expect(page.getByTestId('zeit')).toHaveText('10:15 UTC');
  await weiter(page);

  await setzeZeit(page, '2026-10-27T10:25:10Z');
  await page.getByTestId('t-p1').click();
  await expect(page.getByTestId('zeit')).toHaveText('10:26 UTC');
  await weiter(page);

  await setzeZeit(page, '2026-10-27T11:40:05Z');
  await page.getByTestId('l-plus').click();
  await page.getByTestId('l-plus').click();
  await expect(page.getByTestId('l-wert')).toHaveText('2');
  await weiter(page);

  await setzeZeit(page, '2026-10-27T11:55:00Z');
  await page.getByTestId('t-m2').click();
  await expect(page.getByTestId('zeit')).toHaveText('11:53 UTC');
  await expect(page.getByTestId('l-wert')).toHaveText('2');
  await weiter(page);

  await expect(page.getByTestId('l-wert')).toHaveText('2');
  await page.getByTestId('foto-ende').setInputFiles(testbild());
  await expect(page.getByTestId('foto-ende-vorschau')).toBeVisible();
  await weiter(page);

  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 10 von 10');
  await abschliessen(page);

  const eintrag = page.getByTestId('flug-item');
  await expect(eintrag).toHaveCount(1);
  for (const t of ['D-EFTA', '27.10.2026', 'Block off 10:15 UTC', 'Blockzeit 1:38', 'Landungen 2']) {
    await expect(eintrag).toContainText(t);
  }

  await eintrag.click();
  await expect(sum(page, 'kennzeichen')).toHaveText('D-EFTA');
  await expect(sum(page, 'datum')).toHaveText('27.10.2026');
  await expect(sum(page, 'blockoff')).toHaveText('10:15 UTC');
  await expect(sum(page, 'takeoff')).toHaveText('10:26 UTC');
  await expect(sum(page, 'landung')).toHaveText('11:40 UTC');
  await expect(sum(page, 'blockon')).toHaveText('11:53 UTC');
  await expect(sum(page, 'blockzeit')).toHaveText('1:38');
  await expect(sum(page, 'flugzeit')).toHaveText('1:14');
  await expect(sum(page, 'landungen')).toHaveText('2');
  await expect(sum(page, 'oel')).toHaveText('1,0 l');
  await expect(sum(page, 'kraftstoff-l')).toHaveText('80 l');
  await expect(sum(page, 'kraftstoff-gal')).toHaveText('21,1 US gal');
  await expect(sum(page, 'hobbs-diff')).toHaveText('—');
  await expect(sum(page, 'flight-diff')).toHaveText('—');

  // Fotos: drei Vorschaubilder, auf 1600 px lange Kante verkleinert
  await expect(page.getByTestId('thumb')).toHaveCount(3);
  await expect
    .poll(() => page.getByTestId('thumb').first().evaluate((i) => (i as HTMLImageElement).naturalWidth))
    .toBe(1600);

  // Tipp auf ein Bild: bildschirmfüllend mit Zoom
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('viewer')).toBeVisible();
  await page.getByTestId('zoom-in').click();
  await expect(page.getByTestId('viewer-bild')).toHaveAttribute('data-zoom', '1.5');
  await page.getByTestId('viewer-close').click();
  await expect(page.getByTestId('viewer')).toHaveCount(0);
});

test('AK-04, AK-05, AK-06, AK-07, AK-13, AK-14, AK-15: Flug mit getippten Hobbs-/Flight-Ständen, Öl und Kraftstoff ohne Fotos', async ({ page }) => {
  await start(page, '2026-10-27T08:00:00Z');
  await schnellflug(page, 'D-EFTA');

  await neuerFlug(page);
  // zuletzt geflogenes Flugzeug ist hervorgehoben, aber nicht vorausgewählt
  await expect(page.getByTestId('ac-D-EFTA')).toHaveClass(/zuletzt/);
  for (const a of ['D-EFTA', 'D-EFTD', 'D-ETRY', 'D-EZCD', 'OE-KMH']) {
    await expect(page.getByTestId(`ac-${a}`)).toHaveAttribute('aria-pressed', 'false');
  }
  await expect(page.getByRole('button', { name: 'Weiter' })).toHaveCount(0);
  await page.getByTestId('ac-D-EZCD').click();
  await weiter(page);

  await page.getByTestId('oel').fill('0.2');
  await page.getByTestId('oel').press('Tab');
  await expect(page.getByTestId('oel')).toHaveValue('0,2');
  await weiter(page);

  await page.getByTestId('hobbs').fill('1234,5');
  await page.getByTestId('flight').fill('1100.2');
  await page.getByTestId('flight').press('Tab');
  await expect(page.getByTestId('flight')).toHaveValue('1100,2');
  await weiter(page);

  await page.getByTestId('kraftstoff').fill('50');
  await expect(page.getByTestId('gallonen')).toHaveText('13,2 US gal');
  await weiter(page);

  for (let i = 0; i < 4; i++) await skip(page);
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 9 von 10');
  await page.getByTestId('hobbs').fill('1235.7');
  await page.getByTestId('flight').fill('1101,3');
  await page.getByTestId('flight').press('Tab');
  await weiter(page);
  await abschliessen(page);

  const eintraege = page.getByTestId('flug-item');
  await expect(eintraege).toHaveCount(2);
  await expect(eintraege.first()).toContainText('D-EZCD'); // neueste zuerst
  await eintraege.first().click();
  await expect(sum(page, 'hobbs-start')).toHaveText('1234,5');
  await expect(sum(page, 'hobbs-ende')).toHaveText('1235,7');
  await expect(sum(page, 'hobbs-diff')).toHaveText('1,2');
  await expect(sum(page, 'flight-start')).toHaveText('1100,2');
  await expect(sum(page, 'flight-ende')).toHaveText('1101,3');
  await expect(sum(page, 'flight-diff')).toHaveText('1,1');
  await expect(sum(page, 'oel')).toHaveText('0,2 l');
  await expect(sum(page, 'kraftstoff-l')).toHaveText('50 l');
  await expect(sum(page, 'kraftstoff-gal')).toHaveText('13,2 US gal');
  for (const id of ['blockoff', 'takeoff', 'landung', 'blockon', 'blockzeit', 'flugzeit', 'fotos']) {
    await expect(sum(page, id)).toHaveText('—');
  }
});

test('AK-03: Sprung über die Fortschrittsanzeige zurück mit nachträglicher Eingabe und wieder nach vorn', async ({ page }) => {
  await start(page, '2026-10-27T09:00:20Z');
  await neuerFlug(page);
  await page.getByTestId('ac-D-ETRY').click();
  await weiter(page);
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 2 von 10');

  // Trefferfläche mindestens 44 px hoch
  for (let n = 1; n <= 10; n++) {
    const box = await page.getByTestId(`seg-${n}`).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  await seg(page, 5);
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 5 von 10');
  await page.getByTestId('jetzt').click();
  await expect(page.getByTestId('zeit')).toHaveText('09:00 UTC');

  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 4 von 10');

  await seg(page, 2);
  await expect(page.getByTestId('seg-2')).toHaveAttribute('aria-current', 'step');
  await page.getByTestId('oel').fill('1,5');
  await expect(page.getByTestId('seg-2')).toHaveAttribute('data-eingabe', 'ja');
  await expect(page.getByTestId('seg-1')).toHaveAttribute('data-eingabe', 'ja');
  await expect(page.getByTestId('seg-5')).toHaveAttribute('data-eingabe', 'ja');
  await expect(page.getByTestId('seg-3')).toHaveAttribute('data-eingabe', 'nein');

  await seg(page, 5);
  await expect(page.getByTestId('zeit')).toHaveText('09:00 UTC'); // Eingabe blieb erhalten
  await seg(page, 2);
  await expect(page.getByTestId('oel')).toHaveValue('1,5');

  await seg(page, 10);
  await abschliessen(page);
  await page.getByTestId('flug-item').click();
  await expect(sum(page, 'kennzeichen')).toHaveText('D-ETRY');
  await expect(sum(page, 'oel')).toHaveText('1,5 l');
  await expect(sum(page, 'blockoff')).toHaveText('09:00 UTC');
});

test('AK-04, AK-13: eingetipptes Kennzeichen erscheint beim nächsten Flug als Auswahltaste', async ({ page }) => {
  await start(page, '2026-10-27T07:00:00Z');
  await neuerFlug(page);
  await page.getByTestId('aircraft-input').fill('d-abcd');
  await expect(page.getByTestId('aircraft-input')).toHaveValue('D-ABCD');
  await seg(page, 10);
  await abschliessen(page);
  await expect(page.getByTestId('flug-item').first()).toContainText('D-ABCD');

  await neuerFlug(page);
  await expect(page.getByTestId('ac-D-ABCD')).toBeVisible();
  await expect(page.getByTestId('ac-D-ABCD')).toHaveClass(/zuletzt/);
  await page.getByTestId('ac-D-ABCD').click();
  await expect(page.getByTestId('ac-D-ABCD')).toHaveAttribute('aria-pressed', 'true');
  await seg(page, 10);
  await abschliessen(page);
  await expect(page.getByTestId('flug-item')).toHaveCount(2);
  await expect(page.getByTestId('flug-item').first()).toContainText('D-ABCD');
});

test('AK-02, AK-12, AK-15: Flug mit jedem Schritt übersprungen', async ({ page }) => {
  await start(page, '2026-10-27T12:00:00Z');
  await neuerFlug(page);
  for (let n = 1; n <= 9; n++) {
    await expect(page.getByTestId('schritt-titel')).toContainText(`Schritt ${n} von 10`);
    await skip(page);
  }
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 10 von 10');
  await abschliessen(page);

  const eintrag = page.getByTestId('flug-item');
  await expect(eintrag).toHaveCount(1);
  await expect(eintrag).toContainText('Block off —');
  await expect(eintrag).toContainText('Blockzeit —');
  await expect(eintrag).toContainText('Landungen 0');
  await eintrag.click();
  for (const id of ['kennzeichen', 'blockoff', 'takeoff', 'landung', 'blockon', 'blockzeit', 'flugzeit', 'hobbs-start', 'hobbs-diff', 'flight-diff', 'oel', 'kraftstoff-l', 'kraftstoff-gal']) {
    await expect(sum(page, id)).toHaveText('—');
  }
  await expect(sum(page, 'landungen')).toHaveText('0');
});

test('AK-11: Neuladen mitten im Flug, höchstens ein laufender Flug', async ({ page }) => {
  await start(page, '2026-10-27T12:00:00Z');
  await neuerFlug(page);
  await page.getByTestId('ac-D-EFTD').click();
  await weiter(page);
  await page.getByTestId('oel').fill('1,0');
  await weiter(page);
  await page.getByTestId('hobbs').fill('100');
  await page.getByTestId('hobbs').press('Tab');
  await weiter(page);
  await page.getByTestId('kraftstoff').fill('40');
  await page.waitForTimeout(400);

  await page.reload();
  await expect(page.getByTestId('schritt-titel')).toContainText('Schritt 4 von 10');
  await expect(page.getByTestId('kraftstoff')).toHaveValue('40');
  await seg(page, 3);
  await expect(page.getByTestId('hobbs')).toHaveValue('100,0');
  await seg(page, 2);
  await expect(page.getByTestId('oel')).toHaveValue('1,0');

  // zurück zur Liste und „Neuer Flug“ setzt den laufenden Flug fort
  await page.getByTestId('zur-liste').click();
  await neuerFlug(page);
  await expect(page.getByTestId('seg-1')).toHaveAttribute('data-eingabe', 'ja');
  await seg(page, 10);
  await abschliessen(page);
  await expect(page.getByTestId('flug-item')).toHaveCount(1);
  await expect(page.getByTestId('flug-item')).toContainText('D-EFTD');
});

test.describe('Mitternacht UTC bei abweichender Ortszeit', () => {
  test.use({ timezoneId: 'Pacific/Auckland' });

  test('AK-09, AK-16: Flug über Mitternacht UTC, Anzeige nur in UTC', async ({ page }) => {
    await start(page, '2026-10-27T23:40:00Z');
    await neuerFlug(page);
    await page.getByTestId('ac-OE-KMH').click();
    await seg(page, 5);
    await setzeZeit(page, '2026-10-27T23:50:30Z');
    await expect(page.getByTestId('zeit')).toHaveText('23:50 UTC');
    await seg(page, 6);
    await setzeZeit(page, '2026-10-27T23:58:10Z');
    await seg(page, 7);
    await setzeZeit(page, '2026-10-28T00:21:00Z');
    await expect(page.getByTestId('zeit')).toHaveText('00:21 UTC');
    await seg(page, 8);
    await setzeZeit(page, '2026-10-28T00:35:40Z');
    await expect(page.getByTestId('zeit')).toHaveText('00:35 UTC');
    await expect(page.getByTestId('hinweis')).toHaveCount(0);
    await seg(page, 10);
    await abschliessen(page);

    const eintrag = page.getByTestId('flug-item');
    await expect(eintrag).toContainText('27.10.2026');
    await expect(eintrag).toContainText('Blockzeit 0:45');
    await eintrag.click();
    await expect(sum(page, 'datum')).toHaveText('27.10.2026');
    await expect(sum(page, 'blockoff')).toHaveText('23:50 UTC');
    await expect(sum(page, 'takeoff')).toHaveText('23:58 UTC');
    await expect(sum(page, 'landung')).toHaveText('00:21 UTC');
    await expect(sum(page, 'blockon')).toHaveText('00:35 UTC');
    await expect(sum(page, 'blockzeit')).toHaveText('0:45');
    await expect(sum(page, 'flugzeit')).toHaveText('0:23');
  });
});
