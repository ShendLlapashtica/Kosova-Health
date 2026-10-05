import React, { useEffect, useRef, useState } from 'react';
import { BiomarkerData, Language } from '../types';
import { BENCHMARK_NORMALS } from '../data/mockData';
import { ResultsDiagram } from './ResultsDiagram';
import {
  BIOMARKER_META,
  BiomarkerKey,
  LabReportResult,
  grade,
  loadPdfReader,
  parseLabLines,
  parseLabReport,
} from '../lib/labReport';

const SAMPLE_REPORT_URL = '/sample-lab-report.pdf';

interface LabBiomarkersInputProps {
  biomarkers: BiomarkerData;
  setBiomarkers: React.Dispatch<React.SetStateAction<BiomarkerData>>;
  language: Language;
  onGoToFoods: () => void;
  labSource?: { fileName: string; date?: string } | null;
  onNotification: (msg: string) => void;
  onReportLoaded?: (r: LabReportResult) => void;
}

export const LabBiomarkersInput: React.FC<LabBiomarkersInputProps> = ({
  biomarkers,
  setBiomarkers,
  language,
  onGoToFoods,
  labSource,
  onNotification,
  onReportLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'ocr' | 'csv' | 'manual'>('ocr');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [report, setReport] = useState<LabReportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Read a lab report (PDF, or CSV from the CSV tab), push the values into the app state.
  const handleFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isCsv = /\.csv$/i.test(file.name);
    if (!isPdf && !isCsv) {
      onNotification(
        language === 'al'
          ? `"${file.name}" nuk është PDF. Ngarko raportin laboratorik në PDF.`
          : `"${file.name}" is not a PDF. Please upload the lab report as a PDF.`
      );
      return;
    }

    setActiveTab(isPdf ? 'ocr' : 'csv');
    setIsProcessingFile(true);
    const minDelay = new Promise((r) => setTimeout(r, 700)); // let the scan state register
    try {
      const result: LabReportResult = isPdf
        ? await parseLabReport(file)
        : await file.text().then((text) => {
            const lines = text.split(/\r?\n/).map((l) => l.replace(/[,;\t_]/g, '  '));
            return { fileName: file.name, pages: 1, lineCount: lines.length, ...parseLabLines(lines) };
          });
      await minDelay;

      if (result.values.length === 0) {
        setReport(result);
        onNotification(
          language === 'al'
            ? `Nuk u gjet asnjë parametër i njohur në "${file.name}". A është PDF me tekst (jo skanim)?`
            : `No known biomarkers found in "${file.name}". Is it a text PDF (not a scan)?`
        );
        return;
      }

      setBiomarkers((prev) => ({
        ...prev,
        ...Object.fromEntries(result.values.map((v) => [v.key, v.value])),
      }));
      setReport(result);
      onReportLoaded?.(result);
      const count = result.values.filter((v) => v.key !== 'bpDia').length;
      onNotification(
        language === 'al'
          ? `U lexuan ${count} parametra nga "${file.name}" — shiko rezultatet më poshtë.`
          : `Read ${count} biomarkers from "${file.name}" — see your results below.`
      );
      setTimeout(() => document.getElementById('results-diagram')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (err) {
      await minDelay;
      console.error('Lab report parse failed', err);
      onNotification(
        language === 'al'
          ? `"${file.name}" nuk mund të lexohej. Provo një PDF tjetër.`
          : `Couldn't read "${file.name}". Try another PDF.`
      );
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow dropping the same file again
    if (file) void handleFile(file);
  };

  // Accept a dropped report anywhere on the page, so a near-miss doesn't make the
  // browser navigate away to the PDF mid-presentation.
  const handleFileRef = useRef(handleFile);
  handleFileRef.current = handleFile;
  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false;
    // dragover fires every ~50ms while a file hovers the page; when it stops
    // (drop, Esc, left the window) the overlay hides itself.
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setIsDragging(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setIsDragging(false), 300);
      void loadPdfReader();
    };
    const onDrop = (e: DragEvent) => {
      clearTimeout(hideTimer);
      setIsDragging(false);
      if (!hasFiles(e)) return;
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file) void handleFileRef.current(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  const t = (al: string, en: string) => (language === 'al' ? al : en);
  const shownValues = report?.values.filter((v) => v.key !== 'bpDia') ?? [];
  const missingKeys = report
    ? (Object.keys(BIOMARKER_META) as BiomarkerKey[]).filter(
        (k) => k !== 'bpDia' && !report.values.some((v) => v.key === k)
      )
    : [];

  const handleLoadNormals = () => {
    setBiomarkers(BENCHMARK_NORMALS);
    onNotification(
      language === 'al'
        ? 'U ngarkuan vlerat standarde të referencës së Prishtinës (QKUK)!'
        : 'Loaded Kosovo National Reference benchmark normal values!'
    );
  };

  const handleDownloadCsv = () => {
    const csvContent =
      'PARAM_NAME,QUANT_VAL,UNIT_MEASURE,REF_LOW,REF_HIGH\n' +
      `Magnesium,${biomarkers.mg},mg/dL,1.7,2.4\n` +
      `Vitamin_D3,${biomarkers.vitd},ng/mL,30,100\n` +
      `Calcium,${biomarkers.ca},mg/dL,8.5,10.2\n` +
      `Fasting_Glucose,${biomarkers.glu},mg/dL,70,99\n` +
      `Hemoglobin,${biomarkers.hgb},g/dL,13.5,17.5\n` +
      `Ferritin,${biomarkers.ferritin},ng/mL,24,336\n` +
      `TSH,${biomarkers.tsh},uIU/mL,0.4,4.0\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'KosovaHealth_Patient_Telemetry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotification('Standard KosovaHealth Template (.csv) downloaded.');
  };

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 gap-6">
      {/* Page-wide drop target while a file is dragged over the window */}
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-primary/10 backdrop-blur-[2px] flex items-center justify-center p-6">
          <div className="w-full max-w-lg h-64 rounded-2xl border-4 border-dashed border-primary bg-surface-container-lowest/95 shadow-2xl flex flex-col items-center justify-center gap-2 text-center px-6">
            <span className="material-symbols-outlined text-primary text-[48px]">file_download</span>
            <p className="text-lg font-bold text-on-surface">{t('Lësho raportin PDF këtu', 'Drop the PDF report here')}</p>
            <p className="text-xs text-on-surface-variant">
              {t('Vlerat lexohen menjëherë në shfletues — asgjë nuk dërgohet në server.', 'Values are read right in the browser — nothing is uploaded to a server.')}
            </p>
          </div>
        </div>
      )}

      {/* Top Editorial Header & Trust Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container mb-2 text-xs font-bold font-label-tag uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {language === 'al'
              ? 'Analizat e gjakut'
              : 'Blood test'}
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl text-on-surface tracking-tight font-bold leading-tight">
            {language === 'al'
              ? 'Ngarko analizat e gjakut'
              : 'Upload your blood test'}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5">
            {language === 'al'
              ? 'Lësho PDF-në nga laboratori — të tregojmë me fjalë të thjeshta çfarë do të thotë dhe çfarë të hash.'
              : 'Drop the PDF from your lab — we explain it in plain words and show what to eat.'}
          </p>
        </div>
      </div>

      {/* Privacy Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-surface-container-high/40">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                {language === 'al' ? 'Analizat e tua mbeten te ti' : 'Your results stay with you'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {language === 'al'
                ? 'PDF-ja lexohet vetëm në pajisjen tënde — nuk dërgohet askund.'
                : 'The PDF is read only on your device — it isn’t sent anywhere.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Intake Modes (Left 8 cols) & Realtime Telemetry Summary (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Intake Section (8 cols) */}
        <div className="lg:col-span-12 flex flex-col gap-6">
          {/* Mode Tabs */}
          <div className="bg-surface-container-low p-1 rounded-xl flex items-center gap-1 border border-surface-container-high/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ocr'
                  ? 'text-on-primary bg-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span>{language === 'al' ? 'PDF & OCR Skaner' : 'PDF & OCR Scan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('csv')}
              className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'csv'
                  ? 'text-on-primary bg-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              <span>{language === 'al' ? 'CSV / Spreadsheet' : 'CSV / Spreadsheet'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'manual'
                  ? 'text-on-primary bg-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>{language === 'al' ? 'Formulari Manual' : 'Manual Formular'}</span>
            </button>
          </div>

          {/* Mode 1: PDF / OCR Optical Scanner */}
          {activeTab === 'ocr' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {language === 'al' ? 'HAPI 1' : 'STEP 1'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
                      {language === 'al' ? 'Ngarko Raportin Laboratorik në PDF' : 'Upload Laboratory Report PDF'}
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      {language === 'al'
                        ? 'Lexojmë vlerat nga PDF-ja e laboratorit brenda pak sekondash.'
                        : 'We read the values from your lab PDF in a few seconds.'}
                    </p>
                  </div>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  className={`relative group cursor-pointer rounded-xl transition-all p-8 flex flex-col items-center justify-center text-center border-2 border-dashed ${
                    isDragging || isProcessingFile
                      ? 'bg-primary/5 border-primary'
                      : 'bg-surface-container-low/60 hover:bg-surface-container-high/60 border-outline-variant hover:border-primary'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    disabled={isProcessingFile}
                    aria-label={t('Ngarko raportin laboratorik (PDF)', 'Upload lab report (PDF)')}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                    <span className={`material-symbols-outlined text-[32px] ${isProcessingFile ? 'animate-spin' : ''}`}>
                      {isProcessingFile ? 'progress_activity' : 'cloud_upload'}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-on-surface">
                    {isProcessingFile
                      ? t('Duke lexuar raportin…', 'Reading the report…')
                      : t('Lësho raportin laboratorik ose kliko për të shfletuar', 'Drop clinical lab report or click to browse')}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t(
                      'PDF me tekst nga laboratori (jo foto) — mund ta lëshosh kudo në faqe',
                      'Text-based lab PDF (not a photo) — you can drop it anywhere on the page'
                    )}
                  </p>

                </div>

                {/* Extracted values — what the parser actually read from the dropped file */}
                <div
                  ref={resultsRef}
                  className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2.5 border border-surface-container-high/40 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">document_scanner</span>
                      <span className="text-xs sm:text-sm font-bold text-on-surface">
                        {t('Të dhënat e lexuara nga raporti', 'Data read from the report')}
                      </span>
                    </div>
                    {report && (
                      <span className="font-mono text-xs text-primary font-bold truncate max-w-full">
                        {report.fileName}
                      </span>
                    )}
                  </div>

                  {!report && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                      <p className="text-xs text-on-surface-variant">
                        {t(
                          'Ende asnjë raport. Lësho një PDF dhe vlerat shfaqen këtu, me rreshtin ku u gjetën.',
                          'No report yet. Drop a PDF and the values appear here, with the line they were found on.'
                        )}
                      </p>
                      <a
                        href={SAMPLE_REPORT_URL}
                        download="Raport-Shembull-KosovaHealth.pdf"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-xs font-bold border border-surface-container hover:bg-surface-container-high transition-colors shrink-0 self-start sm:self-auto"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        {t('Shkarko raportin shembull', 'Download sample report')}
                      </a>
                    </div>
                  )}

                  {report && (
                    <>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {report.patientName && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface">
                            {t('Pacienti', 'Patient')}: <b>{report.patientName}</b>
                          </span>
                        )}
                        {report.sampleDate && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface">
                            {t('Data', 'Date')}: <b>{report.sampleDate}</b>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant">
                          {report.pages} {t('faqe', report.pages === 1 ? 'page' : 'pages')} ·{' '}
                          {report.lineCount} {t('rreshta', 'lines')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold">
                          {shownValues.length} / 10 {t('parametra', 'biomarkers')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {shownValues.map((v) => {
                          const meta = BIOMARKER_META[v.key];
                          const isBp = v.key === 'bpSys';
                          const status = isBp
                            ? biomarkers.bpSys > 120 || biomarkers.bpDia > 80
                              ? 'high'
                              : 'normal'
                            : grade(v.key, v.value);
                          return (
                            <div key={v.key} className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-on-surface-variant truncate">
                                  {language === 'al' ? meta.al : meta.en}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                    status === 'normal'
                                      ? 'bg-secondary-container text-on-secondary-container'
                                      : 'bg-error-container text-on-error-container'
                                  }`}
                                >
                                  {status === 'low' ? t('I ulët', 'Low') : status === 'high' ? t('I lartë', 'High') : t('Normal', 'Normal')}
                                </span>
                              </div>
                              <span
                                className={`font-mono text-sm font-bold ${status === 'normal' ? 'text-primary' : 'text-error'}`}
                              >
                                {isBp ? `${biomarkers.bpSys}/${biomarkers.bpDia}` : v.value} {meta.unit}
                              </span>
                              {v.convertedFrom && (
                                <span className="text-[10px] text-outline ml-1.5">
                                  ({t('nga', 'from')} {v.convertedFrom})
                                </span>
                              )}
                              <span
                                className="block text-[10px] font-mono text-outline truncate mt-0.5"
                                title={v.sourceLine}
                              >
                                “{v.sourceLine}”
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {missingKeys.length > 0 && shownValues.length > 0 && (
                        <p className="text-[11px] text-outline">
                          {t('Nuk u gjetën në raport (mbetën vlerat e mëparshme):', 'Not in the report (previous values kept):')}{' '}
                          {missingKeys.map((k) => (language === 'al' ? BIOMARKER_META[k].al : BIOMARKER_META[k].en)).join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: CSV / Excel Importer */}
          {activeTab === 'csv' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {language === 'al' ? 'INGJESTION I TABELAVE TË TË DHËNAVE' : 'TABULAR DATASET INGESTION'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
                      {language === 'al' ? 'Importues i Skedarëve CSV / Excel' : 'Bulk CSV / Excel Lab Importer'}
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      Exported panels from LIS (Laboratory Information System) or manual spreadsheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors shadow-xs self-start"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Standard KosovaHealth Template (.csv)</span>
                  </button>
                </div>

                <div className="rounded-xl bg-surface-container-low/70 p-6 flex flex-col items-center justify-center text-center border border-dashed border-outline-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-2">
                    <span className="material-symbols-outlined text-[24px]">file_present</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    Drop .CSV telemetry data
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Automatic header-matching for: Biomarker, Value, Unit, Reference_Low, Reference_High
                  </p>
                  <div className="mt-4 flex gap-2">
                    <label className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer">
                      Select Local Spreadsheet
                      <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Schema validation preview table */}
                <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40">
                  <span className="text-xs font-bold text-on-surface block mb-2">
                    Intelligent Column Schema Validation
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-on-surface-variant uppercase text-[10px] font-bold border-b border-surface-container-high pb-1">
                          <th className="py-1.5">Detected Column</th>
                          <th className="py-1.5">KosovaHealth Field</th>
                          <th className="py-1.5">Confidence</th>
                          <th className="py-1.5">Preview Row 1</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container text-on-surface">
                        <tr className="bg-surface-container-lowest/80">
                          <td className="py-2 font-mono">PARAM_NAME</td>
                          <td className="py-2 font-semibold text-primary">Biomarker Key</td>
                          <td className="py-2 text-secondary font-semibold">100% (Exact)</td>
                          <td className="py-2 text-on-surface-variant">Serum Ferritin</td>
                        </tr>
                        <tr className="bg-surface-container-lowest/50">
                          <td className="py-2 font-mono">QUANT_VAL</td>
                          <td className="py-2 font-semibold text-primary">Numeric Value</td>
                          <td className="py-2 text-secondary font-semibold">96% (Fuzzy)</td>
                          <td className="py-2 text-on-surface-variant">{biomarkers.ferritin}</td>
                        </tr>
                        <tr className="bg-surface-container-lowest/80">
                          <td className="py-2 font-mono">UNIT_MEASURE</td>
                          <td className="py-2 font-semibold text-primary">Standard Unit</td>
                          <td className="py-2 text-secondary font-semibold">100% (Exact)</td>
                          <td className="py-2 text-on-surface-variant">ng/mL</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Manual Interactive Formular */}
          {activeTab === 'manual' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {language === 'al' ? 'REGJISTRIM DIREKT KLINIK' : 'CLINICAL DIRECT ENTRY'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
                      {language === 'al' ? 'Protokolli i Biomarkerëve & Shenjave Vitale' : 'Biomarker & Vital Signs Protocol'}
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      Type parameters directly from your paper laboratory slip.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadNormals}
                    className="px-3.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-semibold transition-colors self-start md:self-auto"
                  >
                    {language === 'al' ? 'Ngarko Vlerat Normale të Prishtinës' : 'Load Standard Benchmark Values'}
                  </button>
                </div>

                {/* Electrolytes & Micronutrients */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-2.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    Electrolytes & Micronutrients
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Magnesium */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Magnesium (Mg)</label>
                        <span className="text-[10px] text-on-surface-variant">1.7 - 2.4 mg/dL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={biomarkers.mg}
                          onChange={(e) => setBiomarkers({ ...biomarkers, mg: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">mg/dL</span>
                      </div>
                      <span className={`text-[10px] font-bold ${biomarkers.mg < 1.7 ? 'text-error' : 'text-secondary'}`}>
                        {biomarkers.mg < 1.7 ? 'Below optimal range (Hypomagnesemia)' : 'Optimal level'}
                      </span>
                    </div>

                    {/* Calcium */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Calcium (Ca2+)</label>
                        <span className="text-[10px] text-on-surface-variant">8.5 - 10.2 mg/dL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={biomarkers.ca}
                          onChange={(e) => setBiomarkers({ ...biomarkers, ca: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">mg/dL</span>
                      </div>
                      <span className={`text-[10px] font-bold ${biomarkers.ca < 8.5 ? 'text-error' : 'text-secondary'}`}>
                        {biomarkers.ca < 8.5 ? 'Mild Hypocalcemia' : 'Optimal physiologic level'}
                      </span>
                    </div>

                    {/* 25-OH Vitamin D3 */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">25-OH Vit D3</label>
                        <span className="text-[10px] text-on-surface-variant">30 - 100 ng/mL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={biomarkers.vitd}
                          onChange={(e) => setBiomarkers({ ...biomarkers, vitd: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">ng/mL</span>
                      </div>
                      <span className={`text-[10px] font-bold ${biomarkers.vitd < 30 ? 'text-error' : 'text-secondary'}`}>
                        {biomarkers.vitd < 30 ? 'Deficiency indicated' : 'Sufficient pool'}
                      </span>
                    </div>

                    {/* Vitamin B12 */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Vitamin B12</label>
                        <span className="text-[10px] text-on-surface-variant">200 - 900 pg/mL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="10"
                          value={biomarkers.b12}
                          onChange={(e) => setBiomarkers({ ...biomarkers, b12: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">pg/mL</span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">Sufficient cellular pool</span>
                    </div>

                    {/* Ferritin */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Ferritin</label>
                        <span className="text-[10px] text-on-surface-variant">24 - 336 ng/mL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={biomarkers.ferritin}
                          onChange={(e) => setBiomarkers({ ...biomarkers, ferritin: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">ng/mL</span>
                      </div>
                      <span className="text-[10px] font-bold text-outline">Borderline iron storage</span>
                    </div>

                    {/* Hemoglobin */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Hemoglobin</label>
                        <span className="text-[10px] text-on-surface-variant">13.5 - 17.5 g/dL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={biomarkers.hgb}
                          onChange={(e) => setBiomarkers({ ...biomarkers, hgb: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">g/dL</span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">Optimal oxygen affinity</span>
                    </div>
                  </div>
                </div>

                {/* Endocrine & Vitals */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-2.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                    Endocrine, Glycemic & Hemodynamics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Glucose */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Fasting Glucose</label>
                        <span className="text-[10px] text-on-surface-variant">70 - 99 mg/dL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={biomarkers.glu}
                          onChange={(e) => setBiomarkers({ ...biomarkers, glu: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">mg/dL</span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">Euglycemic</span>
                    </div>

                    {/* TSH */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Thyroid TSH</label>
                        <span className="text-[10px] text-on-surface-variant">0.4 - 4.0 μIU/mL</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          value={biomarkers.tsh}
                          onChange={(e) => setBiomarkers({ ...biomarkers, tsh: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">μIU/mL</span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">Euthyroid state</span>
                    </div>

                    {/* Blood Pressure Dual */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">BP (Sys / Dia)</label>
                        <span className="text-[10px] text-on-surface-variant">&lt; 120/80</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          value={biomarkers.bpSys}
                          onChange={(e) => setBiomarkers({ ...biomarkers, bpSys: parseInt(e.target.value) || 120 })}
                          placeholder="Sys"
                          className="w-full bg-surface-container-lowest rounded-lg px-2 py-2 text-center text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <input
                          type="number"
                          value={biomarkers.bpDia}
                          onChange={(e) => setBiomarkers({ ...biomarkers, bpDia: parseInt(e.target.value) || 80 })}
                          placeholder="Dia"
                          className="w-full bg-surface-container-lowest rounded-lg px-2 py-2 text-center text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-outline">Pre-hypertension</span>
                    </div>

                    {/* Pulse */}
                    <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 border border-surface-container-high/50">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Resting Pulse</label>
                        <span className="text-[10px] text-on-surface-variant">60 - 100 bpm</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={biomarkers.pulse}
                          onChange={(e) => setBiomarkers({ ...biomarkers, pulse: parseInt(e.target.value) || 72 })}
                          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant">bpm</span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">Normal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {(report || labSource) && (
        <ResultsDiagram
          biomarkers={biomarkers}
          language={language}
          source={report ? { fileName: report.fileName, date: report.sampleDate } : labSource}
          onGoToFoods={onGoToFoods}
        />
      )}
    </div>
  );
};
