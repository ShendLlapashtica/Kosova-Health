import React, { useState } from 'react';
import { BiomarkerData, Language } from '../types';
import { MAP_SNIPPET_URL } from '../data/mockData';

interface DeficiencyDiagramsProps {
  biomarkers: BiomarkerData;
  language: Language;
  onNavigateToPharmacies: () => void;
  onOpenPrescriptions: () => void;
}

export const DeficiencyDiagrams: React.FC<DeficiencyDiagramsProps> = ({
  biomarkers,
  language,
  onNavigateToPharmacies,
  onOpenPrescriptions,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(6);

  // Dynamic calculations based on live biomarkers
  const isMgCritical = biomarkers.mg < 1.6;
  const isVitdDeficient = biomarkers.vitd < 20;
  const isCaMild = biomarkers.ca < 8.5;

  // Percentage calculations for pin positions on gauge tracks
  // Mg: range 0.8 to 3.0 (width 2.2)
  const mgPercent = Math.min(95, Math.max(5, ((biomarkers.mg - 0.8) / (3.0 - 0.8)) * 100));

  // Vit D: range 10 to 80 (width 70)
  const vitdPercent = Math.min(95, Math.max(5, ((biomarkers.vitd - 10) / (80 - 10)) * 100));

  // Calcium: range 7.0 to 11.0 (width 4.0)
  const caPercent = Math.min(95, Math.max(5, ((biomarkers.ca - 7.0) / (11.0 - 7.0)) * 100));

  // 7-Day Trend data
  const trendDays = [
    { day: '06 May', bp: 128, pulse: 72 },
    { day: '07 May', bp: 130, pulse: 75 },
    { day: '08 May', bp: 135, pulse: 80 },
    { day: '09 May', bp: 131, pulse: 76 },
    { day: '10 May', bp: 136, pulse: 82 },
    { day: '11 May', bp: 133, pulse: 77 },
    { day: '12 May (Today)', bp: biomarkers.bpSys, pulse: biomarkers.pulse },
  ];

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 gap-6">
      {/* Top Clinical Overview Bar */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-sm border border-surface-container-high/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none"></div>

        {/* Health Score Block */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
              <circle
                className="text-surface-container-highest"
                cx="36"
                cy="36"
                fill="none"
                r="30"
                stroke="currentColor"
                strokeWidth="6"
              />
              <circle
                className="text-tertiary-container transition-all duration-700"
                cx="36"
                cy="36"
                fill="none"
                r="30"
                stroke="currentColor"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 - (188.5 * 74) / 100}
                strokeLinecap="round"
                strokeWidth="6"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-headline-md text-2xl font-bold text-on-surface leading-none">
                74
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                {language === 'al' ? 'Gjendja e Përgjithshme' : 'Overall Health Status'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface tracking-tight truncate">
              {language === 'al' ? 'Kërkohet Vëmendje Mesatare' : 'Moderate Attention Needed'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {language === 'al'
                ? '3 biomarkerë nën pragjet bazë klinike'
                : '3 biomarkers under baseline thresholds'}
            </p>
          </div>
        </div>

        {/* Hemodynamic Vitals */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/50 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                cardiology
              </span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                {language === 'al' ? 'Tensioni & Pulsi' : 'Blood Pressure & Pulse'}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-base font-bold text-on-surface">
                  {biomarkers.bpSys}/{biomarkers.bpDia}
                </span>
                <span className="text-xs text-on-surface-variant">mmHg</span>
                <span className="text-on-surface-variant opacity-40 mx-1">|</span>
                <span className="font-mono text-base font-bold text-on-surface">{biomarkers.pulse}</span>
                <span className="text-xs text-on-surface-variant">bpm</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-8 bg-surface-container-highest"></div>

          <div className="flex flex-col justify-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              {language === 'al' ? 'Pre-hipertension' : 'Pre-hypertensive'}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Slightly elevated diastolic</span>
          </div>
        </div>

        {/* Laboratory Provenance */}
        <div className="flex flex-col lg:items-end justify-center shrink-0">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[15px] text-primary">biotech</span>
            {language === 'al' ? 'Raport i Certifikuar' : 'Authorized Certified Report'}
          </div>
          <div className="text-sm font-bold text-on-surface mt-0.5">Avicena Lab Prishtina</div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">event_available</span>
            <span>Sample Collected: 12 May 2024</span>
          </div>
        </div>
      </div>

      {/* Main Content Columns: Diagnostics Left (8 cols) & Action Protocol Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Diagnostic & Deficiency Spectrum Diagrams */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {language === 'al' ? 'SPEKTROMETRIA BIOKIMIKE' : 'BIOCHEMICAL SPECTROMETRY'}
              </span>
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-0.5">
                {language === 'al' ? 'Diagramet e Spektrit të Deficiteve' : 'Deficiency Spectrum Diagrams'}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full self-start sm:self-auto border border-surface-container-high/40">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-container"></span>
              <span>Reference: NCCLS Guidelines 2024</span>
            </div>
          </div>

          {/* Biomarker Gauge Card 1: Magnesium */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow border border-surface-container-high/60 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-error shrink-0">
                  <span className="material-symbols-outlined text-[24px]">electric_bolt</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">Magnesium (Serum Mg²⁺)</h3>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold uppercase">
                      {isMgCritical ? 'CRITICAL LOW' : 'OPTIMAL'}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant">Cellular neuro-muscular stabilizer</div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 sm:text-right">
                <span className="font-mono text-2xl font-bold text-error leading-none">
                  {biomarkers.mg}
                </span>
                <span className="font-mono text-xs text-on-surface-variant">mg/dL</span>
                <span className="text-xs text-on-surface-variant ml-2">(Target: 1.8 – 2.4)</span>
              </div>
            </div>

            {/* Color Gauge Track */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="relative w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                <div className="h-full w-[25%] bg-error/90" title="Deficient (< 1.6 mg/dL)"></div>
                <div className="h-full w-[20%] bg-amber-400" title="Borderline (1.6 - 1.8 mg/dL)"></div>
                <div className="h-full w-[40%] bg-primary-container" title="Optimal Range (1.8 - 2.4 mg/dL)"></div>
                <div className="h-full w-[15%] bg-amber-500" title="Elevated (> 2.4 mg/dL)"></div>
              </div>

              {/* Position Pin Indicator */}
              <div className="relative w-full h-4">
                <div
                  className="absolute -top-3 flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${mgPercent}%` }}
                >
                  <span className="material-symbols-outlined text-[18px] text-error leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_drop_up
                  </span>
                  <span className="text-[10px] text-error font-mono font-bold leading-none -mt-1">
                    Current: {biomarkers.mg}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-on-surface-variant uppercase px-1 font-mono">
                <span>0.8 (Severe)</span>
                <span className="pl-4">1.6 Borderline</span>
                <span className="text-primary font-bold">1.8 Optimal 2.4</span>
                <span>3.0 High</span>
              </div>
            </div>

            {/* Clinical Insight Banner */}
            <div className="p-3.5 rounded-lg bg-surface-container-low flex items-start gap-3 text-on-surface border border-surface-container-high/40 text-xs">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">report_problem</span>
              <div className="leading-relaxed">
                <strong className="text-on-surface font-bold">Muscle cramps & sleep disturbance indicator: </strong>
                Current hypomagnesemia explains acute nocturnal calf contractions, hyperexcitability, and non-restorative sleep patterns. Immediate chelated oral replacement advised.
              </div>
            </div>
          </div>

          {/* Biomarker Gauge Card 2: Vitamin D3 */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow border border-surface-container-high/60 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-tertiary-container shrink-0">
                  <span className="material-symbols-outlined text-[24px]">wb_sunny</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">Vitamin D3 (25-OH Cholecalciferol)</h3>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold uppercase">
                      {isVitdDeficient ? 'DEFICIENT' : 'OPTIMAL'}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant">Bone mineralisation & immune modulator</div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 sm:text-right">
                <span className="font-mono text-2xl font-bold text-error leading-none">
                  {biomarkers.vitd}
                </span>
                <span className="font-mono text-xs text-on-surface-variant">ng/mL</span>
                <span className="text-xs text-on-surface-variant ml-2">(Target: 30.0 – 60.0)</span>
              </div>
            </div>

            {/* Color Gauge Track */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="relative w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                <div className="h-full w-[25%] bg-error/90" title="Severe Deficiency (< 20 ng/mL)"></div>
                <div className="h-full w-[20%] bg-amber-400" title="Insufficiency (20 - 30 ng/mL)"></div>
                <div className="h-full w-[45%] bg-primary-container" title="Optimal Range (30 - 70 ng/mL)"></div>
                <div className="h-full w-[10%] bg-amber-500" title="Excess (> 70 ng/mL)"></div>
              </div>

              {/* Position Pin Indicator */}
              <div className="relative w-full h-4">
                <div
                  className="absolute -top-3 flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${vitdPercent}%` }}
                >
                  <span className="material-symbols-outlined text-[18px] text-error leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_drop_up
                  </span>
                  <span className="text-[10px] text-error font-mono font-bold leading-none -mt-1">
                    Current: {biomarkers.vitd}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-on-surface-variant uppercase px-1 font-mono">
                <span>10 (Severe)</span>
                <span>20 Insufficient</span>
                <span className="text-primary font-bold">30 Optimal 60</span>
                <span>80 Excess</span>
              </div>
            </div>

            {/* Clinical Insight */}
            <div className="p-3.5 rounded-lg bg-surface-container-low flex items-start gap-3 text-on-surface border border-surface-container-high/40 text-xs">
              <span className="material-symbols-outlined text-[20px] text-tertiary-container shrink-0 mt-0.5">wb_twilight</span>
              <div className="leading-relaxed">
                <strong className="text-on-surface font-bold">Insufficient UV synthesis: </strong>
                Persistent indoor work patterns in Prishtina during transitional seasons have curtailed endogenous epidermal synthesis. Impairs intestinal calcium absorption capacity.
              </div>
            </div>
          </div>

          {/* Biomarker Gauge Card 3: Calcium & Hydrocyclin Synergy */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow border border-surface-container-high/60 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">shield</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">Calcium (Total Serum Ca²⁺)</h3>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase">
                      {isCaMild ? 'MILD LOW' : 'OPTIMAL'}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant">Antibiotic Chelation Sensitivity</div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 sm:text-right">
                <span className="font-mono text-2xl font-bold text-on-surface leading-none">
                  {biomarkers.ca}
                </span>
                <span className="font-mono text-xs text-on-surface-variant">mg/dL</span>
                <span className="text-xs text-on-surface-variant ml-2">(Target: 8.5 – 10.2)</span>
              </div>
            </div>

            {/* Color Gauge Track */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="relative w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                <div className="h-full w-[20%] bg-error/90"></div>
                <div className="h-full w-[20%] bg-amber-400"></div>
                <div className="h-full w-[45%] bg-primary-container"></div>
                <div className="h-full w-[15%] bg-amber-500"></div>
              </div>

              {/* Position Pin Indicator */}
              <div className="relative w-full h-4">
                <div
                  className="absolute -top-3 flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${caPercent}%` }}
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-600 leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_drop_up
                  </span>
                  <span className="text-[10px] text-amber-600 font-mono font-bold leading-none -mt-1">
                    Current: {biomarkers.ca}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-on-surface-variant uppercase px-1 font-mono">
                <span>7.0 Hypocalcemia</span>
                <span>8.4 Borderline</span>
                <span className="text-primary font-bold">8.5 Target 10.2</span>
                <span>11.0 High</span>
              </div>
            </div>

            {/* Drug Interaction Notice */}
            <div className="p-3.5 rounded-lg bg-surface-container-high/60 flex items-start gap-3 text-on-surface border border-surface-container-high text-xs">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">medication</span>
              <div className="leading-relaxed">
                <strong className="text-on-surface font-bold">Hydrocyclin / Tetracycline Synergy Notice: </strong>
                Co-administration of multivalent cations (calcium supplements or dairy) within 2.5 hours of hydrocyclin binds the molecule into insoluble chelates, reducing antibiotic bioavailability by up to 68%. Separate ingestion intervals.
              </div>
            </div>
          </div>

          {/* 7-Day Pulse & BP Variance Visual Chart */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-on-surface">7-Day Hemodynamic Variance Trend</h3>
                <p className="text-xs text-on-surface-variant">Continuous ambulatory telemetry logged via KosovaHealth monitor</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span> Systolic BP (mmHg)
                </span>
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span> Pulse (bpm)
                </span>
              </div>
            </div>

            {/* SVG Wave graphic */}
            <div className="w-full h-48 sm:h-56 relative pt-2">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 700 180">
                <defs>
                  <linearGradient id="cyanGradientArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="tealGradientArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#008378" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#008378" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line opacity="0.3" stroke="#bcc9c6" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="700" y1="30" y2="30" />
                <line opacity="0.3" stroke="#bcc9c6" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="700" y1="80" y2="80" />
                <line opacity="0.3" stroke="#bcc9c6" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="700" y1="130" y2="130" />

                {/* Systolic Fill & Line (Teal) */}
                <path d="M 0 65 Q 110 40 230 75 T 460 50 T 700 55 L 700 180 L 0 180 Z" fill="url(#tealGradientArea)" />
                <path d="M 0 65 Q 110 40 230 75 T 460 50 T 700 55" stroke="#008378" strokeLinecap="round" strokeWidth="2.5" />

                {/* Pulse Fill & Curve (Cyan) */}
                <path d="M 0 120 Q 120 100 240 135 T 480 110 T 700 115 L 700 180 L 0 180 Z" fill="url(#cyanGradientArea)" />
                <path d="M 0 120 Q 120 100 240 135 T 480 110 T 700 115" stroke="#008096" strokeLinecap="round" strokeWidth="2" />

                {/* Clickable/Hoverable Data Markers */}
                <circle cx="230" cy="75" fill="#008378" r="4" className="cursor-pointer hover:r-6 transition-all" />
                <circle cx="460" cy="50" fill="#008378" r="4" className="cursor-pointer hover:r-6 transition-all" />
                <circle cx="700" cy="55" fill="#008378" r="5" className="cursor-pointer hover:r-6 transition-all" />

                <circle cx="240" cy="135" fill="#008096" r="3.5" className="cursor-pointer hover:r-5 transition-all" />
                <circle cx="480" cy="110" fill="#008096" r="3.5" className="cursor-pointer hover:r-5 transition-all" />
                <circle cx="700" cy="115" fill="#008096" r="4.5" className="cursor-pointer hover:r-5 transition-all" />
              </svg>

              {/* Horizontal Axis Labels */}
              <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2 border-t border-surface-container-high/40">
                {trendDays.map((td, idx) => (
                  <span
                    key={td.day}
                    onMouseEnter={() => setHoveredDay(idx)}
                    className={`cursor-pointer transition-colors ${
                      hoveredDay === idx ? 'font-bold text-primary' : ''
                    }`}
                  >
                    {td.day}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-on-surface-variant pt-1 gap-1">
              <span>Average systolic: 131.4 mmHg (+4% vs baseline)</span>
              <span>Pulse variability: Normal Sinus (SDNN: 48ms)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptive Daily Protocol & Lifestyle Guidance Cards */}
        <div className="lg:col-span-4 flex flex-col gap-5 sticky top-20">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
              {language === 'al' ? 'PLANI I NDËRHYRJES' : 'INTERVENTION ROADMAP'}
            </span>
            <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              {language === 'al' ? 'Protokolli i Veprimeve të Përshkruara' : 'Prescriptive Action Protocol'}
            </h2>
          </div>

          {/* Protocol Card 1: Sunlight & D3 Synthesis */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high/60 flex flex-col gap-2.5 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[22px]">sunny</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant text-[10px] font-bold uppercase">
                TODAY: UV 6 (OPTIMAL)
              </span>
            </div>
            <h4 className="text-base font-bold text-on-surface">Direct Sunlight Protocol</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Expose arms & face for <strong>20–25 mins</strong> between <strong>10:00 – 13:00</strong> in Prishtina UV conditions. Enhances non-enzymatic pre-vitamin D3 conversion without sunscreen barrier during this limited safe window.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-tertiary font-semibold pt-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Best window today: 11:15 AM – 11:40 AM</span>
            </div>
          </div>

          {/* Protocol Card 2: Blood Pressure & Pulse Calming */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high/60 flex flex-col gap-2.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">directions_walk</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">
                PARASYMPATHETIC RESET
              </span>
            </div>
            <h4 className="text-base font-bold text-on-surface">BP & Pulse Calming Pathway</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Prioritize potassium-rich mineral hydration and limit sodium. Complete a <strong>30-minute light aerobic walk</strong> in <em>Germia Park</em> or <em>Taukbahçe</em> to dampen vascular sympathetic tone and lower peripheral resistance.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold pt-1">
              <span className="material-symbols-outlined text-[16px]">forest</span>
              <span>Suggested venue: Germia Valley Trail (Zone 1 HR)</span>
            </div>
          </div>

          {/* Protocol Card 3: Clinical Supplements Breakdown */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">medication_liquid</span>
                <h4 className="text-sm font-bold text-on-surface">Recommended Clinical Regimen</h4>
              </div>
              <button
                type="button"
                onClick={onOpenPrescriptions}
                className="text-[10px] font-bold text-primary hover:underline uppercase"
              >
                View 20 Items
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {/* Supplement 1 */}
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Magnesium Bisglycinate</span>
                  <span className="font-mono text-xs text-primary font-bold">300mg</span>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  Elemental bioavailable chelate. Take 1 hr prior to sleep.
                </span>
              </div>

              {/* Supplement 2 */}
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Calcium Citrate + D3 + K2</span>
                  <span className="font-mono text-xs text-primary font-bold">500mg / 2000IU</span>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  Synergistic vascular & skeletal matrix. Take with mid-day meal.
                </span>
              </div>

              {/* Supplement 3 */}
              <div className="p-3 rounded-lg bg-surface-container-highest flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Hydrocyclin Oversight</span>
                  <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-[9px] font-bold">
                    RX NOTICE
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  Keep 3-hour window clear of dairy, antacids, and mineral supplements. Consult prescribing physician Dr. Gashi.
                </span>
              </div>
            </div>

            {/* Prishtina Map Context Snippet */}
            <div className="w-full flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Nearest Stocked Pharmacy</span>
                <span className="text-primary font-bold">450m away</span>
              </div>
              <div
                className="w-full h-24 rounded-lg bg-cover bg-center relative overflow-hidden flex items-end p-2 border border-surface-container-high shadow-xs"
                style={{ backgroundImage: `url(${MAP_SNIPPET_URL})` }}
              >
                <div className="relative z-10 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-on-surface flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-primary">local_pharmacy</span>
                  <span>Barnatore Rexall • Dardania Blloku 7 (Open 24/7)</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={onNavigateToPharmacies}
              className="w-full py-3 px-4 rounded-lg bg-primary text-on-primary text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md hover:bg-primary-container transition-all active:scale-[0.98] group mt-1"
            >
              <span>{language === 'al' ? 'Gjej në Barnatoret e Prishtinës Tani' : 'Find in Prishtina Pharmacies Now'}</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
