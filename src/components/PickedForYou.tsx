import React, { useMemo, useState } from 'react';
import { BiomarkerData, Language } from '../types';
import { AllergenId, ShopProduct, allergenById, nameWarnings } from '../lib/allergens';
import { NUTRIENTS, NUTRIENT_FOODS, Nutrient, NutrientFood, findDeficiencies, foodConflicts } from '../data/nutrientFoods';

export interface LabSource {
  fileName: string;
  date?: string;
}

interface Props {
  language: Language;
  products: ShopProduct[];
  profile: AllergenId[];
  biomarkers: BiomarkerData;
  labSource: LabSource | null;
  uploading: boolean;
  onUploadLab: (file: File) => void;
  onTrySample: () => void;
  inList: (p: ShopProduct) => boolean;
  toggleList: (p: ShopProduct) => void;
  openCheck: (p: ShopProduct) => void;
}

const BABY_FOOD = /bebe|hipp|baby|per femij|humana|nestle nan|aptamil/;
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const price = (p?: number) => (p === undefined ? '' : `€${p.toFixed(2)}`);

/** "Të përzgjedhura për ty": foods from Kosovo shops for what the lab results say is low, minus the user's allergens. */
export const PickedForYou: React.FC<Props> = ({
  language, products, profile, biomarkers, labSource, uploading, onUploadLab, onTrySample, inList, toggleList, openCheck,
}) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const [filter, setFilter] = useState<Nutrient | 'all'>('all');

  // Shop products per food, best first (sold in most shops, then cheapest).
  const matches = useMemo(() => {
    const m = new Map<string, ShopProduct[]>();
    for (const f of NUTRIENT_FOODS) {
      const hits = products.filter((p) => {
        const n = fold(p.n);
        return f.match.test(n) && !f.exclude?.test(n) && !BABY_FOOD.test(n);
      });
      hits.sort((a, b) => b.o.length - a.o.length || (a.o[0]?.p ?? 1e9) - (b.o[0]?.p ?? 1e9));
      m.set(f.id, hits);
    }
    return m;
  }, [products]);

  const deficiencies = labSource ? findDeficiencies(biomarkers) : [];
  const shown = deficiencies.filter((d) => filter === 'all' || d.nutrient === filter);

  const plan = (nutrient: Nutrient) => {
    const visible: { food: NutrientFood; items: ShopProduct[] }[] = [];
    const hidden: { food: NutrientFood; because: AllergenId[] }[] = [];
    for (const food of NUTRIENT_FOODS.filter((f) => f.amounts[nutrient]).sort((a, b) => b.amounts[nutrient]! - a.amounts[nutrient]!)) {
      const all = matches.get(food.id) ?? [];
      const items = all.filter((p) => foodConflicts(food, profile, p.f).length === 0 && nameWarnings(p, profile).length === 0);
      const conflicts = foodConflicts(food, profile);
      if (conflicts.length && items.length === 0) hidden.push({ food, because: conflicts });
      else if (items.length || all.length === 0) visible.push({ food, items });
    }
    // Foods you can actually buy first.
    visible.sort((a, b) => (b.items.length ? 1 : 0) - (a.items.length ? 1 : 0));
    return { visible, hidden };
  };

  const doctorNote = (n: Nutrient, value: number, unit: string) =>
    n === 'vitd'
      ? t(`Me ${value} ${unit} ushqimi vetëm nuk mjafton — dielli dhe suplement sipas mjekut.`, `At ${value} ${unit} food alone isn't enough — sunlight and a supplement your doctor recommends.`)
      : t(`Vlerë shumë e ulët (${value} ${unit}) — fol me mjekun para së gjithash; ushqimet më poshtë ndihmojnë, por nuk mjaftojnë.`, `Very low (${value} ${unit}) — talk to your doctor first; the foods below help but aren't enough.`);

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-md border border-primary/20 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            {t('Të përzgjedhura për ty', 'Picked for you')}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-on-surface leading-tight">
            {t('Ushqime nga dyqanet për analizat e tua', 'Foods from the shops for your lab results')}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {labSource
              ? t(`Nga ${labSource.fileName}${labSource.date ? ` · ${labSource.date}` : ''} — pa alergjenët e tu.`, `From ${labSource.fileName}${labSource.date ? ` · ${labSource.date}` : ''} — without your allergens.`)
              : t('Ngarko analizat e gjakut dhe të tregojmë çfarë të blesh — ushqime, jo vetëm suplemente.', 'Upload your blood test and we show what to buy — foods, not only supplements.')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!labSource && (
            <button type="button" onClick={onTrySample} disabled={uploading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-surface-container hover:bg-surface-container-high">
              {t('Provo shembullin', 'Try the example')}
            </button>
          )}
          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${uploading ? 'bg-surface-container-high text-outline' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
            <span className={`material-symbols-outlined text-[16px] ${uploading ? 'animate-spin' : ''}`}>{uploading ? 'progress_activity' : 'upload_file'}</span>
            {uploading ? t('Duke lexuar…', 'Reading…') : labSource ? t('Analiza të reja', 'New results') : t('Ngarko analizat (PDF)', 'Upload results (PDF)')}
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) onUploadLab(f);
              }}
            />
          </label>
        </div>
      </div>

      {labSource && deficiencies.length === 0 && (
        <p className="text-sm text-secondary font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined">check_circle</span>
          {t('Analizat nuk tregojnë mungesa të magnezit, vitaminës D, B12 apo hekurit.', 'Your results show no low magnesium, vitamin D, B12 or iron.')}
        </p>
      )}

      {deficiencies.length > 0 && (
        <>
          {/* Filters: nutrients + the allergy filter that is always on */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-semibold ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                {t('Të gjitha', 'All')} ({deficiencies.length})
              </button>
              {deficiencies.map((d) => (
                <button key={d.nutrient} type="button" onClick={() => setFilter(filter === d.nutrient ? 'all' : d.nutrient)} className={`px-3 py-1 rounded-full text-xs font-semibold ${filter === d.nutrient ? 'bg-primary text-on-primary' : 'bg-error-container/60 text-on-error-container hover:bg-error-container'}`}>
                  ↓ {language === 'al' ? NUTRIENTS[d.nutrient].al : NUTRIENTS[d.nutrient].en}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant flex flex-wrap items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-error">filter_alt</span>
              {profile.length
                ? <>{t('Filtruar sipas alergjive:', 'Filtered for your allergies:')} {profile.map((id) => (
                    <span key={id} className="px-1.5 py-0.5 rounded bg-error-container/50 text-on-error-container font-semibold">{language === 'al' ? allergenById[id].al : allergenById[id].en}</span>
                  ))}</>
                : t('Pa filtër alergjish — zgjidh alergjitë më poshtë.', 'No allergy filter — pick your allergies below.')}
            </p>
          </div>

          {shown.map((d) => {
            const meta = NUTRIENTS[d.nutrient];
            const { visible, hidden } = plan(d.nutrient);
            return (
              <div key={d.nutrient} className="rounded-xl bg-surface-container-low p-3 sm:p-4 border border-surface-container-high/60 flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    {t(meta.lowAl, `Low ${meta.en.toLowerCase()}`)}{' '}
                    <span className="font-mono text-error">{d.value} {d.unit}</span>{' '}
                    <span className="text-xs font-normal text-outline">({t('ref', 'ref')} {d.ref})</span>
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">{language === 'al' ? meta.dailyAl : meta.dailyEn}</span>
                </div>
                {d.doctorFirst && (
                  <p className="text-xs rounded-lg bg-amber-100 text-amber-900 border border-amber-300 px-3 py-2 flex gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                    {doctorNote(d.nutrient, d.value, d.unit)}
                  </p>
                )}
                {meta.tipAl && <p className="text-[11px] text-on-surface-variant">💡 {language === 'al' ? meta.tipAl : meta.tipEn}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {visible.slice(0, 9).map(({ food, items }) => {
                    const best = items[0];
                    return (
                      <div key={food.id} className="rounded-lg bg-surface-container-lowest p-2.5 border border-surface-container flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-on-surface">{language === 'al' ? food.al : food.en}</span>
                          <span className="text-[11px] font-mono font-bold text-primary shrink-0">
                            ~{food.amounts[d.nutrient]} {meta.unit}
                          </span>
                        </div>
                        <span className="text-[10px] text-outline -mt-1">{t('për', 'per')} {language === 'al' ? food.portionAl : food.portionEn}</span>
                        {best ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <button type="button" onClick={() => openCheck(best)} className="w-10 h-10 rounded bg-white border border-surface-container flex items-center justify-center overflow-hidden shrink-0">
                              {best.i ? <img src={best.i} alt="" loading="lazy" className="max-w-full max-h-full object-contain" /> : <span className="material-symbols-outlined text-outline text-[18px]">grocery</span>}
                            </button>
                            <div className="min-w-0 flex-1">
                              <button type="button" onClick={() => openCheck(best)} className="block text-left text-xs font-semibold text-on-surface truncate w-full hover:text-primary">{best.n}</button>
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
                    {hidden.map((h) => `${language === 'al' ? h.food.al : h.food.en} (${h.because.map((a) => (language === 'al' ? allergenById[a].al : allergenById[a].en)).join(', ')})`).join(' · ')}
                  </p>
                )}
                <p className="text-[11px] text-outline">
                  {t('Suplement? Vetëm me këshillën e mjekut ose farmacistit.', 'Supplement? Only on your doctor’s or pharmacist’s advice.')}
                </p>
              </div>
            );
          })}
          <p className="text-[10px] text-outline">
            {t('Sasitë janë të përafërta (USDA / NIH). Kjo është udhëzim ushqimor, jo trajtim mjekësor.', 'Amounts are approximate (USDA / NIH). Food guidance, not medical treatment.')}
          </p>
        </>
      )}
    </section>
  );
};
