import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { CircleMarker as LCircleMarker, LatLngBoundsExpression } from 'leaflet';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Language } from '../types';
import { isOpenAt, prettyHours } from '../lib/openingHours';
import data from '../data/prishtinaPharmacies.json';

interface PharmacyFinderProps {
  language: Language;
  onOpenPrescriptions: () => void;
  onNotification: (msg: string) => void;
}

interface Pharmacy {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  street: string | null;
  openingHours: string | null;
  phone: string | null;
  website: string | null;
}

const PHARMACIES = data.pharmacies as Pharmacy[];
const CENTER: [number, number] = [42.6603, 21.1606]; // Qendra
// Neighbourhood centres from OpenStreetMap (place=suburb).
const ZONES: { id: string; name: string; at: [number, number] }[] = [
  { id: 'qendra', name: 'Qendra', at: [42.66036, 21.16064] },
  { id: 'dardania', name: 'Dardania', at: [42.65184, 21.1537] },
  { id: 'ulpiana', name: 'Ulpiana', at: [42.6504, 21.16068] },
  { id: 'bregu', name: 'Bregu i Diellit', at: [42.64995, 21.16878] },
  { id: 'lakrishte', name: 'Lakrishtë', at: [42.65584, 21.15121] },
  { id: 'arberia', name: 'Arbëria', at: [42.66199, 21.15011] },
  { id: 'mati', name: 'Mati 1', at: [42.65065, 21.17993] },
  { id: 'kalabria', name: 'Kalabria', at: [42.64356, 21.1459] },
  { id: 'velania', name: 'Velania', at: [42.66212, 21.17435] },
  { id: 'tophane', name: 'Tophane', at: [42.66821, 21.16062] },
];

const km = (a: [number, number], b: [number, number]) => {
  const R = 6371, dLat = ((b[0] - a[0]) * Math.PI) / 180, dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const directions = (p: Pharmacy) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
const COLORS = { open: '#00685f', closed: '#8a9593', unknown: '#ffffff' };

/** Moves the map when a zone, the user's location or a pharmacy is picked. */
function MapMover({ target, bounds }: { target: { at: [number, number]; zoom: number; n: number } | null; bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.at, target.zoom, { duration: 0.6 });
  }, [target, map]);
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map]);
  return null;
}

export const PharmacyFinder: React.FC<PharmacyFinderProps> = ({ language, onOpenPrescriptions, onNotification }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const [zone, setZone] = useState<string>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [only247, setOnly247] = useState(false);
  const [query, setQuery] = useState('');
  const [me, setMe] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState<{ at: [number, number]; zoom: number; n: number } | null>(null);
  const [bounds, setBounds] = useState<LatLngBoundsExpression | null>(null);
  const [now, setNow] = useState(() => new Date());
  const markers = useRef(new Map<string, LCircleMarker>());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const zoneInfo = ZONES.find((z) => z.id === zone);
  const from: [number, number] = me ?? zoneInfo?.at ?? CENTER;
  const fromLabel = me ? t('nga ti', 'from you') : zoneInfo ? t(`nga ${zoneInfo.name}`, `from ${zoneInfo.name}`) : t('nga qendra', 'from the centre');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PHARMACIES.map((p) => ({ p, open: isOpenAt(p.openingHours, now), dist: km(from, [p.lat, p.lng]) }))
      .filter(({ p, open }) => (!onlyOpen || open === true) && (!only247 || p.openingHours === '24/7'))
      .filter(({ p }) => !q || `${p.name ?? ''} ${p.street ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.dist - b.dist);
  }, [now, from, onlyOpen, only247, query]);
  const openCount = PHARMACIES.filter((p) => isOpenAt(p.openingHours, now) === true).length;

  const pick = (p: Pharmacy) => {
    setSelected(p.id);
    setTarget({ at: [p.lat, p.lng], zoom: 17, n: Date.now() });
    setTimeout(() => markers.current.get(p.id)?.openPopup(), 650);
  };

  const pickZone = (id: string) => {
    setZone(id);
    setMe(null);
    if (id === 'all') setBounds(PHARMACIES.map((p) => [p.lat, p.lng]) as LatLngBoundsExpression);
    else setTarget({ at: ZONES.find((z) => z.id === id)!.at, zoom: 15, n: Date.now() });
  };

  const locate = () => {
    if (!navigator.geolocation) return onNotification(t('Shfletuesi nuk e jep vendndodhjen.', "Your browser can't share location."));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMe(at);
        setZone('all');
        setTarget({ at, zoom: 16, n: Date.now() });
      },
      () => onNotification(t('Nuk e morëm vendndodhjen — lejoje në shfletues.', "Couldn't get your location — allow it in the browser.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const statusPill = (open: boolean | undefined, p: Pharmacy) =>
    p.openingHours === '24/7' ? (
      <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold">24/7</span>
    ) : open === true ? (
      <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">{t('Hapur tani', 'Open now')}</span>
    ) : open === false ? (
      <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold">{t('Mbyllur', 'Closed')}</span>
    ) : (
      <span className="px-1.5 py-0.5 rounded border border-outline-variant text-outline text-[10px] font-bold">{t('Orari ?', 'Hours ?')}</span>
    );

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 gap-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">{t('Farmacitë në Prishtinë', 'Pharmacies in Prishtina')}</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t(`${PHARMACIES.length} farmaci të vërteta në hartë · ${openCount} të hapura tani`, `${PHARMACIES.length} real pharmacies on the map · ${openCount} open now`)}
          </p>
        </div>
        <button type="button" onClick={onOpenPrescriptions} className="self-start lg:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-primary text-sm font-bold border border-surface-container hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-[18px]">prescriptions</span>
          {t('Recetat e mia', 'My prescriptions')}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-surface-container-lowest p-3 shadow-sm border border-surface-container-high/60 flex flex-col gap-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[{ id: 'all', name: t('Gjithë Prishtina', 'All Prishtina') }, ...ZONES].map((z) => (
            <button key={z.id} type="button" onClick={() => pickZone(z.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${zone === z.id && !me ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {z.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Kërko farmacinë ose rrugën…', 'Search pharmacy or street…')} className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="button" onClick={() => setOnlyOpen((v) => !v)} aria-pressed={onlyOpen} className={`px-3 py-2 rounded-lg text-xs font-bold ${onlyOpen ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}>
            🟢 {t('Hapur tani', 'Open now')}
          </button>
          <button type="button" onClick={() => setOnly247((v) => !v)} aria-pressed={only247} className={`px-3 py-2 rounded-lg text-xs font-bold ${only247 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}>
            🌙 24/7
          </button>
          <button type="button" onClick={locate} className="px-3 py-2 rounded-lg text-xs font-bold bg-secondary-container text-on-secondary-container hover:opacity-90 inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            {t('Më e afërta me mua', 'Nearest to me')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Map */}
        <div className="lg:col-span-7 lg:order-2 lg:sticky lg:top-20">
          <div className="relative z-0 h-[380px] sm:h-[460px] lg:h-[calc(100vh-7rem)] lg:max-h-[680px] rounded-xl overflow-hidden border border-surface-container-high shadow-sm">
            <MapContainer center={CENTER} zoom={14} scrollWheelZoom={false} preferCanvas className="w-full h-full">
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
                className="kh-tiles"
              />
              <MapMover target={target} bounds={bounds} />
              {me && <CircleMarker center={me} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} />}
              {rows.map(({ p, open }) => {
                const isSel = selected === p.id;
                const is247 = p.openingHours === '24/7';
                return (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat, p.lng]}
                    radius={isSel ? 11 : is247 ? 8 : 7}
                    ref={(m) => {
                      if (m) markers.current.set(p.id, m);
                    }}
                    eventHandlers={{ click: () => setSelected(p.id) }}
                    pathOptions={{
                      color: is247 ? '#b45309' : '#00685f',
                      weight: isSel ? 4 : is247 ? 3 : 2,
                      fillColor: open === true ? COLORS.open : open === false ? COLORS.closed : COLORS.unknown,
                      fillOpacity: 0.95,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 190 }}>
                        <strong style={{ fontSize: 14 }}>{p.name ?? t('Farmaci', 'Pharmacy')}</strong>
                        {p.street && <div style={{ color: '#5b6b69' }}>{p.street}</div>}
                        <div style={{ margin: '6px 0' }}>
                          {open === true ? '🟢 ' : open === false ? '⚪ ' : ''}
                          {prettyHours(p.openingHours, language)}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <a href={directions(p)} target="_blank" rel="noreferrer">{t('Udhëzime →', 'Directions →')}</a>
                          {p.phone && <a href={`tel:${p.phone}`}>{t('Telefono', 'Call')}</a>}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            {/* Legend */}
            <div className="absolute left-2 bottom-6 z-[400] bg-surface-container-lowest/95 rounded-lg px-2.5 py-1.5 shadow text-[11px] text-on-surface flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full border-2 border-[#00685f] bg-[#00685f]" />{t('Hapur tani', 'Open now')}</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full border-2 border-[#00685f] bg-[#8a9593]" />{t('Mbyllur', 'Closed')}</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full border-2 border-[#00685f] bg-white" />{t('Orari i panjohur', 'Hours unknown')}</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full border-[3px] border-[#b45309] bg-[#00685f]" />24/7</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-5 lg:order-1 flex flex-col gap-2">
          <p className="text-xs text-on-surface-variant">
            {t(`${rows.length} farmaci · më të afërtat ${fromLabel}`, `${rows.length} pharmacies · nearest ${fromLabel}`)}
          </p>
          <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            {rows.slice(0, 60).map(({ p, open, dist }) => (
              <article
                key={p.id}
                onClick={() => pick(p)}
                className={`rounded-xl p-3 border cursor-pointer transition-all ${selected === p.id ? 'bg-surface-container-lowest ring-2 ring-primary border-transparent shadow-md' : 'bg-surface-container-lowest border-surface-container-high/60 hover:bg-surface-container-low'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-on-surface truncate">{p.name ?? t('Farmaci (pa emër në hartë)', 'Pharmacy (no name on map)')}</h3>
                    <p className="text-xs text-on-surface-variant truncate">{p.street ?? t('Adresa nuk dihet', 'Address unknown')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {statusPill(open, p)}
                    <p className="text-[11px] font-mono font-bold text-primary mt-1">{dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[11px] text-on-surface-variant truncate">🕒 {prettyHours(p.openingHours, language)}</span>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-surface-container-high" aria-label={t('Telefono', 'Call')}>
                        <span className="material-symbols-outlined text-[16px]">call</span>
                      </a>
                    )}
                    <a href={directions(p)} target="_blank" rel="noreferrer" className="h-8 px-2.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold flex items-center gap-1 hover:bg-primary-container">
                      <span className="material-symbols-outlined text-[15px]">directions</span>
                      {t('Shko', 'Go')}
                    </a>
                  </div>
                </div>
              </article>
            ))}
            {rows.length === 0 && (
              <div className="rounded-xl bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">{t('Asnjë farmaci me këto filtra.', 'No pharmacy with these filters.')}</div>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-outline">
        {t(
          `Të dhënat: © OpenStreetMap (${data.fetchedAt}). Orari mund të ndryshojë — telefono para se të shkosh. Disa farmaci nuk e kanë orarin në hartë.`,
          `Data: © OpenStreetMap (${data.fetchedAt}). Hours can change — call before you go. Some pharmacies have no hours on the map.`
        )}
      </p>
    </div>
  );
};
