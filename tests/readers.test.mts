// Accuracy check for the lab-report and allergy-test readers on different real-world layouts.
//   npx tsx tests/readers.test.mts
// Fixtures: SI units (mmol/L…), reference range before the result, English/US report,
// ImmunoCAP-style allergy test with "<0.35", Albanian Pozitiv/Negativ intolerance test.
import { readFile } from 'node:fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parseLabLines } from '../src/lib/labReport.ts';
import { parseAllergyLines } from '../src/lib/allergens.ts';

const F = new URL('./fixtures/', import.meta.url);

// Same line grouping as readPdfLines() in src/lib/labReport.ts (that one runs in the browser).
async function lines(file: URL) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await readFile(file)), verbosity: 0 }).promise;
  const out: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const rows: { y: number; parts: { x: number; s: string }[] }[] = [];
    for (const it of (await (await doc.getPage(p)).getTextContent()).items as { str?: string; transform: number[] }[]) {
      if (!it.str?.trim()) continue;
      const [, , , , x, y] = it.transform;
      let r = rows.find((r) => Math.abs(r.y - y) < 3);
      if (!r) rows.push((r = { y, parts: [] }));
      r.parts.push({ x, s: it.str });
    }
    rows.sort((a, b) => b.y - a.y).forEach((r) => out.push(r.parts.sort((a, b) => a.x - b.x).map((t) => t.s).join('  ')));
  }
  return out;
}

const LAB: [URL, Record<string, number>][] = [
  [new URL('../public/sample-lab-report.pdf', import.meta.url), { glu: 108, mg: 1.6, ca: 8.2, hgb: 13.2, vitd: 12, b12: 198, ferritin: 19, tsh: 3.62, bpSys: 142, bpDia: 91, pulse: 84 }],
  [new URL('L1-kosovo-mmol.pdf', F), { glu: 106, mg: 1.5, ca: 8.3, hgb: 12.8, ferritin: 19, vitd: 16, b12: 220, tsh: 2.1 }],
  [new URL('L2-range-first.pdf', F), { mg: 1.5, vitd: 14, ferritin: 15, glu: 112 }],
  [new URL('L3-english.pdf', F), { glu: 104, ca: 9.1, mg: 1.6, hgb: 12.9, ferritin: 22, vitd: 18, b12: 210, tsh: 3.1 }],
  [new URL('L4-scanned.pdf', F), {}], // image only: must read nothing rather than guess
];
const ALLERGY: [URL, string[]][] = [
  [new URL('../public/sample-allergy-test.pdf', import.meta.url), ['eggs', 'lactose', 'nuts', 'peanuts', 'sesame']],
  [new URL('A1-immunocap.pdf', F), ['milk', 'peanuts', 'soy']],
  [new URL('A2-pozitiv-negativ.pdf', F), ['eggs', 'gluten', 'lactose']],
];

let failed = 0;
for (const [file, want] of LAB) {
  const got = Object.fromEntries(parseLabLines(await lines(file)).values.map((v) => [v.key, v.value]));
  const bad = [...Object.entries(want).filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k} got ${got[k]} want ${v}`), ...Object.keys(got).filter((k) => !(k in want)).map((k) => `unexpected ${k}`)];
  failed += bad.length;
  console.log(`${bad.length ? '❌' : '✅'} ${file.pathname.split('/').pop()}${bad.length ? ': ' + bad.join(', ') : ''}`);
}
for (const [file, want] of ALLERGY) {
  const got = parseAllergyLines(await lines(file)).map((x) => x.id).sort();
  const ok = JSON.stringify(got) === JSON.stringify([...want].sort());
  failed += +!ok;
  console.log(`${ok ? '✅' : '❌'} ${file.pathname.split('/').pop()}: [${got.join(', ')}]${ok ? '' : ` want [${want.join(', ')}]`}`);
}
if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll reader checks passed');
