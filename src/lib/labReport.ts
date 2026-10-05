import { BiomarkerData } from '../types';

export type BiomarkerKey = keyof BiomarkerData;

export interface ExtractedValue {
  key: BiomarkerKey;
  value: number;
  /** The PDF line the value was read from, shown back to the user. */
  sourceLine: string;
  /** Set when the report used a different unit and the value was converted. */
  convertedFrom?: string;
}

export interface LabReportResult {
  fileName: string;
  pages: number;
  lineCount: number;
  values: ExtractedValue[];
  patientName?: string;
  sampleDate?: string;
}

// Label patterns (Albanian + English). Matched against one text line; the value
// is the first number *after* the label, so digits inside labels (25-OH, B12) are skipped.
const LABELS: { key: Exclude<BiomarkerKey, 'bpSys' | 'bpDia'>; re: RegExp }[] = [
  { key: 'vitd', re: /25\s*-?\s*\(?OH\)?\s*(vitamin[ae]?\s*D\d?)?|vitamin[ae]?\s*D\s*3?|vit\.?\s*D\s*3?|kolekalciferol|cholecalciferol/i },
  { key: 'b12', re: /vitamin[ae]?\s*B\s?12|\bB\s?12\b|kobalamin\w*|cobalamin/i },
  { key: 'mg', re: /magnez\w*|magnesium|\bMg\b(?!\s*\/)/i },
  { key: 'ca', re: /kalc\w*|calcium|\bCa\b(?!\s*\/)(?!\s*19)/i },
  { key: 'ferritin', re: /ferritin\w*|feritin\w*/i },
  { key: 'hgb', re: /h[ae]?moglobin\w*|\bHGB\b|\bHb\b(?!\s*A)/i },
  { key: 'glu', re: /gl[uy][kc]o[sz]\w*|glicemi\w*|glucose|\bGLU\b/i },
  { key: 'tsh', re: /\bTSH\b|tirotropin\w*|thyrotropin/i },
  { key: 'pulse', re: /puls\w*|heart\s*rate|frekuenc\w*\s*kardiak\w*|\bHR\b/i },
];
const BP_LABEL = /tension\w*|presion\w*\s*(arterial|i\s*gjakut)?|blood\s*pressure|\bTA\b|\bBP\b/i;

// Unit conversions to the units the app works in (see BiomarkerData).
const CONVERSIONS: Partial<Record<BiomarkerKey, { unit: RegExp; label: string; factor: number }[]>> = {
  mg: [{ unit: /mmol\s*\/\s*l/i, label: 'mmol/L', factor: 2.431 }],
  ca: [{ unit: /mmol\s*\/\s*l/i, label: 'mmol/L', factor: 4.008 }],
  glu: [{ unit: /mmol\s*\/\s*l/i, label: 'mmol/L', factor: 18.016 }],
  vitd: [{ unit: /nmol\s*\/\s*l/i, label: 'nmol/L', factor: 1 / 2.496 }],
  b12: [{ unit: /pmol\s*\/\s*l/i, label: 'pmol/L', factor: 1.355 }],
  hgb: [{ unit: /\bg\s*\/\s*l\b/i, label: 'g/L', factor: 0.1 }],
};

const DECIMALS: Record<BiomarkerKey, number> = {
  mg: 1, ca: 1, vitd: 0, b12: 0, ferritin: 0, hgb: 1, glu: 0, tsh: 2, bpSys: 0, bpDia: 0, pulse: 0,
};

/** Display metadata + the reference ranges the app grades against. */
export const BIOMARKER_META: Record<BiomarkerKey, { al: string; en: string; unit: string; low: number; high: number }> = {
  mg: { al: 'Magnezi (Mg)', en: 'Magnesium (Mg)', unit: 'mg/dL', low: 1.7, high: 2.4 },
  ca: { al: 'Kalciumi (Ca)', en: 'Calcium (Ca)', unit: 'mg/dL', low: 8.5, high: 10.2 },
  vitd: { al: '25-OH Vitamina D', en: '25-OH Vitamin D', unit: 'ng/mL', low: 30, high: 100 },
  b12: { al: 'Vitamina B12', en: 'Vitamin B12', unit: 'pg/mL', low: 200, high: 900 },
  ferritin: { al: 'Ferritina', en: 'Ferritin', unit: 'ng/mL', low: 24, high: 336 },
  hgb: { al: 'Hemoglobina', en: 'Hemoglobin', unit: 'g/dL', low: 13.5, high: 17.5 },
  glu: { al: 'Glukoza esëll', en: 'Fasting Glucose', unit: 'mg/dL', low: 70, high: 99 },
  tsh: { al: 'TSH', en: 'TSH', unit: 'µIU/mL', low: 0.4, high: 4.0 },
  bpSys: { al: 'Tensioni arterial', en: 'Blood Pressure', unit: 'mmHg', low: 0, high: 120 },
  bpDia: { al: 'Tensioni diastolik', en: 'Diastolic BP', unit: 'mmHg', low: 0, high: 80 },
  pulse: { al: 'Pulsi', en: 'Pulse', unit: 'bpm', low: 60, high: 100 },
};

export function grade(key: BiomarkerKey, value: number): 'low' | 'high' | 'normal' {
  const { low, high } = BIOMARKER_META[key];
  return value < low ? 'low' : value > high ? 'high' : 'normal';
}

const NUMBER = /(\d+(?:[.,]\d+)?)/;
// Numbers that are never the result: reference ranges ("1.7 - 2.4", "30.0-100.0"),
// limits ("< 5.7", "≥ 30") and digits that are part of a test's name ("25-OH", "25-Hydroxy").
const NOT_A_RESULT = [
  /\d+(?:[.,]\d+)?\s*[-–—]\s*\d+(?:[.,]\d+)?/g,
  /[<>≤≥]\s*=?\s*\d+(?:[.,]\d+)?/g,
  /\(?\b25\s*[-(]?\s*(?:OH|hydroxy)\b\)?/gi,
];
const blankOut = (s: string) => NOT_A_RESULT.reduce((acc, re) => acc.replace(re, (m) => ' '.repeat(m.length)), s);
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Pull biomarker values out of a lab report's text lines. Pure — no PDF code. */
export function parseLabLines(lines: string[]): Pick<LabReportResult, 'values' | 'patientName' | 'sampleDate'> {
  const found = new Map<BiomarkerKey, ExtractedValue>();

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;

    const bp = BP_LABEL.exec(line);
    if (bp && !found.has('bpSys')) {
      const m = /(\d{2,3})\s*\/\s*(\d{2,3})/.exec(line.slice(bp.index + bp[0].length));
      if (m) {
        found.set('bpSys', { key: 'bpSys', value: +m[1], sourceLine: line });
        found.set('bpDia', { key: 'bpDia', value: +m[2], sourceLine: line });
        continue;
      }
    }

    for (const { key, re } of LABELS) {
      if (found.has(key)) continue;
      const label = re.exec(line);
      if (!label) continue;
      // Same length as the text after the label, with ranges/limits/name digits blanked out.
      const rest = blankOut(line.slice(label.index + label[0].length));
      const num = NUMBER.exec(rest);
      if (!num) continue;

      let value = parseFloat(num[1].replace(',', '.'));
      const unitText = rest.slice(num.index + num[0].length, num.index + num[0].length + 16);
      const conv = CONVERSIONS[key]?.find((c) => c.unit.test(unitText));
      if (conv) value *= conv.factor;

      found.set(key, {
        key,
        value: round(value, DECIMALS[key]),
        sourceLine: line,
        convertedFrom: conv ? `${num[1]} ${conv.label}` : undefined,
      });
      break; // one biomarker per line
    }
  }

  const text = lines.join('\n');
  // Fields on one line are separated by 2+ spaces (see readPdfLines); cap at 3 words
  // in case a PDF only puts one space before the next label.
  const patientName = /(?:pacienti|patient(?:\s*name)?|emri(?:\s*dhe\s*mbiemri)?)\s*:\s*([^\n:]+?)(?=\s{2,}|\n|$)/i
    .exec(text)?.[1]?.trim().split(/\s+/).slice(0, 3).join(' ');
  const sampleDate = /(?:data\s*e\s*marrjes|data|date(?:\s*collected)?)\s*:\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i
    .exec(text)?.[1];

  return { values: [...found.values()], patientName, sampleDate };
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/** Lazy-load pdf.js (~1.7 MB with its worker). Call early, e.g. on dragover, to hide the latency. */
export function loadPdfReader() {
  pdfjsPromise ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([pdfjs, { default: workerUrl }]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    void fetch(workerUrl).catch(() => {}); // warm the HTTP cache for the worker
    return pdfjs;
  });
  return pdfjsPromise;
}

/** Read a PDF in the browser and return its text, one entry per visual line. */
export async function readPdfLines(file: File): Promise<{ lines: string[]; pages: number }> {
  const pdfjs = await loadPdfReader();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group text runs that share a baseline (±3pt) into one line, left to right.
    const rows: { y: number; parts: { x: number; s: string }[] }[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const [, , , , x, y] = item.transform as number[];
      let row = rows.find((r) => Math.abs(r.y - y) < 3);
      if (!row) rows.push((row = { y, parts: [] }));
      row.parts.push({ x, s: item.str });
    }
    rows
      .sort((a, b) => b.y - a.y)
      .forEach((r) => lines.push(r.parts.sort((a, b) => a.x - b.x).map((t) => t.s).join('  ')));
  }

  const pages = doc.numPages;
  await task.destroy();
  return { lines, pages };
}

export async function parseLabReport(file: File): Promise<LabReportResult> {
  const { lines, pages } = await readPdfLines(file);
  return { fileName: file.name, pages, lineCount: lines.length, ...parseLabLines(lines) };
}
