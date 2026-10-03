import React, { useEffect, useMemo, useState } from 'react';
import { Language } from '../types';
import { AllergenId, ShopProduct, allergenById, loadCatalogue, nameWarnings } from '../lib/allergens';
import { NUTRIENTS, NUTRIENT_FOODS, Nutrient, NutrientFood, foodConflicts } from '../data/nutrientFoods';

const BABY_FOOD = /bebe|hipp|\bbaby\b|per femij|humana|nestle nan|aptamil/;
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const price = (p?: number) => (p === undefined ? '' : `€${p.toFixed(2)}`);

/** Shop products per hand-picked food, best first (sold in most shops, then cheapest). */
export function useFoodMatches(products?: ShopProduct[]) {
  const [loaded, setLoaded] = useState<ShopProduct[]>(products ?? []);
  useEffect(() => {
    if (products) setLoaded(products);
    else loadCatalogue().then((d) => setLoaded(d.products));
  }, [products]);
  return useMemo(() => {
    const m = new Map<string, ShopProduct[]>();
    for (const f of NUTRIENT_FOODS) {
      const hits = loaded.filter((p) => {
        const n = fold(p.n);
        return f.match.test(n) && !f.exclude?.test(n) && !BABY_FOOD.test(n);
      });
      hits.sort((a, b) => b.o.length - a.o.length || (a.o[0]?.p ?? 1e9) - (b.o[0]?.p ?? 1e9));
      m.set(f.id, hits);
    }
    return m;
  }, [loaded]);
}

/** Foods for one nutrient that suit the allergy profile, plus the ones hidden because of it. */
export function planFoods(nutrient: Nutrient, matches: Map<string, ShopProduct[]>, profile: AllergenId[]) {
  const visible: { food: NutrientFood; items: ShopProduct[] }[] = [];
  const hidden: { food: NutrientFood; because: AllergenId[] }[] = [];
  for (const food of NUTRIENT_FOODS.filter((f) => f.amounts[nutrient]).sort((a, b) => b.amounts[nutrient]! - a.amounts[nutrient]!)) {
    const all = matches.get(food.id) ?? [];
    const items = all.filter((p) => foodConflicts(food, profile, p.f).length === 0 && nameWarnings(p, profile).length === 0);
    const conflicts = foodConflicts(food, profile);
    if (conflicts.length && items.length === 0) hidden.push({ food, because: conflicts });
    else if (items.length || all.length === 0) visible.push({ food, items });
  }
  visible.sort((a, b) => (b.items.length ? 1 : 0) - (a.items.length ? 1 : 0));
  return { visible, hidden };
}

interface TilesProps {
  nutrient: Nutrient;
  matches: Map<string, ShopProduct[]>;
  profile: AllergenId[];
  language: Language;
  inList: (p: ShopProduct) => boolean;
  toggleList: (p: ShopProduct) => void;
  /** Open the product check; without it the product links to the shop. */
  openCheck?: (p: ShopProduct) => void;
  limit?: number;
}

export const FoodTiles: React.FC<TilesProps> = ({ nutrient, matches, profile, language, inList, toggleList, openCheck, limit = 9 }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const meta = NUTRIENTS[nutrient];
  const { visible, hidden } = planFoods(nutrient, matches, profile);
  const name = (id: AllergenId) => (language === 'al' ? allergenById[id].al : allergenById[id].en);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {visible.slice(0, limit).map(({ food, items }) => {
          const best = items[0];
          const open = (p: ShopProduct) => (openCheck ? openCheck(p) : p.o[0]?.u && window.open(p.o[0].u, '_blank', 'noopener'));
          return (
            <div key={food.id} className="rounded-lg bg-surface-container-lowest p-2.5 border border-surface-container flex flex-col gap-1.5 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-on-surface">{language === 'al' ? food.al : food.en}</span>
                <span className="text-[11px] font-mono font-bold text-primary shrink-0">~{food.amounts[nutrient]} {meta.unit}</span>
              </div>
              <span className="text-[10px] text-outline -mt-1">{t('për', 'per')} {language === 'al' ? food.portionAl : food.portionEn}</span>
              {best ? (
                <div className="flex items-center gap-2 min-w-0">
                  <button type="button" onClick={() => open(best)} className="w-10 h-10 rounded bg-white border border-surface-container flex items-center justify-center overflow-hidden shrink-0">
                    {best.i ? <img src={best.i} alt="" loading="lazy" className="max-w-full max-h-full object-contain" /> : <span className="material-symbols-outlined text-outline text-[18px]">grocery</span>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => open(best)} className="block text-left text-xs font-semibold text-on-surface truncate w-full hover:text-primary">{best.n}</button>
                    <span className="block text-[10px] text-on-surface-variant truncate">
                      {price(best.o[0]?.p)} · {best.o[0]?.s}
                      {items.length > 1 && ` · +${items.length - 1} ${t('opsione', 'options')}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleList(best)}
                    className={`text-[11px] font-bold px-2 py-1 rounded shrink-0 ${inList(best) ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                  >
                    {inList(best) ? '✓' : t('+ Lista', '+ List')}
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-outline">{t('Nuk u gjet në dyqanet online — kërkoje në treg ose në raft.', 'Not in online listings — look at the market or on the shelf.')}</span>
              )}
            </div>
          );
        })}
      </div>
      {hidden.length > 0 && (
        <p className="text-[11px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] align-[-3px] text-error">block</span>{' '}
          {t('Të fshehura për alergjitë e tua:', 'Hidden for your allergies:')}{' '}
          {hidden.map((h) => `${language === 'al' ? h.food.al : h.food.en} (${h.because.map(name).join(', ')})`).join(' · ')}
        </p>
      )}
    </div>
  );
};
