// Foods (not supplements) that are rich in the nutrients a lab report can flag as low,
// with approximate amounts per portion. Values rounded from USDA FoodData Central /
// NIH Office of Dietary Supplements fact sheets — guidance, not a prescription.
import type { AllergenId } from '../lib/allergens';
import type { BiomarkerData } from '../types';

export type Nutrient = 'mg' | 'vitd' | 'b12' | 'iron' | 'ca';

export const NUTRIENTS: Record<Nutrient, { al: string; en: string; lowAl: string; unit: string; dailyAl: string; dailyEn: string; tipAl?: string; tipEn?: string }> = {
  mg: { al: 'Magnezi', en: 'Magnesium', lowAl: 'Magnezi i ulët', unit: 'mg', dailyAl: 'Nevoja ditore: ~310–420 mg', dailyEn: 'Daily need: ~310–420 mg' },
  vitd: { al: 'Vitamina D', en: 'Vitamin D', lowAl: 'Vitamina D e ulët', unit: 'µg', dailyAl: 'Nevoja ditore: ~15 µg (600 IU)', dailyEn: 'Daily need: ~15 µg (600 IU)', tipAl: 'Burimi kryesor është dielli — ushqimi jep pak.', tipEn: 'The main source is sunlight — food only adds a little.' },
  b12: { al: 'Vitamina B12', en: 'Vitamin B12', lowAl: 'Vitamina B12 e ulët', unit: 'µg', dailyAl: 'Nevoja ditore: ~2.4 µg', dailyEn: 'Daily need: ~2.4 µg', tipAl: 'Gjendet vetëm në ushqime shtazore.', tipEn: 'Found only in animal foods.' },
  ca: { al: 'Kalciumi', en: 'Calcium', lowAl: 'Kalciumi i ulët', unit: 'mg', dailyAl: 'Nevoja ditore: ~1000 mg', dailyEn: 'Daily need: ~1000 mg', tipAl: 'Vitamina D ndihmon trupin ta thithë kalciumin.', tipEn: 'Vitamin D helps your body absorb calcium.' },
  iron: { al: 'Hekuri', en: 'Iron', lowAl: 'Hekuri i ulët', unit: 'mg', dailyAl: 'Nevoja ditore: ~8 mg (burra) · ~18 mg (gra)', dailyEn: 'Daily need: ~8 mg (men) · ~18 mg (women)', tipAl: 'Hekuri nga bimët thithet më mirë me vitaminë C; çaji e kafeja e pengojnë.', tipEn: 'Plant iron absorbs better with vitamin C; tea and coffee block it.' },
};

export interface Deficiency {
  nutrient: Nutrient;
  marker: keyof BiomarkerData;
  value: number;
  unit: string;
  ref: string;
  /** Too low for food alone — a doctor should decide on treatment. */
  doctorFirst: boolean;
}

/** Which nutrients the current lab values say are low. */
export function findDeficiencies(b: BiomarkerData): Deficiency[] {
  const out: Deficiency[] = [];
  if (b.mg > 0 && b.mg < 1.7) out.push({ nutrient: 'mg', marker: 'mg', value: b.mg, unit: 'mg/dL', ref: '1.7–2.4', doctorFirst: b.mg < 1.2 });
  if (b.vitd > 0 && b.vitd < 30) out.push({ nutrient: 'vitd', marker: 'vitd', value: b.vitd, unit: 'ng/mL', ref: '30–100', doctorFirst: b.vitd < 20 });
  if (b.b12 > 0 && b.b12 < 200) out.push({ nutrient: 'b12', marker: 'b12', value: b.b12, unit: 'pg/mL', ref: '200–900', doctorFirst: b.b12 < 150 });
  if (b.ca > 0 && b.ca < 8.5) out.push({ nutrient: 'ca', marker: 'ca', value: b.ca, unit: 'mg/dL', ref: '8.5–10.2', doctorFirst: b.ca < 8 });
  if (b.ferritin > 0 && b.ferritin < 24) out.push({ nutrient: 'iron', marker: 'ferritin', value: b.ferritin, unit: 'ng/mL', ref: '24–336', doctorFirst: b.ferritin < 15 || (b.hgb > 0 && b.hgb < 12) });
  return out;
}

export interface NutrientFood {
  id: string;
  al: string;
  en: string;
  portionAl: string;
  portionEn: string;
  amounts: Partial<Record<Nutrient, number>>;
  /** Allergens the food itself contains (a free-from claim on a product can lift gluten/lactose). */
  allergens: AllergenId[];
  /** Matched against shop product names (lower-case, accents removed). */
  match: RegExp;
  exclude?: RegExp;
}

const SWEETS = /cokollat|choco|kinder|milka|nutella|bonbon|candy|biskot|cookie|keks|wafer|vafl|vafel|croiss|kroas|kek\b|torte|tort\b|krem\b|cream|akullor|ice ?cream|sheqerk|lollipop|gum\b|surprise|ozmo|princes|nougat|praline|caramel|karamel|schogetten|bajadera|magnum/;
const NOT_PLAIN = /cips|chips|aroma|flavou?r|me shije|leng|juice|sok\b|pije|drink|lotion|shampo|sapun|krem|snake|snack/;
const PET = /mace|cat\b|dog\b|qen\b|whiskas|felix|pedigree|friskies|kitekat/;
const x = (...parts: (RegExp | string)[]) => new RegExp(parts.map((p) => (typeof p === 'string' ? p : p.source)).join('|'));

export const NUTRIENT_FOODS: NutrientFood[] = [
  // --- Magnesium / iron: seeds, nuts, legumes, greens, grains ---
  { id: 'pumpkin-seeds', al: 'Fara kungulli', en: 'Pumpkin seeds', portionAl: '30 g', portionEn: '30 g', amounts: { mg: 150, iron: 2.5 }, allergens: [], match: /fara (te )?kungull|pumpkin seed|semi di zucca|bundev|kabak cekird/, exclude: SWEETS },
  { id: 'almonds', al: 'Bajame', en: 'Almonds', portionAl: '30 g', portionEn: '30 g', amounts: { mg: 80, ca: 75 }, allergens: ['nuts'], match: /\bbajame|almond|\bbadem|mandorl/, exclude: x(SWEETS, NOT_PLAIN, 'qumesht|milk|latte|bar\\b|protein|hazel|lajthi|ice|akullor') },
  { id: 'cashews', al: 'Shqeme', en: 'Cashews', portionAl: '30 g', portionEn: '30 g', amounts: { mg: 80, iron: 1.9 }, allergens: ['nuts'], match: /shqeme|cashew|indijski/, exclude: x(SWEETS, NOT_PLAIN) },
  { id: 'spinach', al: 'Spinaq', en: 'Spinach', portionAl: '½ filxhan i zier (90 g)', portionEn: '½ cup cooked (90 g)', amounts: { mg: 78, iron: 3.2, ca: 120 }, allergens: [], match: /spinaq|spinach|spinat|spinac/, exclude: /pite|burek|burec|lazanj|lasagn|pica|pizza|tortel|raviol|byrek|gnocchi|rolls|bruschet|cracker|krisp/ },
  { id: 'beans', al: 'Fasule', en: 'Beans', portionAl: '½ filxhan e zier', portionEn: '½ cup cooked', amounts: { mg: 45, iron: 2, ca: 45 }, allergens: [], match: /\bfasul|\bbeans?\b|pasulj|grah\b|fagiol|borlotti|kidney/, exclude: x(SWEETS, 'jelly|xhel|kafe|coffee|cocoa|kakao|vanil|yopokki|soy bean|tteok|tuna|ton\\b|gjelbra|green') },
  { id: 'lentils', al: 'Thjerrëza', en: 'Lentils', portionAl: '½ filxhan të ziera', portionEn: '½ cup cooked', amounts: { mg: 35, iron: 3.3 }, allergens: [], match: /thjerrez|lentil|socivo|lenticch|mercimek/, exclude: /cips|chips/ },
  { id: 'chickpeas', al: 'Qiqra', en: 'Chickpeas', portionAl: '½ filxhan të ziera', portionEn: '½ cup cooked', amounts: { mg: 40, iron: 2.4, ca: 40 }, allergens: [], match: /qiqer|qiqra|chickpea|nohut|\bceci\b|slanutak|leblebi/, exclude: x(SWEETS, 'humus|hummus|cips|chips|burger') },
  { id: 'oats', al: 'Tërshërë', en: 'Oats', portionAl: '40 g (e thatë)', portionEn: '40 g (dry)', amounts: { mg: 55, iron: 1.7 }, allergens: ['gluten'], match: /tershere|\boats?\b|avena|\bzob\b|haferflock|yulaf|porridge|qull/, exclude: x(SWEETS, NOT_PLAIN, 'bar\\b|qumesht|milk|dove|body|jogurt|yog|arra|kumbull|mogador|hipp|smt') },
  { id: 'dark-chocolate', al: 'Çokollatë e zezë (70%+)', en: 'Dark chocolate (70%+)', portionAl: '30 g', portionEn: '30 g', amounts: { mg: 65, iron: 3.4 }, allergens: ['milk'], match: /(cokollat|chocolat|cioccolat)\w*.*\b(7\d|8\d|9\d)\s?%|\b(7\d|8\d|9\d)\s?%.*(cokollat|chocolat|cacao|kakao)|fondente|extra dark|dark chocolate|cokollat\w* e zez/, exclude: /milka|kinder|qumesht|milk choc|lajthi|hazel|nutella|biskot|cookie|croiss|wafer|vafl|pije|drink|krem\b|lemon|limon|schweppes|tonic|\brc\b|qiqr|akullor|franui/ },
  { id: 'tofu', al: 'Tofu', en: 'Tofu', portionAl: '100 g', portionEn: '100 g', amounts: { mg: 35, iron: 2.7, ca: 200 }, allergens: ['soy'], match: /\btofu\b/, exclude: /bar\b|protein/ },
  { id: 'brown-rice', al: 'Oriz integral', en: 'Brown rice', portionAl: '½ filxhan i zier', portionEn: '½ cup cooked', amounts: { mg: 40 }, allergens: [], match: /oriz\w* (integral|kaf|i plote)|brown rice|riso integrale|whole ?grain rice/, exclude: /biskot|cips|chips|galet|kek/ },
  { id: 'wholegrain-bread', al: 'Bukë integrale', en: 'Wholegrain bread', portionAl: '2 feta', portionEn: '2 slices', amounts: { mg: 45, iron: 1.4 }, allergens: ['gluten'], match: /buke\w* (integrale|me drith|thekr|e zez)|wholegrain bread|whole ?wheat bread|pane integrale|integralni hleb/, exclude: /biskot|cips|chips|grisin|kroas|croiss/ },
  { id: 'banana', al: 'Banane', en: 'Banana', portionAl: '1 copë mesatare', portionEn: '1 medium', amounts: { mg: 32 }, allergens: [], match: /^banane?(\s*\/?\s*kg|\s*$|\s+\d)/, exclude: /bananko|flavou?r|mochi|milk|geek|hipp|jelly|chips|ice/ },
  // --- Vitamin D / B12 / iron: fish, eggs, meat, dairy ---
  { id: 'salmon', al: 'Salmon', en: 'Salmon', portionAl: '100 g', portionEn: '100 g', amounts: { vitd: 11, b12: 3 }, allergens: ['fish'], match: /salmon|\bsalmo\b|losos|somon/, exclude: x(PET, 'sandu|sendvi|pasta|karkalec|shrimp|pica|pizza|krem') },
  { id: 'mackerel', al: 'Skumbri', en: 'Mackerel', portionAl: '100 g (konservë)', portionEn: '100 g (canned)', amounts: { vitd: 7, b12: 7 }, allergens: ['fish'], match: /skumbri|mackerel|sgombr|skusa|uskumru/, exclude: PET },
  { id: 'sardines', al: 'Sardele', en: 'Sardines', portionAl: '100 g (konservë)', portionEn: '100 g (canned)', amounts: { vitd: 4.8, b12: 8.9, iron: 2.9, ca: 380 }, allergens: ['fish'], match: /sardel|sardin/, exclude: x(PET, 'mackerel') },
  { id: 'tuna', al: 'Ton', en: 'Tuna', portionAl: '100 g (konservë)', portionEn: '100 g (canned)', amounts: { vitd: 1.7, b12: 2.5 }, allergens: ['fish'], match: /\bton\b|\btuna\b|tonno|\btunj/, exclude: x(PET, 'pica|pizza|sandwich|sendvic|sallat|salad|krem|fasul') },
  { id: 'eggs', al: 'Vezë', en: 'Eggs', portionAl: '1 vezë', portionEn: '1 egg', amounts: { vitd: 1.1, b12: 0.5 }, allergens: ['eggs'], match: /\bveze?\b|\beggs?\b|\bjaja\b|\buova\b|yumurta/, exclude: x(SWEETS, 'makaron|pasta|noodle|tagliatel|fettuc|me veze|tjestenin|petull|majonez|mayon|flavou?r|\\bbun\\b|mystery') },
  { id: 'liver', al: 'Mëlçi', en: 'Liver', portionAl: '100 g', portionEn: '100 g', amounts: { b12: 70, iron: 5 }, allergens: [], match: /melci|\bliver|fegato|ciger|dzigeric|jetren/, exclude: PET },
  { id: 'beef', al: 'Mish viçi', en: 'Beef', portionAl: '100 g', portionEn: '100 g', amounts: { b12: 2.5, iron: 2.5 }, allergens: [], match: /mish\w* (i )?vic|\bbeef\b|govedin|manzo|dana eti|biftek|rostbif/, exclude: x(PET, 'doritos|burrito|gyoza|hipp|bebe|salc|sauce|flavou?r|instant|noodle|bouillon|soba|wasabi|ramen|pule|chicken|sallam|salsic|suxhuk|hot ?dog|proshut|pasterm|kub|supe|soup|knorr|maggi|cips|chips|aroma|lazanj|burek|byrek|pite') },
  { id: 'yogurt', al: 'Jogurt', en: 'Yogurt', portionAl: '1 filxhan (245 g)', portionEn: '1 cup (245 g)', amounts: { b12: 1.1, ca: 300 }, allergens: ['milk', 'lactose'], match: /jogurt|yogh?urt/, exclude: x(SWEETS, 'pije|drink|lotion|maske|mask|fytyr|face|shampo|musli|granola|cereal|drith') },
  { id: 'kefir', al: 'Kefir', en: 'Kefir', portionAl: '1 gotë (250 ml)', portionEn: '1 glass (250 ml)', amounts: { b12: 1, ca: 300 }, allergens: ['milk', 'lactose'], match: /\bkefir/, exclude: x(SWEETS, 'snake|snack') },
  { id: 'milk', al: 'Qumësht', en: 'Milk', portionAl: '1 gotë (250 ml)', portionEn: '1 glass (250 ml)', amounts: { b12: 1.2, ca: 300 }, allergens: ['milk', 'lactose'], match: /^(qumesht|milk|mleko|latte)\b|qumesht (i fresket|lope|vita|\d)|alpsko qumesht|drena qumesht|sole qumesht|fresh milk|\bqumesht\b.*\d[.,]?\d?\s?%/, exclude: x(SWEETS, 'kokos|coconut|bajame|almond|soj|soy|oriz|rice|kafe|coffee|pluhur|powder|kondens|ice|frap|shake|kakao|lajthi|qokollad|cokolad|eurovafel') },
];

/** Allergens this food would expose the user to, after a product's free-from claims. */
export function foodConflicts(food: NutrientFood, profile: AllergenId[], productClaims?: string[]) {
  return food.allergens.filter(
    (a) =>
      profile.includes(a) &&
      !(a === 'gluten' && productClaims?.includes('gf')) &&
      !(a === 'lactose' && productClaims?.includes('lf'))
  );
}
