import React, { useState } from 'react';
import { BiomarkerData, Language } from '../types';
import { AllergenId, ShopProduct, allergenById } from '../lib/allergens';
import { NUTRIENTS, Nutrient, findDeficiencies } from '../data/nutrientFoods';
import { FoodTiles, useFoodMatches } from './FoodTiles';

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

/** Plain-words note when a value is too low for food alone. */
export function doctorNote(n: Nutrient, value: number, unit: string, language: Language) {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  return n === 'vitd'
    ? t(`Me ${value} ${unit} ushqimi vetëm nuk mjafton — dielli dhe suplement sipas mjekut.`, `At ${value} ${unit} food alone isn't enough — sunlight and a supplement your doctor recommends.`)
    : t(`Shumë i ulët (${value} ${unit}) — fol me mjekun; ushqimet ndihmojnë, por nuk mjaftojnë.`, `Very low (${value} ${unit}) — talk to your doctor; food helps but isn't enough.`);
}

/** "Të përzgjedhura për ty": foods from Kosovo shops for what the lab results say is low, minus the user's allergens. */
export const PickedForYou: React.FC<Props> = ({
  language, products, profile, biomarkers, labSource, uploading, onUploadLab, onTrySample, inList, toggleList, openCheck,
}) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const [filter, setFilter] = useState<Nutrient | 'all'>('all');
  const matches = useFoodMatches(products);

  const deficiencies = labSource ? findDeficiencies(biomarkers) : [];
  const shown = deficiencies.filter((d) => filter === 'all' || d.nutrient === filter);

  return (
    <section id="picked-for-you" className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-md border border-primary/20 flex flex-col gap-4 scroll-mt-20">
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
          {t('Analizat nuk tregojnë mungesa — s’ka nevojë për sugjerime.', 'Your results show nothing low — no suggestions needed.')}
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
            return (
              <div key={d.nutrient} className="rounded-xl bg-surface-container-low p-3 sm:p-4 border border-surface-container-high/60 flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    {t(meta.lowAl, `Low ${meta.en.toLowerCase()}`)}{' '}
                    <span className="font-mono text-error">{d.value} {d.unit}</span>{' '}
                    <span className="text-xs font-normal text-outline">({t('normale', 'normal')} {d.ref})</span>
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">{language === 'al' ? meta.dailyAl : meta.dailyEn}</span>
                </div>
                {d.doctorFirst && (
                  <p className="text-xs rounded-lg bg-amber-100 text-amber-900 border border-amber-300 px-3 py-2 flex gap-1.5">
                    <span>🩺</span>
                    {doctorNote(d.nutrient, d.value, d.unit, language)}
                  </p>
                )}
                {meta.tipAl && <p className="text-[11px] text-on-surface-variant">💡 {language === 'al' ? meta.tipAl : meta.tipEn}</p>}
                <FoodTiles nutrient={d.nutrient} matches={matches} profile={profile} language={language} inList={inList} toggleList={toggleList} openCheck={openCheck} />
                <p className="text-[11px] text-outline">{t('Suplement? Vetëm me këshillën e mjekut ose farmacistit.', 'Supplement? Only on your doctor’s or pharmacist’s advice.')}</p>
              </div>
            );
          })}
          <p className="text-[10px] text-outline">
            {t('Sasitë janë të përafërta (USDA / NIH). Udhëzim për ushqimin, jo trajtim mjekësor.', 'Amounts are approximate (USDA / NIH). Food guidance, not medical treatment.')}
          </p>
        </>
      )}
    </section>
  );
};
