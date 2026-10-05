export type TabType = 'shop' | 'input' | 'pharmacies';

export type Language = 'al' | 'en';

export interface BiomarkerData {
  mg: number;         // Magnesium mg/dL (ref: 1.7 - 2.4)
  ca: number;         // Calcium mg/dL (ref: 8.5 - 10.2)
  vitd: number;       // 25-OH Vit D3 ng/mL (ref: 30 - 100)
  b12: number;        // Vitamin B12 pg/mL (ref: 200 - 900)
  ferritin: number;   // Ferritin ng/mL (ref: 24 - 336)
  hgb: number;        // Hemoglobin g/dL (ref: 13.5 - 17.5)
  glu: number;        // Fasting Glucose mg/dL (ref: 70 - 99)
  tsh: number;        // Thyroid TSH uIU/mL (ref: 0.4 - 4.0)
  bpSys: number;      // Systolic mmHg (< 120)
  bpDia: number;      // Diastolic mmHg (< 80)
  pulse: number;      // Resting pulse bpm (60 - 100)
}

