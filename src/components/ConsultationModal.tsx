import React, { useState } from 'react';
import { BiomarkerData, PatientProfile, Language } from '../types';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  biomarkers: BiomarkerData;
  language: Language;
  onSuccess: (message: string) => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  patient,
  biomarkers,
  language,
  onSuccess,
}) => {
  const [selectedSlot, setSelectedSlot] = useState('Sot, 14:30');
  const [urgency, setUrgency] = useState('urgent');
  const [notes, setNotes] = useState('Ngërçe muskulore të përsëritura në këmbë gjatë natës dhe lodhje kronike.');

  if (!isOpen) return null;

  const handleSchedule = () => {
    onSuccess(
      language === 'al'
        ? `Kërkesa për telekonsultë u dërgua te Dr. Arben Krasniqi për terminin: ${selectedSlot}!`
        : `Consultation request successfully transmitted to Dr. Arben Krasniqi for ${selectedSlot}!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">stethoscope</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg text-on-surface font-bold">
                {language === 'al' ? 'Telekonsultë Mjekësore' : 'Doctor Consultation'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {language === 'al'
                  ? 'Transmetim i të dhënave klinike për Dr. Arben Krasniqi'
                  : 'Telemedicine dispatch for Shend Llapashtica'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Patient & Biomarker Telemetry Summary */}
        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">{language === 'al' ? 'Mjeku Specialist:' : 'Physician:'}</span>
            <span className="font-semibold text-primary">Dr. Arben Krasniqi (QKUK Qendror)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">{language === 'al' ? 'Pacienti:' : 'Patient:'}</span>
            <span className="font-semibold text-on-surface">
              {patient.name} ({patient.age} vjeç) • {patient.city}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">{language === 'al' ? 'Flamujt e Deficitit:' : 'Deficit Flags:'}</span>
            <span className="text-error font-bold">
              Mg ({biomarkers.mg} mg/dL) & Vit D3 ({biomarkers.vitd} ng/mL)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">{language === 'al' ? 'Vitalet:' : 'Vitals:'}</span>
            <span className="text-on-surface font-mono font-medium">
              181cm, {patient.weightKg}kg, BMI {(patient.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1)}, BP {biomarkers.bpSys}/{biomarkers.bpDia}
            </span>
          </div>
        </div>

        {/* Schedule Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
            {language === 'al' ? 'Zgjidh Terminin për Video Thirrje:' : 'Select Video Call Slot:'}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {['Sot, 14:30', 'Sot, 17:00', 'Nesër, 09:30'].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition-all ${
                  selectedSlot === slot
                    ? 'border-primary bg-primary-container text-on-primary-container shadow-sm'
                    : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
            {language === 'al' ? 'Niveli i Prioritetit:' : 'Priority Level:'}
          </label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setUrgency('urgent')}
              className={`flex-1 py-1.5 rounded-lg border font-medium flex items-center justify-center gap-1 ${
                urgency === 'urgent'
                  ? 'bg-error-container border-error text-on-error-container'
                  : 'bg-surface-container-lowest border-surface-container text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              <span>{language === 'al' ? 'Urgjente (Deficit Akut)' : 'Urgent (Acute Deficit)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setUrgency('routine')}
              className={`flex-1 py-1.5 rounded-lg border font-medium flex items-center justify-center gap-1 ${
                urgency === 'routine'
                  ? 'bg-primary-container border-primary text-on-primary-container'
                  : 'bg-surface-container-lowest border-surface-container text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">event</span>
              <span>{language === 'al' ? 'Rutinor' : 'Routine Check'}</span>
            </button>
          </div>
        </div>

        {/* Symptoms Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
            {language === 'al' ? 'Simptomat e raportuara nga pacienti:' : 'Patient Clinical Notes:'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-surface-container-low border border-surface-container focus:bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-high">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors"
          >
            {language === 'al' ? 'Anulo' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">video_call</span>
            <span>{language === 'al' ? 'Konfirmo Konsultën me Dr. Krasniqin' : 'Schedule Clinical Review'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
