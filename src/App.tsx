import { useEffect, useState } from 'react';
import type { LabSource } from './components/PickedForYou';
import { TabType, Language, BiomarkerData } from './types';
import { INITIAL_BIOMARKERS } from './data/mockData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LabBiomarkersInput } from './components/LabBiomarkersInput';
import { PharmacyFinder } from './components/PharmacyFinder';
import { SafeShopping } from './components/SafeShopping';

const load = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable — state still works for this visit */
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [language, setLanguage] = useState<Language>(() => load('kh.lang', 'al'));
  useEffect(() => save('kh.lang', language), [language]);
  const [biomarkers, setBiomarkers] = useState<BiomarkerData>(() => load('kh.biomarkers', INITIAL_BIOMARKERS));
  const [labSource, setLabSource] = useState<LabSource | null>(() => load('kh.labSource', null));
  useEffect(() => save('kh.biomarkers', biomarkers), [biomarkers]);
  useEffect(() => save('kh.labSource', labSource), [labSource]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Main Content Area */}
      <main className="w-full pt-20 flex-1">
        {activeTab === 'shop' && (
          <SafeShopping
            language={language}
            onNotification={showNotification}
            biomarkers={biomarkers}
            setBiomarkers={setBiomarkers}
            labSource={labSource}
            setLabSource={setLabSource}
          />
        )}

        {activeTab === 'input' && (
          <LabBiomarkersInput
            biomarkers={biomarkers}
            setBiomarkers={setBiomarkers}
            language={language}
            onGoToFoods={() => {
              setActiveTab('shop');
              setTimeout(() => document.getElementById('picked-for-you')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
            }}
            labSource={labSource}
            onNotification={showNotification}
            onReportLoaded={(r) => setLabSource({ fileName: r.fileName, date: r.sampleDate })}
          />
        )}

        {activeTab === 'pharmacies' && (
          <PharmacyFinder
            language={language}
            onNotification={showNotification}
          />
        )}
      </main>

      {/* Footer */}
      <Footer language={language} />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 border border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
              check_circle
            </span>
            <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
