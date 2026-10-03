import React from 'react';
import { TabType, Language, PatientProfile } from '../types';
import AL from 'country-flag-icons/react/3x2/AL';
import US from 'country-flag-icons/react/3x2/US';
import { LOGO_URL, DOCTOR_PHOTO_URL } from '../data/mockData';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  patient: PatientProfile;
  onOpenAuth: () => void;
  isDoctorView: boolean;
  setIsDoctorView: (val: boolean) => void;
  onOpenPrescriptions: () => void;
}

const NAV_ITEMS: { tab: TabType; icon: string; al: string; en: string }[] = [
  { tab: 'shop', icon: 'grocery', al: 'Blerje me alergji', en: 'Allergy-safe shopping' },
  { tab: 'input', icon: 'sync_alt', al: 'Regjistrimi i Analizave', en: 'Lab & Biomarkers Input' },
  { tab: 'diagrams', icon: 'donut_large', al: 'Diagramet & Deficitet', en: 'Health Diagrams' },
  { tab: 'pharmacies', icon: 'local_pharmacy', al: 'Farmacitë e Prishtinës', en: 'Prishtina Pharmacy Finder' },
];

const iconButton =
  'relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95';
const iconButtonIdle =
  'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high';

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  patient,
  onOpenAuth,
  isDoctorView,
  setIsDoctorView,
  onOpenPrescriptions,
}) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const prescriptionsLabel = t('Recetat (20)', 'Prescriptions (20)');
  const signInLabel = t('Hyrja', 'Sign In');
  const viewLabel = isDoctorView ? 'Doctor View' : 'Patient View';
  const locationLabel = 'Prishtina, Kosovë (Dardania / Qendër)';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/50">
      <div className="h-16 max-w-[1280px] mx-auto px-3 sm:px-4 md:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('shop')}
            className="flex items-center gap-2 text-left group transition-transform active:scale-95"
            aria-label="KosovaHealth"
          >
            <img
              src={LOGO_URL}
              alt="KosovaHealth Logo"
              className="h-9 w-9 shrink-0 rounded-lg object-contain"
            />
            <span className="hidden sm:inline font-headline-sm text-lg text-primary tracking-tight font-bold">
              KosovaHealth
            </span>
          </button>

          <span
            className="hidden xl:flex w-8 h-8 items-center justify-center rounded-full bg-surface-container-low text-tertiary"
            title={locationLabel}
            aria-label={locationLabel}
          >
            <span className="material-symbols-outlined text-[18px]">location_on</span>
          </span>
        </div>

        {/* Nav Links Zone */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV_ITEMS.map(({ tab, icon, al, en }) => {
            const label = t(al, en);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${iconButton} ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : iconButtonIdle
                }`}
                title={label}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </button>
            );
          })}

          <button
            onClick={onOpenPrescriptions}
            className={`${iconButton} ${iconButtonIdle}`}
            title={prescriptionsLabel}
            aria-label={prescriptionsLabel}
          >
            <span className="material-symbols-outlined text-[20px]">prescriptions</span>
            <span className="absolute top-1 right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold leading-4 text-center">
              20
            </span>
          </button>
        </nav>

        {/* Action Controls & User Zone */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'al' ? 'en' : 'al')}
            className="h-8 px-1 sm:px-1.5 rounded-md bg-surface-container-high hover:bg-surface-container-highest flex items-center gap-1 sm:gap-1.5 transition-colors"
            title={language === 'al' ? 'Shqip → English' : 'English → Shqip'}
            aria-label={language === 'al' ? 'Switch to English' : 'Kalo në Shqip'}
          >
            <AL
              title="Shqip"
              className={`w-6 h-4 rounded-[3px] shadow-sm transition-all ${
                language === 'al' ? 'ring-2 ring-primary' : 'opacity-40 grayscale-[60%]'
              }`}
            />
            <US
              title="English"
              className={`w-6 h-4 rounded-[3px] shadow-sm transition-all ${
                language === 'en' ? 'ring-2 ring-primary' : 'opacity-40 grayscale-[60%]'
              }`}
            />
          </button>

          {/* Quick Portal Switch / Demo Auth */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container hover:opacity-90 transition-opacity"
            title={signInLabel}
            aria-label={signInLabel}
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
          </button>

          {/* Toggle Doctor View */}
          <button
            type="button"
            onClick={() => setIsDoctorView(!isDoctorView)}
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-md bg-surface-container text-outline hover:text-on-surface transition-colors"
            title={`${viewLabel} — Këmbe pamjen e mjekut / pacientit`}
            aria-label={viewLabel}
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
          </button>

          {/* Profile Badge */}
          {isDoctorView ? (
            <button
              type="button"
              className="shrink-0 rounded-full"
              onClick={() => setIsDoctorView(false)}
              title="Dr. Arta Gashi — Avicena Lab Prishtinë"
              aria-label="Dr. Arta Gashi"
            >
              <img
                src={DOCTOR_PHOTO_URL}
                alt="Dr. Arta Gashi"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30"
              />
            </button>
          ) : (
            <button
              type="button"
              className="relative shrink-0 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm"
              onClick={onOpenAuth}
              title={`${patient.name} — ${t('Pacient i Verifikuar', 'Verified Patient')}`}
              aria-label={patient.name}
            >
              SL
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface"></span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
