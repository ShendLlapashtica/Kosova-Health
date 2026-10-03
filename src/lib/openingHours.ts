// Tiny reader for the OpenStreetMap opening_hours formats used by Prishtina pharmacies:
// "24/7", "Mo-Su 08:00-23:00", "Mo,We-Fr 08:00-23:00; Tu 06:00-21:00", "08:00-23:00", "Mo-Su 20:00-09:00".
const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; // index = Date.getDay()
const ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function parseDays(spec: string): Set<number> {
  const out = new Set<number>();
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [a, b] = part.split('-').map((s) => s.trim());
    const i = ORDER.indexOf(a);
    const j = b ? ORDER.indexOf(b) : i;
    if (i < 0 || j < 0) continue;
    for (let k = i; ; k = (k + 1) % 7) {
      out.add(DAY_CODES.indexOf(ORDER[k]));
      if (k === j) break;
    }
  }
  return out;
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** true = open, false = closed, undefined = we don't know. */
export function isOpenAt(oh: string | null | undefined, when = new Date()): boolean | undefined {
  if (!oh || /unknown/i.test(oh)) return undefined;
  if (oh.trim() === '24/7') return true;
  const day = when.getDay();
  const now = when.getHours() * 60 + when.getMinutes();
  let decided: boolean | undefined;
  let covered = false;
  for (const rule of oh.split(';').map((r) => r.trim()).filter(Boolean)) {
    const m = /^([A-Za-z]{2}(?:[\s,-]+[A-Za-z]{2})*)?\s*(.*)$/.exec(rule);
    if (!m) continue;
    const days = m[1] ? parseDays(m[1]) : new Set([0, 1, 2, 3, 4, 5, 6]);
    if (!days.has(day)) continue;
    const times = m[2].trim();
    if (!times) return undefined; // days given, hours not
    covered = true;
    if (/^(off|closed)$/i.test(times)) {
      decided = false;
      continue;
    }
    decided = times.split(',').some((range) => {
      const r = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(range);
      if (!r) return false;
      const start = minutes(r[1]);
      let end = minutes(r[2]);
      if (end === 0) end = 24 * 60;
      return end > start ? now >= start && now < end : now >= start || now < end; // overnight
    });
  }
  return covered ? decided : false;
}

/** Opening hours in plain Albanian / English. */
export function prettyHours(oh: string | null | undefined, lang: 'al' | 'en') {
  if (!oh || /unknown/i.test(oh)) return lang === 'al' ? 'Orari i panjohur' : 'Hours unknown';
  if (oh.trim() === '24/7') return lang === 'al' ? 'Hapur gjithmonë (24/7)' : 'Always open (24/7)';
  const names = lang === 'al'
    ? { Mo: 'Hë', Tu: 'Ma', We: 'Më', Th: 'En', Fr: 'Pr', Sa: 'Sh', Su: 'Di' }
    : { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' };
  return oh
    .replace(/Mo-Su/g, lang === 'al' ? 'Çdo ditë' : 'Every day')
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => names[d as keyof typeof names])
    .replace(/;\s*/g, ' · ')
    .replace(/24:00|00:00(?=$|[\s·,])/g, '24:00');
}
