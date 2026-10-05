import { BiomarkerData } from '../types';

// Typical healthy reference values: the manual form's starting point and its
// "load normal values" button. Not anyone's real results.
export const BENCHMARK_NORMALS: BiomarkerData = {
  mg: 2.1,
  ca: 9.6,
  vitd: 42.0,
  b12: 550,
  ferritin: 85,
  hgb: 15.1,
  glu: 88,
  tsh: 1.85,
  bpSys: 118,
  bpDia: 76,
  pulse: 70,
};

export const INITIAL_BIOMARKERS: BiomarkerData = BENCHMARK_NORMALS;

export const LOGO_URL = '/logo-mark.png';
