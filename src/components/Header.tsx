import React from 'react';
import { TabType, Language, PatientProfile } from '../types';
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
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/50">
      <div className="h-16 max-w-[1280px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('input')}
            className="flex items-center gap-2 text-left group transition-transform active:scale-95"
          >
            <img
              src={LOGO_URL}
              alt="KosovaHealth Logo"
              className="h-9 w-auto object-contain"
            />
            <span className="font-headline-sm text-lg text-primary tracking-tight font-bold">
              KosovaHealth
            </span>
          </button>

          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[15px] text-tertiary">
              location_on
            </span>
            <span className="font-label-tag">Prishtina, Kosovë (Dardania / Qendër)</span>
          </div>
        </div>

        {/* Nav Links Zone */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3.5 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'input'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">sync_alt</span>
            <span>{language === 'al' ? 'Regjistrimi i Analizave' : 'Lab & Biomarkers Input'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diagrams')}
            className={`px-3.5 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'diagrams'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">donut_large</span>
            <span>{language === 'al' ? 'Diagramet & Deficitet' : 'Health Diagrams'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacies')}
            className={`px-3.5 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'pharmacies'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">local_pharmacy</span>
            <span>{language === 'al' ? 'Farmacitë e Prishtinës' : 'Prishtina Pharmacy Finder'}</span>
          </button>

          <button
            onClick={onOpenPrescriptions}
            className="px-3.5 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">prescriptions</span>
            <span>{language === 'al' ? 'Recetat (20)' : 'Prescriptions (20)'}</span>
          </button>
        </nav>

        {/* Action Controls & User Zone */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'al' ? 'en' : 'al')}
            className="px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Toggle Shqip / English"
          >
            <span className={language === 'al' ? 'text-primary font-bold' : 'text-outline'}>
              🇦🇱 AL
            </span>
            <span className="text-outline">/</span>
            <span className={language === 'en' ? 'text-primary font-bold' : 'text-outline'}>
              🇬🇧 EN
            </span>
          </button>

          {/* Quick Portal Switch / Demo Auth */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            title="Hap Portalin e Identifikimit"
          >
            <span className="material-symbols-outlined text-[14px]">lock_open</span>
            <span>{language === 'al' ? 'Hyrja' : 'Sign In'}</span>
          </button>

          {/* Toggle Doctor View */}
          <button
            type="button"
            onClick={() => setIsDoctorView(!isDoctorView)}
            className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-surface-container text-outline hover:text-on-surface"
            title="Këmbe pamjen e mjekut / pacientit"
          >
            <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
            <span>{isDoctorView ? 'Doctor View' : 'Patient View'}</span>
          </button>

          {/* Profile Badge */}
          {isDoctorView ? (
            <div className="flex items-center gap-2 pl-1 cursor-pointer" onClick={() => setIsDoctorView(false)}>
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface">Dr. Arta Gashi</span>
                <span className="text-[11px] text-tertiary">Avicena Lab Prishtinë</span>
              </div>
              <img
                src={DOCTOR_PHOTO_URL}
                alt="Dr. Arta Gashi"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 cursor-pointer" onClick={onOpenAuth}>
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface leading-tight">
                  {patient.name}
                </span>
                <span className="text-[11px] text-primary font-medium flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  {language === 'al' ? 'Pacient i Verifikuar' : 'Verified Patient'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                SL
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-1.5 bg-surface-container-low border-t border-surface-container-high/60 gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('input')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'input' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          {language === 'al' ? '1. Analizat & Input' : '1. Lab Input'}
        </button>
        <button
          onClick={() => setActiveTab('diagrams')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'diagrams' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          {language === 'al' ? '2. Diagramet & Deficitet' : '2. Health Diagrams'}
        </button>
        <button
          onClick={() => setActiveTab('pharmacies')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'pharmacies' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          {language === 'al' ? '3. Farmacitë e Prishtinës' : '3. Pharmacy Stock'}
        </button>
        <button
          onClick={onOpenPrescriptions}
          className="px-3 py-1 rounded-md text-xs whitespace-nowrap text-on-surface-variant bg-surface-container-lowest"
        >
          {language === 'al' ? '4. Recetat (20)' : '4. Prescriptions'}
        </button>
      </div>
    </header>
  );
};
