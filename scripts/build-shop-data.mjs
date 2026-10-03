// Build public/data/shop-products.json from Vendorja's Kosovo retail catalogue
// (github.com/ShendLlapashtica/vendorjaks, data/kosovo-retail.json).
//   node scripts/build-shop-data.mjs [path/to/kosovo-retail.json]
import { readFile, writeFile } from 'node:fs/promises';

const SRC = process.argv[2] ?? '../vendorjaks-clean/data/kosovo-retail.json';
const raw = JSON.parse(await readFile(SRC, 'utf8'));

const NOT_KOSOVO = /Tiran|Shqip/i;
const NON_FOOD_SRC = /etc-ks|gorenje|tobac|duhan/i;
const NON_FOOD = /shamp|detergj|lotion|losion|krem (duar|fytyr|trup)|deodor|parfum|pelena|diaper|sapun|soap|pastrues|kozmet|furç|brush|letër higj|pecet|shtupa|bateri|llamb|qese|kujdes|flok|tobacco|cigar|duhan|ushqim (për )?(qen|mace)|whiskas|pedigree|felix|frizz|gel dush|dush gel|razor|brisk|tampon|always|colgate|pastë dhëmb/i;

// Free-from claims read from the product NAME (what the shop lists), not verified ingredients.
const CLAIMS = {
  gf: /gluten[\s-]*free|pa\s*gluten|senza\s*glutine|bez\s*glutena|glutenfrei|sans\s*gluten|glutensiz|nutrifree/i,
  lf: /lactose[\s-]*free|pa\s*lakto|senza\s*lattosio|bez\s*laktoz|laktosefrei|laktozsuz|zero\s*lacto/i,
  sf: /sugar[\s-]*free|pa\s*sheqer|senza\s*zucchero|bez\s*še[cć]er|zuckerfrei|şekersiz|zero\s*sugar|no\s*sugar|zero\s*zucc/i,
  vg: /\bvegan|plant[\s-]*based/i,
  pm: /(qum[eë]sht|milk|drink|pije|latte|mleko|napitak|süt)\s*(bajame|almond|mandorl|badem|tërshër|tershër|oat|avena|soj|soy|orizi|rice|kokos|coconut)|(almond|oat|soy|soja|rice|coconut|kokos)\s*(milk|drink)|\balpro\b|\boatly\b/i,
};
const NOT_PLANT_MILK = /çokol|cokol|choco|ritter|milka|biskot|lotion|sapun|krem/i;

const groups = new Map();
for (const p of raw.products) {
  if (NOT_KOSOVO.test(p.sourceLabel) || NON_FOOD_SRC.test(p.source)) continue;
  const name = (p.name ?? '').replace(/\s+/g, ' ').trim();
  if (!name || NON_FOOD.test(name) || NON_FOOD.test(p.category ?? '')) continue;
  const code = /^\d{8}$|^\d{12,14}$/.test(p.barcode ?? '') ? p.barcode : null;
  const key = code ?? name.toUpperCase().replace(/[^A-ZËÇ0-9]+/g, ' ').trim();
  let g = groups.get(key);
  if (!g) groups.set(key, (g = { n: name, b: p.brand ?? undefined, c: code ?? undefined, i: p.image ?? undefined, k: p.category ?? undefined, o: [] }));
  if (!g.i && p.image) g.i = p.image;
  if (!g.b && p.brand) g.b = p.brand;
  const price = Number(p.price);
  const shop = p.sourceLabel.replace(/\s*\((Wolt|e-shop)\)\s*$/, '');
  if (!g.o.some((o) => o.s === shop)) g.o.push({ s: shop, p: Number.isFinite(price) ? price : undefined, u: p.url });
}

const products = [...groups.values()].map((g) => {
  const f = Object.entries(CLAIMS).filter(([k, re]) => re.test(g.n) && !(k === 'pm' && NOT_PLANT_MILK.test(g.n))).map(([k]) => k);
  g.o.sort((a, b) => (a.p ?? 1e9) - (b.p ?? 1e9));
  return { ...g, f: f.length ? f : undefined };
});

await writeFile('public/data/shop-products.json', JSON.stringify({
  source: 'Vendorja Kosovo retail catalogue (github.com/ShendLlapashtica/vendorjaks)',
  builtAt: raw.builtAt, count: products.length, shops: new Set(products.flatMap((p) => p.o.map((o) => o.s))).size, products,
}));
const flagged = (k) => products.filter((p) => p.f?.includes(k)).length;
console.log(`${products.length} products · ${new Set(products.flatMap((p) => p.o.map((o) => o.s))).size} shops · barcodes ${products.filter((p) => p.c).length} · gf ${flagged('gf')} lf ${flagged('lf')} sf ${flagged('sf')} vg ${flagged('vg')} pm ${flagged('pm')}`);
