import React from 'react';
import { TabType, Language } from '../types';
import AL from 'country-flag-icons/react/3x2/AL';
import US from 'country-flag-icons/react/3x2/US';
import { LOGO_URL } from '../data/mockData';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const NAV_ITEMS: { tab: TabType; icon: string; al: string; en: string }[] = [
  { tab: 'shop', icon: 'grocery', al: 'Blerje me alergji', en: 'Allergy-safe shopping' },
  { tab: 'input', icon: 'sync_alt', al: 'Analizat e gjakut', en: 'Blood test' },
  { tab: 'pharmacies', icon: 'local_pharmacy', al: 'Farmacitë e Prishtinës', en: 'Pharmacies in Prishtina' },
];

const iconButton =
  'relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95';
const iconButtonIdle =
  'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high';

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, language, setLanguage }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/50">
      <div className="h-16 max-w-[1280px] mx-auto px-3 sm:px-4 md:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <button
          onClick={() => setActiveTab('shop')}
          className="flex items-center gap-2 text-left shrink-0 transition-transform active:scale-95"
          aria-label="KosovaHealth"
        >
          <img src={LOGO_URL} alt="KosovaHealth Logo" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          <span className="hidden sm:inline font-headline-sm text-lg text-primary tracking-tight font-bold">KosovaHealth</span>
        </button>

        {/* Sections */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV_ITEMS.map(({ tab, icon, al, en }) => {
            const label = t(al, en);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${iconButton} ${isActive ? 'bg-primary-container text-on-primary-container shadow-sm' : iconButtonIdle}`}
                title={label}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </button>
            );
          })}
        </nav>

        {/* Language */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'al' ? 'en' : 'al')}
          className="h-8 px-1 sm:px-1.5 rounded-md bg-surface-container-high hover:bg-surface-container-highest flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
          title={language === 'al' ? 'Shqip → English' : 'English → Shqip'}
          aria-label={language === 'al' ? 'Switch to English' : 'Kalo në Shqip'}
        >
          <AL title="Shqip" className={`w-6 h-4 rounded-[3px] shadow-sm transition-all ${language === 'al' ? 'ring-2 ring-primary' : 'opacity-40 grayscale-[60%]'}`} />
          <US title="English" className={`w-6 h-4 rounded-[3px] shadow-sm transition-all ${language === 'en' ? 'ring-2 ring-primary' : 'opacity-40 grayscale-[60%]'}`} />
        </button>
      </div>
    </header>
  );
};
