import { useState } from 'react';
import { TabType, Language, BiomarkerData, PatientProfile } from './types';
import { INITIAL_PATIENT, INITIAL_BIOMARKERS } from './data/mockData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LabBiomarkersInput } from './components/LabBiomarkersInput';
import { DeficiencyDiagrams } from './components/DeficiencyDiagrams';
import { PharmacyFinder } from './components/PharmacyFinder';
import { AuthModal } from './components/AuthModal';
import { ConsultationModal } from './components/ConsultationModal';
import { PrescriptionDrawer } from './components/PrescriptionDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [language, setLanguage] = useState<Language>('al');
  const [patient, setPatient] = useState<PatientProfile>(INITIAL_PATIENT);
  const [biomarkers, setBiomarkers] = useState<BiomarkerData>(INITIAL_BIOMARKERS);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isPrescriptionsOpen, setIsPrescriptionsOpen] = useState(false);
  const [isDoctorView, setIsDoctorView] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleLoginSuccess = (name: string, role: string) => {
    if (role === 'clinic') {
      setIsDoctorView(true);
      showNotification(`Identifikuar si ${name} (Klinika Qendrore / Avicena Lab)!`);
    } else {
      setIsDoctorView(false);
      setPatient((prev) => ({ ...prev, name }));
      showNotification(`Mirësevini ${name}! Të dhënat tuaja u sinkronizuan.`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        patient={patient}
        onOpenAuth={() => setIsAuthOpen(true)}
        isDoctorView={isDoctorView}
        setIsDoctorView={setIsDoctorView}
        onOpenPrescriptions={() => setIsPrescriptionsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="w-full pt-20 flex-1">
        {activeTab === 'input' && (
          <LabBiomarkersInput
            biomarkers={biomarkers}
            setBiomarkers={setBiomarkers}
            patient={patient}
            language={language}
            onNavigateToDiagrams={() => setActiveTab('diagrams')}
            onOpenConsultation={() => setIsConsultationOpen(true)}
            onNotification={showNotification}
          />
        )}

        {activeTab === 'diagrams' && (
          <DeficiencyDiagrams
            biomarkers={biomarkers}
            language={language}
            onNavigateToPharmacies={() => setActiveTab('pharmacies')}
            onOpenPrescriptions={() => setIsPrescriptionsOpen(true)}
          />
        )}

        {activeTab === 'pharmacies' && (
          <PharmacyFinder
            language={language}
            onOpenPrescriptions={() => setIsPrescriptionsOpen(true)}
            onNotification={showNotification}
          />
        )}
      </main>

      {/* Footer */}
      <Footer language={language} />

      {/* Auth Modal (Screen 4) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Doctor Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        patient={patient}
        biomarkers={biomarkers}
        language={language}
        onSuccess={showNotification}
      />

      {/* 20 Prescriptions Full Drawer Modal */}
      <PrescriptionDrawer
        isOpen={isPrescriptionsOpen}
        onClose={() => setIsPrescriptionsOpen(false)}
        language={language}
        onReserveSuccess={showNotification}
      />

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
