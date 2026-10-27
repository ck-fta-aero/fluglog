// Liest die JSON-Berichte von Vitest und Playwright und gibt die Tabelle AK-Nr → Testname → bestanden aus.
// Voraussetzung: vorher `npm test` (schreibt reports/unit.json und reports/e2e.json).
import { readFileSync, writeFileSync } from 'node:fs';

const lesen = (p) => JSON.parse(readFileSync(p, 'utf8'));
const tests = [];

for (const datei of lesen('reports/unit.json').testResults) {
  for (const t of datei.assertionResults) {
    tests.push({ titel: t.title, art: 'Vitest', ok: t.status === 'passed' });
  }
}

(function suite(s) {
  for (const spec of s.specs ?? []) {
    const ok = spec.tests.every((t) => t.results.length > 0 && t.results.every((r) => r.status === 'passed'));
    tests.push({ titel: spec.title, art: 'Playwright WebKit iPhone 13', ok });
  }
  for (const k of s.suites ?? []) suite(k);
})({ suites: lesen('reports/e2e.json').suites });

const zeilen = ['| AK-Nr | Testname | bestanden |', '|---|---|---|'];
let fehlt = 0;
for (let n = 1; n <= 20; n++) {
  const ak = `AK-${String(n).padStart(2, '0')}`;
  const treffer = tests.filter((t) => t.titel.match(/AK-\d\d/g)?.includes(ak));
  if (!treffer.length) {
    zeilen.push(`| ${ak} | (kein Test) | NEIN |`);
    fehlt++;
    continue;
  }
  for (const t of treffer) {
    const name = t.titel.replace(/^(AK-\d\d(, )?)+: /, '');
    zeilen.push(`| ${ak} | [${t.art}] ${name} | ${t.ok ? 'ja' : 'NEIN'} |`);
  }
}
const alleOk = tests.every((t) => t.ok) && fehlt === 0;
zeilen.push('', `Tests gesamt: ${tests.length}, alle bestanden: ${alleOk ? 'ja' : 'NEIN'}, AK ohne Test: ${fehlt}`);
const text = zeilen.join('\n');
writeFileSync('reports/AK-TABELLE.md', text + '\n');
console.log(text);
process.exit(alleOk ? 0 : 1);
