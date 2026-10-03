import React, { useState } from 'react';
import { LOGO_URL } from '../data/mockData';
import { Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLoginSuccess: (name: string, role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onLoginSuccess,
}) => {
  const [role, setRole] = useState<'patient' | 'clinic'>('patient');
  const [identifier, setIdentifier] = useState('1012345678');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'patient') {
      onLoginSuccess('Shend Llapashtica', 'patient');
    } else {
      onLoginSuccess('Dr. Arta Gashi', 'clinic');
    }
    onClose();
  };

  const handleQuickBypass = () => {
    setIdentifier('1012345678');
    setPassword('Pass123.');
    onLoginSuccess('Shend Llapashtica', 'patient');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Left Auth Panel (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between relative z-10 bg-surface-container-lowest">
            <div>
              {/* Header & Logo */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={LOGO_URL}
                    alt="KosovaHealth Logo"
                    className="h-9 w-auto object-contain rounded-lg"
                  />
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-lg text-on-surface tracking-tight leading-none">
                      KosovaHealth
                    </span>
                    <span className="font-body-sm text-outline text-[11px] tracking-wider uppercase mt-1">
                      {language === 'al' ? 'Platforma Kombëtare Shëndetësore' : 'National Healthcare Platform'}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-primary text-xs font-label-tag">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                  <span>{language === 'al' ? 'Sistemi i Sigurt' : 'Secured Portal'}</span>
                </div>
              </div>

              {/* Role Toggle */}
              <div className="bg-surface-container-low p-1 rounded-xl flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setRole('patient');
                    setIdentifier('1012345678');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    role === 'patient'
                      ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                  <span>{language === 'al' ? 'Hyrja e Pacientit' : 'Patient Sign In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('clinic');
                    setIdentifier('LIC-2024-PR');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    role === 'clinic'
                      ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                  <span>{language === 'al' ? 'Portali i Klinikave & Lab' : 'Clinic & Lab Portal'}</span>
                </button>
              </div>

              {/* Greeting Header */}
              <div className="mb-5">
                <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {role === 'patient'
                    ? (language === 'al' ? 'Mirësevini përsëri' : 'Welcome Back')
                    : (language === 'al' ? 'Portali i Institucioneve' : 'Clinical Provider Portal')}
                </h1>
                <p className="text-xs sm:text-sm text-outline mt-1">
                  {role === 'patient'
                    ? (language === 'al'
                        ? 'Identifikohuni me Numrin tuaj Personal të Kosovës ose emailin e regjistruar.'
                        : 'Sign in with your Kosova Personal ID or registered laboratory email.')
                    : (language === 'al'
                        ? 'Akses i autorizuar për Spitale, Poliklinika dhe Laboratorë Diagnostikë.'
                        : 'Authorized access for certified diagnostic clinics and hospitals.')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {role === 'patient'
                      ? (language === 'al' ? 'NUMRI PERSONAL OSE EMAIL' : 'PERSONAL ID OR EMAIL')
                      : (language === 'al' ? 'NUMRI I LICENCËS / EMAIL ZYRTAR' : 'LICENSE ID / OFFICIAL EMAIL')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                      badge
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'patient' ? 'p.sh. 1012345678' : 'p.sh. LIC-2024-PR'}
                      className="w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-lg text-on-surface text-sm placeholder:text-outline-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {language === 'al' ? 'FJALËKALIMI' : 'PASSWORD'}
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('U dërgua kodi i rivendosjes me SMS te numri i lidhur me Numrin Personal.')}
                      className="text-xs text-primary hover:underline"
                    >
                      {language === 'al' ? 'Keni harruar fjalëkalimin?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-surface-container-low pl-10 pr-10 py-2.5 rounded-lg text-on-surface text-sm placeholder:text-outline-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                    />
                    <span className="text-xs text-on-surface-variant select-none">
                      {language === 'al' ? 'Më mbaj mend në këtë pajisje' : 'Remember me on this device'}
                    </span>
                  </label>
                  <span className="text-[10px] font-bold text-outline bg-surface-container px-2 py-0.5 rounded-full uppercase">
                    {role === 'patient' ? 'PATIENT PORTAL' : 'LICENSED CLINICAL'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-lg font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 group mt-2"
                >
                  <span>{language === 'al' ? 'Hyr në Portalin Shëndetësor' : 'Sign In to Health Portal'}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>

                <div className="pt-2 flex items-center justify-between text-xs text-outline">
                  <div>
                    <span>{language === 'al' ? 'I ri në KosovaHealth?' : 'New to KosovaHealth?'}</span>
                    <button
                      type="button"
                      onClick={() => alert('Regjistrimi me Numër Personal të Kosovës kërkon verifikim në QKUK ose laborator të autorizuar.')}
                      className="font-bold text-primary hover:underline ml-1"
                    >
                      {language === 'al' ? 'Krijo llogari pa pagesë' : 'Create free account'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickBypass}
                    className="font-mono text-secondary hover:underline font-bold"
                  >
                    Demo Fast Access
                  </button>
                </div>
              </form>
            </div>

            {/* Compliance Footnote */}
            <div className="pt-4 mt-4 border-t border-surface-container-high/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-outline">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[16px]">security</span>
                <span>Ligji Nr. 06/L-082 për Mbrojtjen e të Dhënave (GDPR/HIPAA)</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 256-bit AES
                </span>
                <span>QKUK & Agjencia e Barnave</span>
              </div>
            </div>
          </div>

          {/* Right Clinical Telemetry Panel (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-primary via-primary-container to-tertiary text-on-primary p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-tertiary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-primary-fixed mb-4">
                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
                {language === 'al' ? 'Rrjeti Kombëtar i Diagnostikës' : 'National Diagnostics Network'}
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight mb-2 text-white">
                Empowering health tracking in Kosova.
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
                Real-time biomarker analysis, encrypted lab panels, and instantaneous local pharmacy stock availability in Prishtinë, Prizren, and Pejë.
              </p>
            </div>

            {/* Live Metric Simulation Widget */}
            <div className="relative z-10 my-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-fixed text-[18px]">
                    monitor_heart
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {language === 'al' ? 'Ekzaminimi i Fundit • Laboratori Qendror' : 'Latest Check • Central Lab'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/20 text-secondary-fixed text-[10px] font-bold">
                  OPTIMAL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 p-2 rounded-lg">
                  <span className="block text-[10px] text-white/70">Hemoglobina A1c</span>
                  <span className="font-mono text-base font-bold text-white">5.4 <span className="text-[10px] font-normal text-white/70">%</span></span>
                  <div className="w-full bg-white/20 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-primary-fixed h-full rounded-full" style={{ width: '48%' }}></div>
                  </div>
                </div>

                <div className="bg-white/10 p-2 rounded-lg">
                  <span className="block text-[10px] text-white/70">Vitamina D3</span>
                  <span className="font-mono text-base font-bold text-white">42.8 <span className="text-[10px] font-normal text-white/70">ng/mL</span></span>
                  <div className="w-full bg-white/20 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-secondary-fixed h-full rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5 border-t border-white/10">
                <span className="flex items-center gap-1 text-white/90 text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">
                    location_on
                  </span>
                  Farmacia Dardania (Prishtinë)
                </span>
                <span className="text-primary-fixed text-[11px] font-mono font-semibold">
                  {language === 'al' ? 'Barnat gati' : 'Meds ready'}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-1 text-white/70 text-[11px]">
              <span>Ministria e Shëndetësisë e Kosovës</span>
              <span>Versioni 3.4.2-rel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
