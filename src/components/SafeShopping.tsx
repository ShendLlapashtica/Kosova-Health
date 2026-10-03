import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Language } from '../types';
import {
  ALLERGENS,
  AllergenId,
  AllergyFinding,
  CLAIM_LABEL,
  Claim,
  OffProduct,
  ShopProduct,
  allergenById,
  fetchOff,
  loadCatalogue,
  nameWarnings,
  parseAllergyReport,
  searchProducts,
  verdictFor,
} from '../lib/allergens';
import { captureAndDecode, startCamera, startScanLoop, stopCamera } from '../lib/scanner.js';

interface Props {
  language: Language;
  onNotification: (msg: string) => void;
}

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* private mode — keep working without persistence */
    }
  },
};

const QUICK: { claim: Claim; q: string }[] = [
  { claim: 'gf', q: '' },
  { claim: 'lf', q: '' },
  { claim: 'pm', q: '' },
  { claim: 'sf', q: '' },
  { claim: 'vg', q: '' },
];

const VERDICT_STYLE = {
  contains: { box: 'bg-error-container/60 border-error/30 text-on-error-container', icon: 'dangerous' },
  traces: { box: 'bg-amber-100 border-amber-300 text-amber-900', icon: 'warning' },
  clear: { box: 'bg-secondary-container/60 border-secondary/30 text-on-secondary-container', icon: 'check_circle' },
  unknown: { box: 'bg-surface-container-high border-outline-variant text-on-surface', icon: 'help' },
};

const priceText = (p?: number) => (p === undefined ? '—' : `€${p.toFixed(2)}`);

export const SafeShopping: React.FC<Props> = ({ language, onNotification }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const name = (id: AllergenId) => (language === 'al' ? allergenById[id].al : allergenById[id].en);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [meta, setMeta] = useState<{ shops: number; builtAt: string } | null>(null);
  const [profile, setProfileState] = useState<AllergenId[]>(() => store.get('kh.profile', ['gluten', 'lactose']));
  const [findings, setFindings] = useState<AllergyFinding[]>(() => store.get('kh.findings', []));
  const [list, setListState] = useState<ShopProduct[]>(() => store.get('kh.list', []));
  const [query, setQuery] = useState('');
  const [claim, setClaim] = useState<Claim | undefined>('gf');
  const [checking, setChecking] = useState<{ product?: ShopProduct; code?: string; off?: OffProduct | null; loading: boolean } | null>(null);
  const [checks, setChecks] = useState<Record<string, OffProduct | null>>({});
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [readingTest, setReadingTest] = useState(false);
  const checkRef = useRef<HTMLDivElement>(null);

  const setProfile = (p: AllergenId[]) => {
    setProfileState(p);
    store.set('kh.profile', p);
  };
  const setList = (l: ShopProduct[]) => {
    setListState(l);
    store.set('kh.list', l);
  };

  useEffect(() => {
    loadCatalogue().then((d) => {
      setProducts(d.products);
      setMeta({ shops: d.shops, builtAt: d.builtAt });
    });
  }, []);

  const results = useMemo(() => searchProducts(products, query, claim), [products, query, claim]);

  // Look up ingredients for list items with a barcode, so the list check shows verdicts.
  useEffect(() => {
    list.filter((p) => p.c && !(p.c in checks)).forEach((p) =>
      fetchOff(p.c!).then((off) => setChecks((c) => ({ ...c, [p.c!]: off })))
    );
  }, [list, checks]);

  const openCheck = async (product?: ShopProduct, code?: string) => {
    const barcode = code ?? product?.c;
    const match = product ?? (barcode ? products.find((p) => p.c === barcode) : undefined);
    setChecking({ product: match, code: barcode, loading: !!barcode });
    requestAnimationFrame(() => checkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    if (!barcode) return;
    const off = await fetchOff(barcode);
    setChecks((c) => ({ ...c, [barcode]: off }));
    setChecking({ product: match, code: barcode, off, loading: false });
  };

  const onTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setReadingTest(true);
    try {
      const found = await parseAllergyReport(file);
      if (!found.length) {
        onNotification(t(`Nuk u gjet asnjë alergjen pozitiv në "${file.name}".`, `No positive allergens found in "${file.name}".`));
        return;
      }
      setFindings(found);
      store.set('kh.findings', found);
      setProfile([...new Set([...found.map((f) => f.id)])]);
      onNotification(
        t(
          `Nga testi: ${found.map((f) => allergenById[f.id].al).join(', ')} — lista u kontrollua sipas tyre.`,
          `From your test: ${found.map((f) => allergenById[f.id].en).join(', ')} — everything is now checked against them.`
        )
      );
    } catch {
      onNotification(t('Testi nuk mund të lexohej. Provo një PDF tjetër.', "Couldn't read the test. Try another PDF."));
    } finally {
      setReadingTest(false);
    }
  };

  const inList = (p: ShopProduct) => list.some((x) => x.n === p.n && x.c === p.c);
  const toggleList = (p: ShopProduct) => setList(inList(p) ? list.filter((x) => !(x.n === p.n && x.c === p.c)) : [...list, p]);

  const listStatus = (p: ShopProduct) => {
    if (p.c && p.c in checks) {
      const v = verdictFor(checks[p.c], profile);
      if (v.verdict !== 'unknown') return v;
    }
    const warn = nameWarnings(p, profile);
    return { verdict: warn.length ? ('contains' as const) : ('unknown' as const), contains: warn, traces: [], fromName: true };
  };
  const listSummary = list.reduce(
    (acc, p) => {
      acc[listStatus(p).verdict]++;
      return acc;
    },
    { contains: 0, traces: 0, clear: 0, unknown: 0 }
  );

  const v = checking && !checking.loading && checking.code ? verdictFor(checking.off ?? null, profile) : null;
  const alternatives = useMemo(() => {
    if (!checking?.product || !v || v.verdict === 'clear') return [];
    const cat = checking.product.k;
    return products
      .filter((p) => p !== checking.product && p.k && p.k === cat && nameWarnings(p, profile).length === 0)
      .sort((a, b) => (b.f?.length ?? 0) - (a.f?.length ?? 0) || b.o.length - a.o.length)
      .slice(0, 6);
  }, [checking, v, products, profile]);

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 gap-5">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container mb-2 text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[15px]">grocery</span>
            {t('Blerje me alergji & intoleranca', 'Shopping with allergies & intolerances')}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface tracking-tight leading-tight">
            {t('Ku ta gjej — dhe a më bën mirë?', 'Where do I find it — and is it OK for me?')}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5">
            {t(
              `${products.length.toLocaleString('de-DE')} produkte nga ${meta?.shops ?? '…'} dyqane në Kosovë. Kërko, skano barkodin, dhe kontrollo çdo artikull sipas alergjive të tua.`,
              `${products.length.toLocaleString('en-US')} products from ${meta?.shops ?? '…'} shops in Kosovo. Search, scan a barcode, and check every item against your allergies.`
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="self-start lg:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary-container active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">barcode_scanner</span>
          {t('Skano produktin', 'Scan a product')}
        </button>
      </div>

      {/* Profile */}
      <section className="rounded-xl bg-surface-container-lowest p-4 sm:p-5 shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_alert</span>
            {t('Alergjitë & intolerancat e mia', 'My allergies & intolerances')}
          </h2>
          <div className="flex items-center gap-2">
            <a href="/sample-allergy-test.pdf" download="Test-Alergjie-Shembull-KosovaHealth.pdf" className="text-xs font-semibold text-primary hover:underline">
              {t('Testi shembull', 'Sample test')}
            </a>
            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${readingTest ? 'bg-surface-container-high text-outline' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
              <span className={`material-symbols-outlined text-[16px] ${readingTest ? 'animate-spin' : ''}`}>{readingTest ? 'progress_activity' : 'upload_file'}</span>
              {readingTest ? t('Duke lexuar…', 'Reading…') : t('Ngarko testin e alergjisë (PDF)', 'Upload allergy test (PDF)')}
              <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={onTestUpload} disabled={readingTest} />
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map((a) => {
            const on = profile.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setProfile(on ? profile.filter((x) => x !== a.id) : [...profile, a.id])}
                aria-pressed={on}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${on ? 'bg-error text-on-error border-error shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container-high'}`}
              >
                {on ? '✕ ' : '+ '}
                {language === 'al' ? a.al : a.en}
              </button>
            );
          })}
        </div>
        {findings.length > 0 && (
          <p className="text-[11px] text-on-surface-variant">
            {t('Nga testi yt:', 'From your test:')}{' '}
            {findings.map((f) => `${name(f.id)} (${f.detail})`).join(' · ')}.{' '}
            <span className="text-outline">{t('IgE pozitiv = ndjeshmëri, jo domosdo alergji — konfirmo me alergologun.', 'Positive IgE means sensitisation, not always allergy — confirm with your allergist.')}</span>
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Search & results */}
        <section className="lg:col-span-8 flex flex-col gap-3 min-w-0">
          <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Kërko: qumësht bajame, bukë, makarona, djathë…', 'Search: almond milk, bread, pasta, cheese…')}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setClaim(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${!claim ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {t('Të gjitha', 'All')}
              </button>
              {QUICK.map(({ claim: c }) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClaim(claim === c ? undefined : c)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${claim === c ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {language === 'al' ? CLAIM_LABEL[c].al : CLAIM_LABEL[c].en}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-outline">
              {products.length === 0
                ? t('Duke ngarkuar produktet…', 'Loading products…')
                : t(`${results.total} produkte`, `${results.total} products`)}
              {claim && ` · ${t('etiketa sipas emrit në dyqan — kontrollo përbërësit', 'label taken from the shop listing name — check ingredients')}`}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {results.items.map((p, idx) => {
              const warn = nameWarnings(p, profile);
              return (
                <article key={`${p.c ?? p.n}-${idx}`} className="rounded-xl bg-surface-container-lowest p-3 shadow-xs border border-surface-container-high/60 flex gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-white border border-surface-container flex items-center justify-center overflow-hidden shrink-0">
                    {p.i ? <img src={p.i} alt="" loading="lazy" className="max-w-full max-h-full object-contain" /> : <span className="material-symbols-outlined text-outline">grocery</span>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-on-surface leading-snug">{p.n}</h3>
                      <span className="font-mono text-sm font-bold text-primary shrink-0">{priceText(p.o[0]?.p)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.f?.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                          ✓ {language === 'al' ? CLAIM_LABEL[c].al : CLAIM_LABEL[c].en}
                        </span>
                      ))}
                      {warn.map((id) => (
                        <span key={id} className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold">
                          ⚠ {t('emri përmend', 'name mentions')}: {name(id)}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      <span className="material-symbols-outlined text-[13px] align-[-2px] text-primary">storefront</span>{' '}
                      {p.o.slice(0, 4).map((o) => `${o.s} ${priceText(o.p)}`).join(' · ')}
                      {p.o.length > 4 && ` · +${p.o.length - 4}`}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button type="button" onClick={() => openCheck(p)} className="text-xs font-bold text-primary hover:underline">
                        {p.c ? t('Kontrollo përbërësit', 'Check ingredients') : t('Ku gjendet', 'Where to buy')}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleList(p)}
                        className={`text-xs font-bold px-2 py-0.5 rounded ${inList(p) ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                      >
                        {inList(p) ? t('✓ Në listë', '✓ In list') : t('+ Lista', '+ List')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {products.length > 0 && results.total === 0 && (
              <div className="rounded-xl bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
                {t('Asnjë produkt në dyqanet online për këtë kërkim. Në raft mund të ketë — kjo listë mbulon vetëm ofertat online.', 'No product in the online shop listings for this. Shelves may still have it — this covers online listings only.')}
              </div>
            )}
          </div>
        </section>

        {/* Right column: check result + shopping list */}
        <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 min-w-0">
          <div ref={checkRef} className="scroll-mt-24">
            {checking ? (
              <div className="rounded-xl bg-surface-container-lowest p-4 shadow-md border border-surface-container-high/60 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t('Kontrolli', 'Check')}</span>
                    <h3 className="text-sm font-bold text-on-surface leading-snug">
                      {checking.product?.n ?? checking.off?.name ?? checking.code}
                    </h3>
                    {checking.code && <p className="text-[11px] font-mono text-outline">{checking.code}</p>}
                  </div>
                  <button type="button" onClick={() => setChecking(null)} className="text-outline hover:text-on-surface" aria-label={t('Mbyll', 'Close')}>
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {checking.loading && <p className="text-xs text-on-surface-variant">{t('Duke kërkuar përbërësit…', 'Looking up ingredients…')}</p>}

                {v && (
                  <div className={`rounded-lg border p-3 flex gap-2 ${VERDICT_STYLE[v.verdict].box}`}>
                    <span className="material-symbols-outlined text-[22px]">{VERDICT_STYLE[v.verdict].icon}</span>
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-sm">
                        {v.verdict === 'contains' && t(`Përmban: ${v.contains.map(name).join(', ')}`, `Contains: ${v.contains.map(name).join(', ')}`)}
                        {v.verdict === 'traces' && t(`Mund të përmbajë gjurmë: ${v.traces.map(name).join(', ')}`, `May contain traces: ${v.traces.map(name).join(', ')}`)}
                        {v.verdict === 'clear' && t('Asnjë nga alergjenët e tu në listën e përbërësve', 'None of your allergens in the ingredient list')}
                        {v.verdict === 'unknown' && t('Nuk kemi përbërësit e këtij produkti', "We don't have this product's ingredients")}
                      </p>
                      <p className="opacity-80">
                        {v.verdict === 'unknown'
                          ? t('Lexo etiketën në paketim para se ta blesh.', 'Read the label on the pack before you buy.')
                          : t('Sipas Open Food Facts. Receta ndryshon — kontrollo gjithmonë etiketën.', 'From Open Food Facts. Recipes change — always check the label.')}
                      </p>
                    </div>
                  </div>
                )}
                {!checking.code && checking.product && (
                  <p className="text-xs text-on-surface-variant">{t('Ky produkt nuk ka barkod në listë — përbërësit nuk mund të kontrollohen automatikisht.', 'No barcode in the listing — ingredients can’t be checked automatically.')}</p>
                )}

                {checking.off?.ingredients && (
                  <details className="text-xs text-on-surface-variant">
                    <summary className="cursor-pointer font-semibold text-on-surface">{t('Përbërësit', 'Ingredients')}</summary>
                    <p className="mt-1 leading-relaxed">{checking.off.ingredients}</p>
                  </details>
                )}

                <div>
                  <h4 className="text-xs font-bold text-on-surface mb-1">{t('Ku gjendet', 'Where to buy')}</h4>
                  {checking.product ? (
                    <ul className="flex flex-col gap-1">
                      {checking.product.o.map((o) => (
                        <li key={o.s} className="flex items-center justify-between gap-2 text-xs bg-surface-container-low rounded px-2 py-1.5">
                          <a href={o.u} target="_blank" rel="noreferrer" className="font-semibold text-on-surface hover:text-primary truncate">{o.s}</a>
                          <span className="font-mono font-bold text-primary">{priceText(o.p)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-on-surface-variant">{t('Nuk e gjetëm në dyqanet online në Kosovë.', 'Not found in Kosovo online shop listings.')}</p>
                  )}
                </div>

                {alternatives.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">{t('Alternativa në të njëjtën kategori', 'Alternatives in the same category')}</h4>
                    <ul className="flex flex-col gap-1">
                      {alternatives.map((a, i) => (
                        <li key={i}>
                          <button type="button" onClick={() => openCheck(a)} className="w-full text-left text-xs bg-surface-container-low hover:bg-surface-container-high rounded px-2 py-1.5 flex justify-between gap-2">
                            <span className="truncate">{a.n}</span>
                            <span className="font-mono text-primary shrink-0">{priceText(a.o[0]?.p)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {checking.product && (
                  <button type="button" onClick={() => toggleList(checking.product!)} className="w-full py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container">
                    {inList(checking.product) ? t('✓ Në listën e blerjes', '✓ In shopping list') : t('+ Shto në listën e blerjes', '+ Add to shopping list')}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-surface-container-low p-4 border border-surface-container-high/60 text-xs text-on-surface-variant flex flex-col gap-2">
                <p className="font-bold text-on-surface text-sm">{t('Kontrollo me barkod', 'Check by barcode')}</p>
                <p>{t('Skano ose shkruaj barkodin e produktit.', 'Scan or type the product barcode.')}</p>
                <form
                  className="flex gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = manualCode.replace(/\D/g, '');
                    if (code.length >= 8) openCheck(undefined, code);
                  }}
                >
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    inputMode="numeric"
                    placeholder="p.sh. 8001300800675"
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button type="submit" className="px-3 rounded-lg bg-primary text-on-primary text-xs font-bold">{t('Kontrollo', 'Check')}</button>
                </form>
              </div>
            )}
          </div>

          {/* Shopping list check */}
          <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
                {t('Lista e blerjes', 'Shopping list')} ({list.length})
              </h3>
              {list.length > 0 && (
                <button type="button" onClick={() => setList([])} className="text-[11px] text-outline hover:text-error">
                  {t('Pastro', 'Clear')}
                </button>
              )}
            </div>
            {list.length === 0 ? (
              <p className="text-xs text-on-surface-variant">{t('Shto produkte me “+ Lista” — çdo artikull kontrollohet sipas alergjive të tua.', 'Add products with “+ List” — every item is checked against your allergies.')}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                  {listSummary.contains > 0 && <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container">{listSummary.contains} {t('me alergjenë', 'with allergens')}</span>}
                  {listSummary.traces > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">{listSummary.traces} {t('gjurmë', 'traces')}</span>}
                  {listSummary.clear > 0 && <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">{listSummary.clear} OK</span>}
                  {listSummary.unknown > 0 && <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface">{listSummary.unknown} {t('lexo etiketën', 'read label')}</span>}
                </div>
                <ul className="flex flex-col gap-1">
                  {list.map((p, i) => {
                    const s = listStatus(p);
                    return (
                      <li key={i} className="flex items-center gap-2 text-xs bg-surface-container-low rounded px-2 py-1.5">
                        <span className={`material-symbols-outlined text-[16px] ${s.verdict === 'contains' ? 'text-error' : s.verdict === 'traces' ? 'text-amber-600' : s.verdict === 'clear' ? 'text-secondary' : 'text-outline'}`}>
                          {VERDICT_STYLE[s.verdict].icon}
                        </span>
                        <button type="button" onClick={() => openCheck(p)} className="flex-1 min-w-0 text-left truncate hover:text-primary">{p.n}</button>
                        <span className="font-mono text-primary">{priceText(p.o[0]?.p)}</span>
                        <button type="button" onClick={() => toggleList(p)} className="text-outline hover:text-error" aria-label={t('Hiq', 'Remove')}>
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[11px] text-on-surface-variant">
                  {t('Totali (më lirë):', 'Total (cheapest):')}{' '}
                  <b className="font-mono text-primary">€{list.reduce((s, p) => s + (p.o[0]?.p ?? 0), 0).toFixed(2)}</b>
                </p>
              </>
            )}
          </div>

          <p className="text-[10px] text-outline leading-relaxed">
            {t(
              `Produktet & çmimet: katalogu i Vendorja nga dyqanet online në Kosovë (${meta?.builtAt?.slice(0, 10) ?? ''}). Përbërësit: Open Food Facts. Ky mjet ndihmon, por nuk zëvendëson leximin e etiketës.`,
              `Products & prices: Vendorja's catalogue of Kosovo online shops (${meta?.builtAt?.slice(0, 10) ?? ''}). Ingredients: Open Food Facts. A helper — it doesn't replace reading the label.`
            )}
          </p>
        </aside>
      </div>

      {scanning && (
        <Scanner
          language={language}
          onClose={() => setScanning(false)}
          onDetected={(code) => {
            setScanning(false);
            openCheck(undefined, code);
          }}
        />
      )}
    </div>
  );
};

/** Camera barcode scanner — Vendorja's scanner.js (native BarcodeDetector, ZXing fallback). */
const Scanner: React.FC<{ language: Language; onClose: () => void; onDetected: (code: string) => void }> = ({ language, onClose, onDetected }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    let stopScan: (() => void) | undefined;
    (async () => {
      try {
        const stream = await startCamera(videoRef.current);
        if (cancelled) return stopCamera(stream);
        streamRef.current = stream;
        stopScan = await startScanLoop(videoRef.current, {
          onDetect: (c: string) => {
            if (cancelled) return;
            cancelled = true;
            stopScan?.();
            stopCamera(stream);
            onDetected(c);
          },
          onStatus: () => {},
        });
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      stopScan?.();
      stopCamera(streamRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = async () => {
    setBusy(true);
    try {
      const c = await captureAndDecode(videoRef.current);
      if (c) {
        stopCamera(streamRef.current);
        onDetected(c);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-3 text-white">
        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label={t('Mbyll', 'Close')}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <p className="text-sm">{error ? t('Kamera nuk u hap — shkruaj barkodin.', 'Camera unavailable — type the barcode.') : t('Drejtoje kamerën te barkodi', 'Point the camera at the barcode')}</p>
        <span className="w-10" />
      </div>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
        <div className="relative w-[80%] max-w-sm aspect-[3/2] border-4 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
      </div>
      <div className="p-4 flex flex-col gap-2 bg-black">
        {!error && (
          <button type="button" onClick={capture} disabled={busy} className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold">
            {busy ? t('Duke lexuar…', 'Reading…') : t('Fotografo barkodin', 'Photograph the barcode')}
          </button>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.replace(/\D/g, '');
            if (c.length >= 8) onDetected(c);
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder={t('ose shkruaj barkodin', 'or type the barcode')} className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/50 font-mono" />
          <button type="submit" className="px-4 rounded-lg bg-white text-black font-bold text-sm">OK</button>
        </form>
      </div>
    </div>
  );
};
