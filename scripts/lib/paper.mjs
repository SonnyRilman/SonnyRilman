// Perkakas bersama untuk semua aset bergaya kertas tua: palet, tepi sobek,
// tekstur, dan penaksir lebar teks.

export const SERIF = "Georgia, 'Times New Roman', 'Playfair Display', serif";
export const MONO = "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace";

export const THEMES = {
  // Kertas yang sama pada dua pencahayaan: lapuk di ruang gelap, dan pucat
  // termakan matahari di ruang terang.
  dark: {
    paperTop: "#241B10",
    paperBottom: "#191207",
    ink: "#E6D4A8",
    inkSoft: "#A28F68",
    rule: "#C7A55C",
    stain: "#000000",
    stainOpacity: "0.20",
    grainSlope: "0.10",
    stamp: "#B4483A",
    stampOpacity: "0.34",
    shadow: "#000000",
    shadowOpacity: "0.55",
    veil: "#241B10",
  },
  light: {
    paperTop: "#EADCBA",
    paperBottom: "#DCC9A0",
    ink: "#3A2914",
    inkSoft: "#6E5A3C",
    rule: "#8A6B28",
    stain: "#6B4C22",
    stainOpacity: "0.13",
    grainSlope: "0.13",
    stamp: "#9E3226",
    stampOpacity: "0.40",
    shadow: "#4A3A22",
    shadowOpacity: "0.28",
    veil: "#EADCBA",
  },
};

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tepi kertas yang sobek. Seed-nya tetap supaya bentuknya tidak berubah tiap
// kali script dijalankan dan diff-nya tetap bersih; seed berbeda per aset
// supaya tiap lembar tidak sobek dengan pola yang persis sama.
export function tornEdge({ x0, y0, x1, y1, jitter = 4, step = 26, seed = 20260812 }) {
  const random = mulberry32(seed);
  const points = [];
  const push = (x, y) => points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  const wobble = () => (random() - 0.5) * 2 * jitter;

  for (let x = x0; x < x1; x += step) push(x, y0 + wobble());
  for (let y = y0; y < y1; y += step) push(x1 + wobble(), y);
  for (let x = x1; x > x0; x -= step) push(x, y1 + wobble());
  for (let y = y1; y > y0; y -= step) push(x0 + wobble(), y);

  return `M${points.join("L")}Z`;
}

// numOctaves sengaja bisa diturunkan: feTurbulence itu mahal, dan satu halaman
// README memuat belasan lembar kertas sekaligus.
export function paperDefs(t, { grainOctaves = 3, blur = 26 } = {}) {
  return `
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.paperTop}"/>
      <stop offset="1" stop-color="${t.paperBottom}"/>
    </linearGradient>

    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="${grainOctaves}" seed="11" result="noise"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="${t.grainSlope}" intercept="0"/>
      </feComponentTransfer>
    </filter>

    <filter id="blot" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${blur}"/>
    </filter>

    <filter id="drop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="${t.shadow}" flood-opacity="${t.shadowOpacity}"/>
    </filter>`;
}

// Mawar kompas delapan arah, dipakai sebagai ornamen berulang.
export function compassRose(x, y, scale, color, opacity = 0.9) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}">
    <path d="M0-12 2.6-3.2 11 0 2.6 3.2 0 12-2.6 3.2-11 0-2.6-3.2Z" opacity="${opacity}"/>
    <path d="M6.4-6.4 2.6-1.6 1.6-2.6 6.4-6.4ZM-6.4 6.4-2.6 1.6-1.6 2.6-6.4 6.4ZM6.4 6.4 1.6 2.6 2.6 1.6 6.4 6.4ZM-6.4-6.4-1.6-2.6-2.6-1.6-6.4-6.4Z" opacity="${(Number(opacity) * 0.6).toFixed(2)}"/>
  </g>`;
}

// Penaksir lebar teks. Kasar, tapi cukup: SVG tidak bisa mengukur teks sendiri,
// sedangkan tata letaknya butuh tahu di mana sebuah judul berakhir.
// serifBold dipakai untuk judul huruf kapital, yang jauh lebih lebar daripada
// campuran huruf besar-kecil — angkanya sengaja dilebihkan.
const RATIO = { serif: 0.5, serifBold: 0.7, mono: 0.6 };

export function textWidth(text, fontSize, letterSpacing = 0, face = "serif") {
  return text.length * (fontSize * RATIO[face] + letterSpacing);
}

export function wrapText(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function api(path, user) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": `${user}-profile` };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} untuk ${path}`);
  return res.json();
}
