// Allergens & intolerances, product verdicts, and the allergy-test (PDF) reader.
import { readPdfLines } from './labReport';

export type AllergenId =
  | 'gluten' | 'lactose' | 'milk' | 'nuts' | 'peanuts' | 'eggs' | 'soy'
  | 'fish' | 'shellfish' | 'sesame' | 'celery' | 'mustard' | 'sulphites';

export interface Allergen {
  id: AllergenId;
  al: string;
  en: string;
  /** Open Food Facts allergen/trace tags that mean "contains this". */
  off: string[];
  /** Words in a shop's product name that suggest the product contains it. */
  name?: RegExp;
  /** How it's written on an allergy / intolerance test report. */
  test: RegExp;
}

export const ALLERGENS: Allergen[] = [
  { id: 'gluten', al: 'Gluten (celiakia)', en: 'Gluten (coeliac)', off: ['en:gluten'], name: /\bbuk[eë]|\bbread|miell|flour|makaron|pasta|spaget|biskot|keks|kroasan|grur|wheat|tërshër|elb|barley|raž|petulla|pica|pizza|burek|pite\b/i, test: /grur|wheat|\bf4\b|gluten|gliadin|t-?TG|transglutamin|celiak|c[oe]+liac/i },
  { id: 'lactose', al: 'Laktoza (intolerancë)', en: 'Lactose (intolerance)', off: ['en:milk'], name: /qum[eë]sht|milk|jogurt|yog|djath|cheese|kaçkavall|gjiz|krem\s*qum|ajk|butter|gjalp|mozarel|feta\b/i, test: /laktoz|lactose|\bLCT\b|frym[eë]marr|breath|hidrogjen/i },
  { id: 'milk', al: 'Qumështi (alergji)', en: 'Milk (allergy)', off: ['en:milk'], name: /qum[eë]sht|milk|jogurt|yog|djath|cheese|kaçkavall|gjiz|ajk|butter|gjalp|mozarel|feta\b/i, test: /qum[eë]sht|cow'?s?\s*milk|\bmilk\b|\bf2\b|kazein|casein|laktoglobulin/i },
  { id: 'nuts', al: 'Arrat (lajthi, bajame…)', en: 'Tree nuts', off: ['en:nuts'], name: /lajthi|hazel|nutella|bajame|almond|badem|arr[aë]\b|walnut|shqeme|cashew|f[eë]st[eë]k|pistach|pekan|makadam/i, test: /lajthi|hazel|\bf17\b|walnut|\bf256\b|bajame|almond|\bf20\b|shqeme|cashew|\bf202\b|f[eë]st[eë]k|pistach|\bf203\b|\barr[aë]\b|tree\s*nut/i },
  { id: 'peanuts', al: 'Kikirikët', en: 'Peanuts', off: ['en:peanuts'], name: /kikirik|peanut|arachid/i, test: /kikirik|peanut|arachis|\bf13\b/i },
  { id: 'eggs', al: 'Vezët', en: 'Eggs', off: ['en:eggs'], name: /\bvez[eë]|\begg|majonez|mayonn/i, test: /\bvez[eë]|\begg|\bf1\b|\bf75\b|ovalbumin|ovomukoid/i },
  { id: 'soy', al: 'Soja', en: 'Soy', off: ['en:soybeans'], name: /\bsoj|\bsoy|tofu/i, test: /\bsoj|\bsoy|\bf14\b/i },
  { id: 'fish', al: 'Peshku', en: 'Fish', off: ['en:fish'], name: /peshk|ton\b|tuna|sardel|salmon|salmo|skumbri|fish/i, test: /peshk|\bfish|merluc|\bcod\b|\bf3\b/i },
  { id: 'shellfish', al: 'Frutat e detit', en: 'Shellfish', off: ['en:crustaceans', 'en:molluscs'], name: /karkalec|shrimp|gambor|midhj|kallamar|squid|oktapod/i, test: /karkalec|shrimp|\bf24\b|crustac|molusk|mollusc/i },
  { id: 'sesame', al: 'Susami', en: 'Sesame', off: ['en:sesame-seeds'], name: /susam|sesame|tahin|hallv/i, test: /susam|sesame|\bf10\b/i },
  { id: 'celery', al: 'Selino', en: 'Celery', off: ['en:celery'], test: /selino|celery|\bf85\b/i },
  { id: 'mustard', al: 'Mustarda', en: 'Mustard', off: ['en:mustard'], name: /mustard|senf/i, test: /mustard|\bf89\b/i },
  { id: 'sulphites', al: 'Sulfitet', en: 'Sulphites', off: ['en:sulphur-dioxide-and-sulphites'], test: /sulfit|sulphit|sulfite/i },
];
export const allergenById = Object.fromEntries(ALLERGENS.map((a) => [a.id, a])) as Record<AllergenId, Allergen>;

// ---- Shop catalogue (built from Vendorja's data, see scripts/build-shop-data.mjs) ----

export type Claim = 'gf' | 'lf' | 'sf' | 'vg' | 'pm';
export const CLAIM_LABEL: Record<Claim, { al: string; en: string }> = {
  gf: { al: 'Pa gluten', en: 'Gluten-free' },
  lf: { al: 'Pa laktozë', en: 'Lactose-free' },
  sf: { al: 'Pa sheqer', en: 'Sugar-free' },
  vg: { al: 'Vegan', en: 'Vegan' },
  pm: { al: 'Qumësht bimor', en: 'Plant milk' },
};

export interface ShopProduct {
  n: string; // name
  b?: string; // brand
  c?: string; // barcode
  i?: string; // image
  k?: string; // shop category
  f?: Claim[]; // free-from claims found in the name
  o: { s: string; p?: number; u?: string }[]; // offers: shop, price, link (cheapest first)
}

let catalogue: Promise<{ products: ShopProduct[]; shops: number; builtAt: string }> | null = null;
export function loadCatalogue() {
  catalogue ??= fetch('/data/shop-products.json').then((r) => r.json());
  return catalogue;
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ë/g, 'e').replace(/ç/g, 'c');
const SYNONYMS: Record<string, string[]> = {
  almond: ['bajame', 'badem', 'mandorl', 'almond'], bajame: ['bajame', 'badem', 'mandorl', 'almond'],
  milk: ['qumesht', 'milk', 'mleko', 'latte', 'drink'], qumesht: ['qumesht', 'milk', 'mleko', 'latte'],
  oat: ['tershere', 'oat', 'avena', 'zob'], tershere: ['tershere', 'oat', 'avena'],
  soy: ['soje', 'soja', 'soy', 'tofu'], soja: ['soje', 'soja', 'soy'],
  rice: ['oriz', 'rice', 'riso'], oriz: ['oriz', 'rice', 'riso'],
  bread: ['buke', 'bread', 'pan'], buke: ['buke', 'bread'],
  pasta: ['makarona', 'pasta', 'spageti'], makarona: ['makarona', 'pasta', 'spageti'],
  flour: ['miell', 'flour', 'farina'], miell: ['miell', 'flour', 'farina'],
  cheese: ['djath', 'cheese', 'kackavall'], djath: ['djath', 'cheese', 'kackavall'],
  chocolate: ['cokollat', 'choco'], cokollate: ['cokollat', 'choco'],
  coconut: ['kokos', 'coconut', 'cocco'], kokos: ['kokos', 'coconut', 'cocco'],
};
const STOP = new Set(['pa', 'free', 'me', 'dhe', 'and', 'the', 'e', 'i', 'te', 'per']);

/** Name search over the shop catalogue, with Albanian/English synonyms. */
export function searchProducts(products: ShopProduct[], query: string, claim?: Claim, limit = 40) {
  const words = fold(query).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
  const alts = words.map((w) => SYNONYMS[w] ?? [w]);
  const out: ShopProduct[] = [];
  for (const p of products) {
    if (claim && !p.f?.includes(claim)) continue;
    if (alts.length) {
      const hay = fold(`${p.n} ${p.b ?? ''}`);
      if (!alts.every((group) => group.some((a) => hay.includes(a)))) continue;
    }
    out.push(p);
  }
  // Products sold in more shops first, then cheapest.
  out.sort((a, b) => (b.f ? 1 : 0) - (a.f ? 1 : 0) || b.o.length - a.o.length || (a.o[0]?.p ?? 1e9) - (b.o[0]?.p ?? 1e9));
  return { total: out.length, items: out.slice(0, limit) };
}

/** Profile allergens a product's NAME mentions — a hint, not an ingredient check. */
export function nameWarnings(p: ShopProduct, profile: AllergenId[]) {
  return profile.filter((id) => {
    const a = allergenById[id];
    if (!a.name?.test(p.n)) return false;
    if (id === 'lactose' && p.f?.includes('lf')) return false;
    if (id === 'gluten' && p.f?.includes('gf')) return false;
    if ((id === 'milk' || id === 'lactose') && p.f?.includes('pm')) return false;
    return true;
  });
}

// ---- Ingredient check via Open Food Facts ----

export interface OffProduct {
  code: string;
  name?: string;
  brand?: string;
  image?: string;
  ingredients?: string;
  allergens: string[];
  traces: string[];
  labels: string[];
}
const offCache = new Map<string, Promise<OffProduct | null>>();
export function fetchOff(code: string) {
  let hit = offCache.get(code);
  if (!hit) {
    const fields = 'product_name,brands,image_front_small_url,allergens_tags,traces_tags,labels_tags,ingredients_text,ingredients_text_sq,ingredients_text_en,ingredients_text_it,ingredients_text_de';
    hit = fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${fields}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = d?.status === 1 ? d.product : null;
        if (!p) return null;
        return {
          code,
          name: p.product_name || undefined,
          brand: p.brands || undefined,
          image: p.image_front_small_url || undefined,
          ingredients: p.ingredients_text_sq || p.ingredients_text_en || p.ingredients_text || p.ingredients_text_it || p.ingredients_text_de || undefined,
          allergens: p.allergens_tags ?? [],
          traces: p.traces_tags ?? [],
          labels: p.labels_tags ?? [],
        };
      })
      .catch(() => null);
    offCache.set(code, hit);
  }
  return hit;
}

export type Verdict = 'contains' | 'traces' | 'clear' | 'unknown';
export function verdictFor(off: OffProduct | null, profile: AllergenId[]) {
  if (!off) return { verdict: 'unknown' as Verdict, contains: [], traces: [] };
  const lactoseFree = off.labels.some((l) => /no-lactose|lactose-free/.test(l));
  const glutenFree = off.labels.includes('en:gluten-free');
  const hits = (tags: string[]) =>
    profile.filter((id) => {
      if (id === 'lactose' && lactoseFree) return false;
      if (id === 'gluten' && glutenFree) return false;
      return allergenById[id].off.some((t) => tags.includes(t));
    });
  const contains = hits(off.allergens);
  const traces = hits(off.traces).filter((id) => !contains.includes(id));
  const verdict: Verdict = contains.length ? 'contains' : traces.length ? 'traces' : off.ingredients || off.allergens.length ? 'clear' : 'unknown';
  return { verdict, contains, traces };
}

// ---- Allergy / intolerance test report (PDF) ----

export interface AllergyFinding { id: AllergenId; line: string; detail: string }

const ORDER: AllergenId[] = ['lactose', 'gluten', 'peanuts', 'nuts', 'milk', 'eggs', 'soy', 'fish', 'shellfish', 'sesame', 'celery', 'mustard', 'sulphites'];

/** Which allergens a test report flags as positive (IgE class ≥ 1, ≥ 0.35 kU/L, or "pozitiv"). */
export function parseAllergyLines(lines: string[]): AllergyFinding[] {
  const found = new Map<AllergenId, AllergyFinding>();
  const clean = lines.map((l) => l.replace(/\s+/g, ' ').trim());
  const hasResult = (l: string) => /klas[ae]?\s*[0-6]|class\s*[0-6]|kU|pozitiv|positive|negativ|negative|reaktiv/i.test(l);
  const matchId = (l: string) => ORDER.find((a) => allergenById[a].test.test(l));
  for (let i = 0; i < clean.length; i++) {
    let line = clean[i];
    const id = matchId(line);
    // A wrapped table row puts the result on the next visual line(s) — join them.
    for (let j = i + 1; id && !hasResult(line) && j <= i + 2 && j < clean.length; j++) {
      const next = matchId(clean[j]);
      if (next && next !== id) break;
      line = `${line} ${clean[j]}`;
    }
    if (!id || found.has(id)) continue;
    const cls = /(?:klas[ae]?|class)\s*([0-6])/i.exec(line)?.[1];
    const kU = /(\d+(?:[.,]\d+)?)\s*kU(?:A)?\s*\/\s*l/i.exec(line)?.[1];
    const negative = /negativ|negative|\bjo\s*reaktiv/i.test(line);
    const positive = /pozitiv|positive|reaktiv|intoleranc/i.test(line) && !negative;
    const isPos = cls !== undefined ? +cls >= 1 : kU !== undefined ? parseFloat(kU.replace(',', '.')) >= 0.35 : positive;
    if (!isPos || (negative && cls === undefined)) continue;
    found.set(id, { id, line, detail: cls !== undefined ? `klasa ${cls}` : kU ? `${kU} kU/L` : 'pozitiv' });
  }
  return [...found.values()];
}

export async function parseAllergyReport(file: File) {
  const { lines } = await readPdfLines(file);
  return parseAllergyLines(lines);
}
