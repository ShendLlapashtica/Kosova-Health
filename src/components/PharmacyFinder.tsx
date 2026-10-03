import React, { useState } from 'react';
import { Pharmacy, Language } from '../types';
import { PHARMACIES, VERIFIED_PRODUCTS } from '../data/mockData';

interface PharmacyFinderProps {
  language: Language;
  onOpenPrescriptions: () => void;
  onNotification: (msg: string) => void;
}

export const PharmacyFinder: React.FC<PharmacyFinderProps> = ({
  language,
  onOpenPrescriptions,
  onNotification,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [kujdestareOnly, setKujdestareOnly] = useState<boolean>(false);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | number>('riga');
  const [productCategory, setProductCategory] = useState<string>('all');

  const selectedPharmacy = PHARMACIES.find((p) => p.id === selectedPharmacyId) || PHARMACIES[0];

  const zones = [
    { id: 'all', label: language === 'al' ? 'All Prishtinë (8)' : 'All Prishtinë (8)' },
    { id: 'Qendër', label: 'Qendër / Sheshi' },
    { id: 'Dardania', label: 'Dardania' },
    { id: 'Ulpiana', label: 'Ulpiana' },
    { id: 'Bregu i Diellit', label: 'Bregu i Diellit' },
    { id: 'Lakrishtë', label: 'Lakrishtë' },
    { id: 'Dragodan / Arbëria', label: 'Dragodan / Arbëria' },
    { id: 'Mati 1', label: 'Mati 1' },
  ];

  // Filtering pharmacies
  const filteredPharmacies = PHARMACIES.filter((pharmacy) => {
    const zoneMatch = selectedZone === 'all' || pharmacy.zone === selectedZone;
    const custodyMatch = !kujdestareOnly || pharmacy.is24h;
    return zoneMatch && custodyMatch;
  });

  // Filtering verified inventory products
  const filteredProducts = VERIFIED_PRODUCTS.filter((prod) => {
    if (productCategory === 'all') return true;
    if (productCategory === 'deficits') return prod.category === 'Deficitet e Shendit';
    if (productCategory === 'joints') return prod.category === 'Kockat & Kyçet';
    if (productCategory === 'wellness') return prod.category === 'Kujdes Shëndetësor & Vitalitet';
    return true;
  });

  const handleReserveProduct = (prodName: string) => {
    onNotification(
      language === 'al'
        ? `"${prodName}" u rezervua me sukses në ${selectedPharmacy.name}! Kodi i tërheqjes: #PR-${Math.floor(1000 + Math.random() * 9000)}`
        : `"${prodName}" successfully reserved at ${selectedPharmacy.name}! Pickup code: #PR-${Math.floor(1000 + Math.random() * 9000)}`
    );
  };

  const handleDispatchPrescription = () => {
    onNotification(
      language === 'al'
        ? `E-Receta me 20 barna u transmetua me sukses te ${selectedPharmacy.name} përmes Rrjetit Kombëtar të Barnave!`
        : `Electronic prescription successfully dispatched to ${selectedPharmacy.name} via Kosovo National Pharmacy Network!`
    );
  };

  // Route path SVG based on selected pharmacy
  const getRoutePath = () => {
    if (selectedPharmacyId === 'riga' || selectedPharmacyId === 1) {
      return 'M 245,160 L 255,140 L 260,130';
    }
    if (selectedPharmacyId === 'melisa') {
      return 'M 245,160 L 320,200 L 400,240';
    }
    if (selectedPharmacyId === 3) {
      return 'M 245,160 L 210,195 L 140,225';
    }
    if (selectedPharmacyId === 4) {
      return 'M 245,160 L 225,158 L 215,155';
    }
    if (selectedPharmacyId === 2) {
      return 'M 245,160 L 290,175 L 345,195';
    }
    if (selectedPharmacyId === 6) {
      return 'M 245,160 L 170,170 L 95,180';
    }
    return 'M 245,160 L 320,240 L 420,330';
  };

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 gap-6">
      {/* Top Banner / Prescription Context Link */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/60 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-md">
            <span className="material-symbols-outlined text-2xl">prescriptions</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold font-label-tag uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                Clinical Biomarker Match
              </span>
              <span className="text-xs text-outline">• Synced from Dr. Arben Krasniqi's Panel (Oct 3, 2026)</span>
            </div>
            <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              {language === 'al'
                ? 'Gjetësi i Barnatoreve të Prishtinës & Kujdestaria'
                : 'Prishtina Local Pharmacy Stock & Custody Finder'}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-0.5">
              Filtered by your detected metabolic & mineral deficiencies:{' '}
              <span className="font-semibold text-primary">20 Prescribed Items</span> (Magnesium Carbonate 200mg, Calcium 600mg, Vitamin D3, B12 Sublingual, Hydrocyclin ointment, Zinc).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 w-full lg:w-auto">
          <button
            type="button"
            onClick={onOpenPrescriptions}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high transition-colors shadow-xs text-xs sm:text-sm font-bold border border-surface-container"
          >
            <span className="material-symbols-outlined text-lg">inventory_2</span>
            <span>{language === 'al' ? 'Shiko të 20 Recetat' : 'View All 20 Prescriptions'}</span>
          </button>
          <button
            type="button"
            onClick={handleDispatchPrescription}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all shadow-sm text-xs sm:text-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            <span>{language === 'al' ? 'Dërgo E-Recetën' : 'Dispatch E-Prescription'}</span>
          </button>
        </div>
      </div>

      {/* Neighborhood & Filter Toolbar */}
      <div className="p-3 sm:p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Neighborhood Filter Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-outline shrink-0 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">explore</span> Prishtina Zones:
          </span>
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setSelectedZone(zone.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedZone === zone.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>

        {/* 24/7 Custody Checkbox Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors select-none border border-surface-container">
            <input
              type="checkbox"
              checked={kujdestareOnly}
              onChange={(e) => setKujdestareOnly(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
            <span className="flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              {language === 'al' ? 'Vetëm Kujdestare 24/7' : '24/7 Custody Only'}
            </span>
          </label>

          <div className="text-xs font-mono text-outline bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-primary font-bold">{filteredPharmacies.length}</span> verified spots
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Pharmacy List & Real Inventory Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Top Alert Banner: 100% Match */}
          <div className="p-4 rounded-xl bg-secondary-container/30 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-on-surface">
                    100% Përputhje: Barnatore Melisa & Riga Pharm
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Wolt & riga-pharm.com Live
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Barnatore Melisa (Rruga B) dhe Barnatore Riga Pharm (riga-pharm.com) disponojnë të gjitha suplementet e rekomanduara me inventar të verifikuar në kohë reale.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedPharmacyId('melisa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                  selectedPharmacyId === 'melisa'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-primary border border-surface-container hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">store</span> Melisa
              </button>
              <button
                type="button"
                onClick={() => setSelectedPharmacyId('riga')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                  selectedPharmacyId === 'riga'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-primary border border-surface-container hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">verified</span> Riga Pharm
              </button>
            </div>
          </div>

          {/* Real Verified Products Shelf */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low border border-primary/20 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-surface-container-high gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold font-label-tag uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-on-primary">
                    Live Verified Inventory
                  </span>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">local_pharmacy</span>
                    Barnatore Riga Pharm & Barnatore Melisa
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-on-surface mt-0.5">
                  Artikujt Reale në Stok sipas Analizave të Shend Llapashticës
                </h4>
              </div>
              <span className="text-xs font-mono text-primary bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-surface-container-highest shadow-xs font-semibold">
                100+ Produkte Reale (Prishtinë)
              </span>
            </div>

            {/* Product Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-surface-container-high scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setProductCategory('all')}
                className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors ${
                  productCategory === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-surface-container'
                }`}
              >
                Të Gjitha (9)
              </button>
              <button
                type="button"
                onClick={() => setProductCategory('deficits')}
                className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors ${
                  productCategory === 'deficits'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-surface-container'
                }`}
              >
                Deficitet e Shendit (Magnez, D3, B12)
              </button>
              <button
                type="button"
                onClick={() => setProductCategory('wellness')}
                className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors ${
                  productCategory === 'wellness'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-surface-container'
                }`}
              >
                Kujdes Shëndetësor & Vitalitet
              </button>
              <button
                type="button"
                onClick={() => setProductCategory('joints')}
                className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors ${
                  productCategory === 'joints'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-surface-container'
                }`}
              >
                Kockat & Kyçet
              </button>
            </div>

            {/* 3x3 Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-highest shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="relative bg-white rounded-lg p-2 flex items-center justify-center h-44 overflow-hidden border border-surface-container">
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold">
                      Në Stok (Riga Pharm)
                    </span>
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-error uppercase tracking-wide block">
                        {prod.targetBadge}
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-on-surface mt-0.5 leading-snug">
                        {prod.name}
                      </h5>
                      <p className="text-[11px] text-outline mt-0.5">{prod.targetDescription}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-surface-container">
                      <span className="font-mono text-sm font-bold text-primary">
                        €{prod.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReserveProduct(prod.name)}
                        className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">shopping_basket</span>
                        <span>Rezervo</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pharmacy Cards List */}
          <div className="flex flex-col gap-2.5">
            {filteredPharmacies.map((pharmacy) => {
              const isSelected = selectedPharmacyId === pharmacy.id;
              return (
                <div
                  key={pharmacy.id}
                  onClick={() => setSelectedPharmacyId(pharmacy.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-surface-container-lowest ring-2 ring-primary border-transparent shadow-md'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border-surface-container-high/60 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm shadow-xs ${
                          isSelected || pharmacy.stockCount === 20
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {typeof pharmacy.id === 'number' ? `0${pharmacy.id}` : '★'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-on-surface hover:text-primary transition-colors">
                            {pharmacy.name}
                          </h3>
                          {pharmacy.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                              {pharmacy.badge}
                            </span>
                          )}
                          {pharmacy.is24h && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              24h Kujdestare
                            </span>
                          )}
                          {pharmacy.liveSync && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              {pharmacy.liveSync}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                          {pharmacy.address} •{' '}
                          <span className="font-mono text-primary font-bold">{pharmacy.distanceKm} km</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          pharmacy.stockCount === 20
                            ? 'bg-primary text-on-primary'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {pharmacy.stockCount === 20 ? 'verified' : 'check_circle'}
                        </span>
                        <span>{pharmacy.stockCount}/20 në stok</span>
                      </div>
                      <p className="text-[11px] text-outline mt-1 font-mono">{pharmacy.phone}</p>
                    </div>
                  </div>

                  {pharmacy.note && (
                    <div className="mt-3 pt-2.5 border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="text-outline truncate max-w-[340px]">{pharmacy.note}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPrescriptions();
                        }}
                        className="font-bold text-primary hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0"
                      >
                        <span>Shiko Katalogun (20)</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Custom Vector SVG Map & Live Action Hub (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">map</span>
                <span className="text-sm font-bold text-on-surface">Prishtina Urban Grid & Pins</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-outline uppercase font-mono">
                <span>LIVE GPS</span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              </div>
            </div>

            {/* Stylized Interactive SVG Vector Map of Prishtina */}
            <div className="relative w-full h-[380px] bg-[#E8EEF5] rounded-xl overflow-hidden select-none border border-surface-container-highest">
              <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient cx="50%" cy="50%" id="centerPulse" r="50%">
                    <stop offset="0%" stopColor="#00685f" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00685f" stopOpacity="0.0" />
                  </radialGradient>
                  <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
                  </filter>
                </defs>

                {/* District Polygons */}
                <polygon fill="#E2EBF4" opacity="0.7" points="10,20 180,10 190,130 30,150" />
                <text fill="#8896A6" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" letterSpacing="1" x="40" y="60">
                  ARBËRIA / DRAGODAN
                </text>

                <polygon fill="#DDE7F1" opacity="0.8" points="200,30 380,20 400,160 210,140" />
                <text fill="#8896A6" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" letterSpacing="1" x="250" y="70">
                  QENDËR / SHESHI
                </text>

                <polygon fill="#DFE8F2" opacity="0.7" points="40,160 220,150 200,330 30,300" />
                <text fill="#8896A6" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" letterSpacing="1" x="60" y="240">
                  DARDANIA
                </text>

                <polygon fill="#E4ECF5" opacity="0.75" points="230,160 470,160 480,360 220,350" />
                <text fill="#8896A6" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" letterSpacing="1" x="300" y="220">
                  ULPIANA & BREGU I DIELLIT
                </text>

                <polygon fill="#D8E3EF" opacity="0.6" points="230,280 490,280 490,390 230,390" />
                <text fill="#8896A6" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="8" fontWeight="700" letterSpacing="1" x="340" y="340">
                  MATI 1
                </text>

                {/* Major Arterial Roads */}
                {/* Bulevardi Bill Clinton */}
                <path d="M 40,280 L 190,220 L 250,190" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
                <path d="M 40,280 L 190,220 L 250,190" stroke="#CBD7E6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />

                {/* Sheshi Nene Tereza */}
                <path d="M 250,190 L 300,100 L 340,40" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="12" />
                <path d="M 250,190 L 300,100 L 340,40" stroke="#CBD7E6" strokeLinecap="round" strokeWidth="7" />

                {/* Agim Ramadani */}
                <path d="M 320,30 L 360,170 L 380,310" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="8" />
                <path d="M 320,30 L 360,170 L 380,310" stroke="#CBD7E6" strokeLinecap="round" strokeWidth="5" />

                {/* Garibaldi */}
                <path d="M 210,180 L 270,185 L 340,240" stroke="#CBD7E6" strokeLinecap="round" strokeWidth="4" />

                {/* Muharrem Fejza */}
                <path d="M 340,260 L 470,330" stroke="#CBD7E6" strokeLinecap="round" strokeWidth="4" />

                {/* Dynamic animated navigation route */}
                <path
                  d={getRoutePath()}
                  fill="none"
                  stroke="#00685f"
                  strokeWidth="4"
                  strokeDasharray="6,4"
                  className="animate-[dash_1.5s_linear_infinite]"
                />

                {/* User Live Location Marker */}
                <circle cx="245" cy="160" r="14" fill="url(#centerPulse)" />
                <circle cx="245" cy="160" r="6" fill="#00685f" />
                <circle cx="245" cy="160" r="3" fill="#ffffff" />
                <text x="245" y="145" fontSize="9" fontWeight="700" textAnchor="middle" fill="#131b2e">
                  You (Clinical Lab)
                </text>

                {/* Pharmacy Pins */}
                {PHARMACIES.map((p) => {
                  const isCur = selectedPharmacyId === p.id;
                  return (
                    <g
                      key={p.id}
                      onClick={() => setSelectedPharmacyId(p.id)}
                      className={`cursor-pointer transition-transform ${isCur ? 'scale-110' : 'hover:scale-105'}`}
                    >
                      {isCur && (
                        <circle cx={p.mapX} cy={p.mapY} r="16" fill="#00685f" opacity="0.25" className="animate-ping" />
                      )}
                      <circle cx={p.mapX} cy={p.mapY} r={isCur ? '13' : '10'} fill="#ffffff" filter="url(#mapShadow)" />
                      <circle cx={p.mapX} cy={p.mapY} r={isCur ? '10' : '7.5'} fill={isCur ? '#00685f' : '#008378'} />
                      <text
                        x={p.mapX}
                        y={p.mapY + 3}
                        fontSize="8"
                        fontWeight="700"
                        textAnchor="middle"
                        fill="#ffffff"
                      >
                        {typeof p.id === 'number' ? p.id : p.id === 'riga' ? 'R' : 'M'}
                      </text>

                      {isCur && (
                        <>
                          <rect
                            x={p.mapX - 55}
                            y={p.mapY - 26}
                            width="110"
                            height="18"
                            rx="4"
                            fill="#00685f"
                            filter="url(#mapShadow)"
                          />
                          <text
                            x={p.mapX}
                            y={p.mapY - 14}
                            fontSize="8"
                            fontWeight="700"
                            textAnchor="middle"
                            fill="#ffffff"
                          >
                            {p.name.replace('Barnatorja ', '').replace('Barnatore ', '')} ★
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floating controls */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-surface-container-lowest/90 backdrop-blur rounded-lg p-1 shadow-sm border border-surface-container">
                <button
                  type="button"
                  onClick={() => onNotification('Zooming in map')}
                  className="w-7 h-7 flex items-center justify-center text-on-surface hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNotification('Zooming out map')}
                  className="w-7 h-7 flex items-center justify-center text-on-surface hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPharmacyId('riga');
                    onNotification('Resetting map view to user position');
                  }}
                  className="w-7 h-7 flex items-center justify-center text-on-surface hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">my_location</span>
                </button>
              </div>
            </div>

            {/* Selected Pharmacy Route Action Box */}
            <div className="mt-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Zgjedhja Kryesore e Rekomanduar
                  </span>
                  <h4 className="text-sm font-bold text-on-surface">{selectedPharmacy.name}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {selectedPharmacy.address} • {selectedPharmacy.distanceKm} km (
                    {Math.round(selectedPharmacy.distanceKm * 4)} min në këmbë)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-primary">
                    {selectedPharmacy.stockCount} / 20
                  </span>
                  <p className="text-[11px] text-secondary font-medium">Të Gjitha në Stok</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedPharmacy.name + ' ' + selectedPharmacy.address
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">directions</span>
                  <span>Nis Navigimin ({selectedPharmacy.distanceKm} km)</span>
                </a>
                <a
                  href={`tel:${selectedPharmacy.phone}`}
                  className="flex items-center justify-center w-10 h-9 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high transition-colors shadow-xs border border-surface-container"
                  title="Telefono Farmacinë"
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                </a>
              </div>
            </div>
          </div>

          {/* Chamber of Pharmacists Trust Badge */}
          <div className="p-3.5 rounded-xl bg-surface-container-high flex items-center justify-between gap-3 border border-surface-container-highest">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xl">receipt_long</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-on-surface">Prishtina Kujdestare Registry</h5>
                <p className="text-[11px] text-on-surface-variant">
                  Regulated by the Kosovo Chamber of Pharmacists (OFK).
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-secondary font-bold">OFK #2024-PR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
