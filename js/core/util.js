// Small shared helpers: dates, seeded random numbers, number formatting, DOM.

// ---------- Dates (local time, YYYY-MM-DD) ----------
export function dateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

export function addDays(s, n) {
  const t = new Date(parseDate(s) + n * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// ---------- Seeded random numbers ----------
export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed) {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
  return rng;
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// ---------- Numbers ----------
export function round(n, dp = 6) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

// Pretty-print a number: no float noise, thousands separators.
export function fmt(n, maxDp = 4) {
  if (!Number.isFinite(n)) return String(n);
  const r = round(n, maxDp);
  const s = Math.abs(r).toLocaleString('en-US', { maximumFractionDigits: maxDp });
  return (r < 0 ? '−' : '') + s;
}

// Signed format for velocities: +3, −2, 0
export function fmtSigned(n, maxDp = 4) {
  if (round(n, maxDp) === 0) return '0';
  return (n > 0 ? '+' : '') + fmt(n, maxDp);
}

// Parse what a child types: "1,200", "3.5", "-4", "−4", "3/4", "1 1/2"
export function parseNumber(input) {
  if (input == null) return null;
  let s = String(input).trim().replace(/[,\s]+(?=\d{3}\b)/g, '').replace(/−|–/g, '-');
  s = s.replace(/\s*(km\/h|m\/s|[a-z]+)\.?$/i, ''); // "350 m", "12 km/h", "4 days" → just the number
  if (s === '') return null;
  if (/^-?\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.'); // decimal comma: "0,5" → 0.5
  const mixed = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    if (Number(mixed[4]) === 0) return null;
    const v = Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]);
    return mixed[1] ? -v : v;
  }
  const frac = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  if (/\d\s+\d/.test(s)) return null; // "1 2" is not a number
  s = s.replace(/\s+/g, '');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

// Words a child might type for a unit, mapped to the symbol the app uses.
const UNIT_ALIASES = {
  s: ['s', 'sec', 'secs', 'second', 'seconds'],
  min: ['min', 'mins', 'minute', 'minutes'],
  h: ['h', 'hr', 'hrs', 'hour', 'hours'],
  ms: ['ms', 'millisecond', 'milliseconds'],
  m: ['m', 'metre', 'metres', 'meter', 'meters'],
  cm: ['cm', 'centimetre', 'centimetres', 'centimeter', 'centimeters'],
  mm: ['mm', 'millimetre', 'millimetres', 'millimeter', 'millimeters'],
  km: ['km', 'kilometre', 'kilometres', 'kilometer', 'kilometers'],
  'm/s': ['m/s', 'mps'],
  'km/h': ['km/h', 'kmh', 'kph'],
  days: ['day', 'days'],
};

export function sameUnit(a, b) {
  const norm = (u) => {
    const x = String(u).toLowerCase();
    for (const [k, list] of Object.entries(UNIT_ALIASES)) if (list.includes(x)) return k;
    return x;
  };
  return norm(a) === norm(b);
}

// The unit typed after a number, if any: "3000 km" → "km".
export function typedUnit(input) {
  const m = String(input ?? '').trim().match(/(km\/h|m\/s|[a-z]+)\.?$/i);
  return m && /\d/.test(input) ? m[1] : null;
}

export function closeEnough(value, answer, tolerance) {
  const tol = tolerance ?? Math.max(Math.abs(answer) * 0.005, 1e-9);
  return Math.abs(value - answer) <= tol + 1e-9;
}

// ---------- DOM ----------
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function frac(num, den) {
  return `<span class="frac"><span>${num}</span><span>${den}</span></span>`;
}
