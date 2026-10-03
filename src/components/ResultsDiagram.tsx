import React, { useState } from 'react';
import { BiomarkerData, Language } from '../types';
import { BiomarkerKey } from '../lib/labReport';
import { AllergenId, ShopProduct, allergenById } from '../lib/allergens';
import { localStore } from '../lib/localStore';
import { Nutrient } from '../data/nutrientFoods';
import { FoodTiles, useFoodMatches } from './FoodTiles';
import { doctorNote } from './PickedForYou';

// Which food list brings each value back up.
const FOODS_FOR: Partial<Record<keyof BiomarkerData, Nutrient>> = { mg: 'mg', vitd: 'vitd', b12: 'b12', ferritin: 'iron', hgb: 'iron', ca: 'ca' };
// Everyday steps for values that food lists don't fix.
const TIPS: Partial<Record<keyof BiomarkerData, { low?: [string, string][]; high?: [string, string][] }>> = {
  glu: {
    high: [['Pi ujë në vend të pijeve me sheqer', 'Drink water instead of sugary drinks'], ['Bukë integrale në vend të bukës së bardhë', 'Wholegrain bread instead of white bread'], ['Ec 15–30 minuta pas ngrënies', 'Walk 15–30 minutes after meals']],
    low: [['Mos i kalo vaktet', 'Don’t skip meals'], ['Mbaj një frut me vete', 'Keep a piece of fruit with you']],
  },
  bpSys: { high: [['Më pak kripë — kujdes me djathin e kripur, sallamin, cipsin', 'Less salt — watch salty cheese, salami, crisps'], ['Ec 30 minuta në ditë', 'Walk 30 minutes a day'], ['Fli 7–8 orë', 'Sleep 7–8 hours']] },
  tsh: { low: [['Pyet mjekun — mund të duhet një test tjetër', 'Ask your doctor — you may need another test']], high: [['Pyet mjekun — mund të duhet një test tjetër', 'Ask your doctor — you may need another test']] },
  pulse: { low: [['Tregoja mjekut nëse ke marramendje', 'Tell your doctor if you feel dizzy']], high: [['Pusho dhe pi ujë', 'Rest and drink water'], ['Tregoja mjekut nëse vazhdon', 'Tell your doctor if it continues']] },
};

interface Props {
  biomarkers: BiomarkerData;
  language: Language;
  source?: { fileName: string; date?: string } | null;
  onGoToFoods: () => void;
}

type Status = 'low' | 'ok' | 'high';

// What each value means, in plain words. min/max = the bar's scale; low/high = normal range.
const MARKERS: {
  key: Exclude<BiomarkerKey, 'bpDia'>;
  al: string;
  en: string;
  unit: string;
  min: number;
  max: number;
  low: number;
  high: number;
  icons: { low?: string; high?: string };
  says: { low?: [string, string]; high?: [string, string] };
}[] = [
  { key: 'mg', al: 'Magnezi', en: 'Magnesium', unit: 'mg/dL', min: 1, max: 3, low: 1.7, high: 2.4, icons: { low: '🦵💤' },
    says: { low: ['Mund të të shkaktojë ngërçe në këmbë (sidomos natën) dhe gjumë të keq.', 'Can cause leg cramps (often at night) and poor sleep.'] } },
  { key: 'vitd', al: 'Vitamina D', en: 'Vitamin D', unit: 'ng/mL', min: 0, max: 100, low: 30, high: 100, icons: { low: '☀️🦴' },
    says: { low: ['Kockat dhe mbrojtja e trupit dobësohen. Trupi e merr kryesisht nga dielli.', 'Weakens your bones and defences. Your body gets it mostly from sunlight.'] } },
  { key: 'b12', al: 'Vitamina B12', en: 'Vitamin B12', unit: 'pg/mL', min: 100, max: 1000, low: 200, high: 900, icons: { low: '🔋🖐️' },
    says: { low: ['Mund të ndihesh i lodhur dhe të kesh mpirje në duar ose këmbë.', 'Can make you tired and cause tingling in hands or feet.'] } },
  { key: 'ferritin', al: 'Hekuri (rezervat)', en: 'Iron stores', unit: 'ng/mL', min: 0, max: 200, low: 24, high: 336, icons: { low: '🥱🩸' },
    says: { low: ['Rezervat e hekurit janë të ulëta — mund të ndihesh i lodhur dhe i zbehtë.', 'Your iron stores are low — you may feel tired and look pale.'] } },
  { key: 'hgb', al: 'Hemoglobina', en: 'Hemoglobin', unit: 'g/dL', min: 10, max: 19, low: 13.5, high: 17.5, icons: { low: '🩸🥱' },
    says: { low: ['Pak e ulët — mund të lodhesh shpejt ose të të zërë fryma në shkallë.', 'A bit low — you may tire quickly or get out of breath on stairs.'] } },
  { key: 'ca', al: 'Kalciumi', en: 'Calcium', unit: 'mg/dL', min: 7, max: 11, low: 8.5, high: 10.2, icons: { low: '🦴🦷' },
    says: { low: ['Pak i ulët — kockat dhe dhëmbët kanë nevojë për kalcium.', 'A bit low — bones and teeth need calcium.'] } },
  { key: 'glu', al: 'Sheqeri në gjak', en: 'Blood sugar', unit: 'mg/dL', min: 60, max: 140, low: 70, high: 99, icons: { high: '🍬', low: '😵‍💫' },
    says: { high: ['Pak i lartë — ha më pak ëmbëlsira e pije me sheqer, dhe tregoja mjekut.', 'A bit high — less sweets and sugary drinks, and show your doctor.'], low: ['I ulët — mos i kalo vaktet.', 'Low — don’t skip meals.'] } },
  { key: 'tsh', al: 'Tiroidja (TSH)', en: 'Thyroid (TSH)', unit: 'µIU/mL', min: 0, max: 6, low: 0.4, high: 4, icons: { low: '🦋', high: '🦋' },
    says: { low: ['Tiroidja mund të punojë shumë — pyet mjekun.', 'Your thyroid may be overactive — ask your doctor.'], high: ['Tiroidja mund të punojë pak — pyet mjekun.', 'Your thyroid may be underactive — ask your doctor.'] } },
  { key: 'bpSys', al: 'Tensioni', en: 'Blood pressure', unit: 'mmHg', min: 90, max: 170, low: 90, high: 120, icons: { high: '❤️' },
    says: { high: ['Pak i lartë — më pak kripë, më shumë lëvizje.', 'A bit high — less salt, more walking.'] } },
  { key: 'pulse', al: 'Pulsi', en: 'Pulse', unit: 'bpm', min: 40, max: 120, low: 60, high: 100, icons: { low: '💓', high: '💓' },
    says: { low: ['Pak i ulët — tregoja mjekut nëse ke marramendje.', 'A bit low — tell your doctor if you feel dizzy.'], high: ['Pak i lartë — pusho dhe tregoja mjekut nëse vazhdon.', 'A bit high — rest, and tell your doctor if it continues.'] } },
];

export const ResultsDiagram: React.FC<Props> = ({ biomarkers, language, source, onGoToFoods }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const matches = useFoodMatches();
  const [profile] = useState<AllergenId[]>(() => localStore.get('kh.profile', ['gluten', 'lactose']));
  const [list, setList] = useState<ShopProduct[]>(() => localStore.get('kh.list', []));
  const inList = (p: ShopProduct) => list.some((x) => x.n === p.n && x.c === p.c);
  const toggleList = (p: ShopProduct) => {
    const next = inList(p) ? list.filter((x) => !(x.n === p.n && x.c === p.c)) : [...list, p];
    setList(next);
    localStore.set('kh.list', next);
  };

  const rows = MARKERS.map((m) => {
    const value = biomarkers[m.key];
    const bpHigh = m.key === 'bpSys' && (biomarkers.bpSys > 120 || biomarkers.bpDia > 80);
    const status: Status = bpHigh ? 'high' : value < m.low ? 'low' : value > m.high ? 'high' : 'ok';
    const pos = Math.min(97, Math.max(3, ((value - m.min) / (m.max - m.min)) * 100));
    const lowPos = Math.max(0, ((m.low - m.min) / (m.max - m.min)) * 100);
    const highPos = Math.min(100, ((m.high - m.min) / (m.max - m.min)) * 100);
    return { m, value, status, pos, lowPos, highPos };
  });
  const bad = rows.filter((r) => r.status !== 'ok');
  const good = rows.filter((r) => r.status === 'ok');
  const score = Math.round((good.length / rows.length) * 100);

  const isLow = (k: keyof BiomarkerData) => bad.some((r) => r.m.key === k && r.status === 'low');
  const isHigh = (k: keyof BiomarkerData) => bad.some((r) => r.m.key === k && r.status === 'high');
  const nutrientLow = isLow('mg') || isLow('vitd') || isLow('b12') || isLow('ferritin');
  const veryLow = [
    biomarkers.vitd > 0 && biomarkers.vitd < 20 && t('Vitamina D', 'Vitamin D'),
    biomarkers.b12 > 0 && biomarkers.b12 < 150 && 'B12',
    biomarkers.ferritin > 0 && biomarkers.ferritin < 15 && t('Hekuri', 'Iron'),
    biomarkers.glu >= 126 && t('Sheqeri', 'Blood sugar'),
  ].filter(Boolean) as string[];

  const statusPill = (s: Status) =>
    s === 'ok'
      ? <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">{t('Normale', 'Normal')}</span>
      : <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold">{s === 'low' ? t('Nën normë', 'Below normal') : t('Mbi normë', 'Above normal')}</span>;

  return (
    <section id="results-diagram" className="flex flex-col gap-4 scroll-mt-20">
      {/* Summary */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-sm border border-surface-container-high/60 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" strokeWidth="7" className="stroke-surface-container-highest" />
            <circle cx="36" cy="36" r="30" fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset={188.5 - (188.5 * score) / 100} className={bad.length > 2 ? 'stroke-error' : 'stroke-primary'} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-on-surface">{good.length}/{rows.length}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{t('Rezultatet e tua', 'Your results')}</span>
          <h2 className="text-xl font-bold text-on-surface leading-tight">
            {bad.length === 0 ? t('Gjithçka në rregull 🎉', 'Everything looks fine 🎉') : bad.length <= 2 ? t('Pak vëmendje', 'A little attention') : t('Disa vlera duan vëmendje', 'Some values need attention')}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {t(`${good.length} nga ${rows.length} vlera janë normale.`, `${good.length} of ${rows.length} values are normal.`)}
            {source && <span className="text-outline"> · {source.fileName}{source.date ? ` · ${source.date}` : ''}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Bars */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {profile.length > 0 && (
            <p className="text-[11px] text-on-surface-variant flex flex-wrap items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-error">filter_alt</span>
              {t('Ushqimet janë filtruar sipas alergjive:', 'Foods are filtered for your allergies:')}
              {profile.map((id) => <span key={id} className="px-1.5 py-0.5 rounded bg-error-container/50 text-on-error-container font-semibold">{language === 'al' ? allergenById[id].al : allergenById[id].en}</span>)}
            </p>
          )}
          {bad.map(({ m, value, status, pos, lowPos, highPos }) => (
            <div key={m.key} className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl leading-none shrink-0" aria-hidden="true">{(status === 'low' ? m.icons.low : m.icons.high) ?? '⚠️'}</span>
                  <h3 className="text-base font-bold text-on-surface truncate">{language === 'al' ? m.al : m.en}</h3>
                  {statusPill(status)}
                </div>
                <span className="font-mono text-lg font-bold text-error shrink-0">
                  {m.key === 'bpSys' ? `${biomarkers.bpSys}/${biomarkers.bpDia}` : value} <span className="text-xs font-normal text-on-surface-variant">{m.unit}</span>
                </span>
              </div>
              {/* Bar: red = below, green = normal, amber = above; the pin is you */}
              <div className="relative pt-5">
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div className="h-full bg-error/80" style={{ width: `${lowPos}%` }} />
                  <div className="h-full bg-primary-container" style={{ width: `${highPos - lowPos}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${100 - highPos}%` }} />
                </div>
                <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${pos}%` }}>
                  <span className="text-[10px] font-bold text-error leading-none">{t('Ti', 'You')}</span>
                  <span className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-error" />
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1 font-mono">
                  <span>{t('ulët', 'low')}</span>
                  <span className="text-primary font-bold">{t('normale', 'normal')} {m.low}–{m.high}</span>
                  <span>{t('lartë', 'high')}</span>
                </div>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                {language === 'al' ? m.says[status === 'low' ? 'low' : 'high']?.[0] : m.says[status === 'low' ? 'low' : 'high']?.[1]}
              </p>
              {(() => {
                const nutrient = status === 'low' ? FOODS_FOR[m.key] : undefined;
                const tips = TIPS[m.key]?.[status === 'low' ? 'low' : 'high'];
                if (!nutrient && !tips) return null;
                const veryLowNote =
                  (m.key === 'vitd' && value < 20) || (m.key === 'b12' && value < 150) || (m.key === 'ferritin' && value < 15) || (m.key === 'mg' && value < 1.2) || (m.key === 'ca' && value < 8);
                return (
                  <div className="border-t border-surface-container-high pt-3 flex flex-col gap-2">
                    <p className="text-sm font-bold text-on-surface">🟢 {t('Si të arrish te jeshilja', 'How to get back to green')}</p>
                    {nutrient && veryLowNote && (
                      <p className="text-xs rounded-lg bg-amber-100 text-amber-900 border border-amber-300 px-3 py-2">🩺 {doctorNote(nutrient, value, m.unit, language)}</p>
                    )}
                    {nutrient && (
                      <>
                        <p className="text-xs text-on-surface-variant">{t('Ushqime që e ngrenë — dhe ku i gjen në Kosovë:', 'Foods that raise it — and where to find them in Kosovo:')}</p>
                        <FoodTiles nutrient={nutrient} matches={matches} profile={profile} language={language} inList={inList} toggleList={toggleList} limit={6} />
                      </>
                    )}
                    {tips && (
                      <ul className="flex flex-col gap-1">
                        {tips.map(([al, en]) => (
                          <li key={al} className="text-sm text-on-surface flex gap-2"><span className="text-primary">✓</span>{language === 'al' ? al : en}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}

          {good.length > 0 && (
            <div className="rounded-xl bg-secondary-container/30 p-3 border border-secondary/20">
              <p className="text-xs font-bold text-on-surface mb-1.5">✓ {t('Këto janë normale', 'These are normal')}</p>
              <div className="flex flex-wrap gap-1.5">
                {good.map(({ m, value }) => (
                  <span key={m.key} className="px-2 py-1 rounded-lg bg-surface-container-lowest text-xs text-on-surface">
                    {language === 'al' ? m.al : m.en} <b className="font-mono">{m.key === 'bpSys' ? `${biomarkers.bpSys}/${biomarkers.bpDia}` : value}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggestions for you */}
        <aside className="lg:col-span-4 flex flex-col gap-3 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold text-on-surface">{t('Sugjerime për ty', 'Suggestions for you')}</h2>

          {veryLow.length > 0 && (
            <div className="rounded-xl bg-amber-100 border border-amber-300 p-3.5 text-amber-900 flex gap-2.5">
              <span className="text-2xl leading-none">🩺</span>
              <div className="text-sm">
                <p className="font-bold">{t('Fol me mjekun', 'Talk to your doctor')}</p>
                <p>{t(`Këto janë shumë të ulëta: ${veryLow.join(', ')}. Trego këto rezultate te mjeku.`, `These are very low: ${veryLow.join(', ')}. Show these results to your doctor.`)}</p>
              </div>
            </div>
          )}

          {nutrientLow && (
            <button type="button" onClick={onGoToFoods} className="text-left rounded-xl bg-primary text-on-primary p-3.5 flex gap-2.5 shadow-md hover:bg-primary-container transition-colors">
              <span className="text-2xl leading-none">🥗</span>
              <div className="text-sm">
                <p className="font-bold">{t('Ushqime që të ndihmojnë', 'Foods that help')}</p>
                <p className="opacity-90">{t('Shiko çfarë të blesh në dyqanet e Kosovës — pa alergjenët e tu. →', 'See what to buy in Kosovo shops — without your allergens. →')}</p>
              </div>
            </button>
          )}

          {isLow('vitd') && (
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/60 p-3.5 flex gap-2.5">
              <span className="text-2xl leading-none">☀️</span>
              <div className="text-sm text-on-surface">
                <p className="font-bold">{t('Dil në diell', 'Get some sun')}</p>
                <p className="text-on-surface-variant">{t('20–30 minuta, mes orës 11:30 dhe 13:30, me krahët dhe fytyrën jashtë. Sot: UV 3.', '20–30 minutes between 11:30 and 13:30, arms and face uncovered. Today: UV 3.')}</p>
              </div>
            </div>
          )}

          {(isHigh('bpSys') || isHigh('glu')) && (
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/60 p-3.5 flex gap-2.5">
              <span className="text-2xl leading-none">🚶</span>
              <div className="text-sm text-on-surface">
                <p className="font-bold">{t('Ec çdo ditë', 'Walk every day')}</p>
                <p className="text-on-surface-variant">{t('30 minuta ecje, p.sh. në Gërmi. Më pak kripë dhe sheqer.', '30 minutes of walking, e.g. in Germia park. Less salt and sugar.')}</p>
              </div>
            </div>
          )}

          {isLow('mg') && (
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/60 p-3.5 flex gap-2.5">
              <span className="text-2xl leading-none">😴</span>
              <div className="text-sm text-on-surface">
                <p className="font-bold">{t('Për gjumin dhe ngërçet', 'For sleep and cramps')}</p>
                <p className="text-on-surface-variant">{t('Ha fara kungulli, spinaq ose fasule. Shtrije këmbën para gjumit.', 'Eat pumpkin seeds, spinach or beans. Stretch your legs before bed.')}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-surface-container-low border border-surface-container-high/60 p-3.5 flex gap-2.5">
            <span className="text-2xl leading-none">💊</span>
            <div className="text-sm text-on-surface">
              <p className="font-bold">{t('Suplemente?', 'Supplements?')}</p>
              <p className="text-on-surface-variant">{t('Vetëm me këshillën e mjekut ose farmacistit.', 'Only on your doctor’s or pharmacist’s advice.')}</p>
            </div>
          </div>

          <p className="text-[10px] text-outline">{t('Ky është udhëzim i thjeshtë, jo diagnozë. Për çdo shqetësim, pyet mjekun.', 'Simple guidance, not a diagnosis. Ask your doctor about anything that worries you.')}</p>
        </aside>
      </div>
    </section>
  );
};
