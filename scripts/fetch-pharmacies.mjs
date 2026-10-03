// Snapshot every pharmacy in Prishtina from OpenStreetMap (Overpass API)
// into src/data/prishtinaPharmacies.json. Re-run to refresh:
//   node scripts/fetch-pharmacies.mjs
// Data © OpenStreetMap contributors, ODbL — keep the map attribution.
import { writeFile } from 'node:fs/promises';

const BBOX = '42.60,21.08,42.71,21.25'; // Prishtina city (S,W,N,E)
const QUERY = `[out:json][timeout:60];
(nwr["amenity"="pharmacy"](${BBOX});nwr["healthcare"="pharmacy"](${BBOX}););
out center tags;`;
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

let data;
for (const url of ENDPOINTS) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'User-Agent': 'KosovaHealth-map-snapshot/1.0', Accept: 'application/json' },
    body: new URLSearchParams({ data: QUERY }),
  });
  if (res.ok) { data = await res.json(); break; }
  console.warn(`${url} -> HTTP ${res.status}, trying next`);
}
if (!data) throw new Error('All Overpass endpoints failed');

const pharmacies = data.elements
  .map((e) => {
    const t = e.tags ?? {};
    const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
    return {
      id: `${e.type}/${e.id}`,
      name: t.name ?? t['name:sq'] ?? t['name:en'] ?? null,
      lat: +(e.lat ?? e.center.lat).toFixed(6),
      lng: +(e.lon ?? e.center.lon).toFixed(6),
      street: street || null,
      openingHours: t.opening_hours ?? null,
      phone: t.phone ?? t['contact:phone'] ?? null,
      website: t.website ?? t['contact:website'] ?? null,
    };
  })
  .sort((a, b) => (a.name ?? '~').localeCompare(b.name ?? '~'));

await writeFile(
  new URL('../src/data/prishtinaPharmacies.json', import.meta.url),
  JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: 'OpenStreetMap', pharmacies }, null, 1) + '\n'
);
console.log(`Wrote ${pharmacies.length} pharmacies`);
