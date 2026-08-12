// Membangun assets/hero-dark.svg dan assets/hero-light.svg: poster buronan
// bergaya kertas tua, lengkap dengan tepi sobek, butiran kertas, noda usia,
// dan stempel pudar.
//
// Posternya dibangkitkan, bukan ditulis tangan, supaya angka bounty selalu
// mengikuti jumlah repositori publik dan avatar selalu yang terbaru.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USER = process.env.STATS_USER ?? "SonnyRilman";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1200;
const H = 520;

const SERIF = "Georgia, 'Times New Roman', 'Playfair Display', serif";
const MONO = "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace";

const THEMES = {
  // Poster yang sama, dilihat pada dua pencahayaan: lapuk di ruang gelap,
  // dan pucat termakan matahari di ruang terang.
  dark: {
    paperTop: "#241B10",
    paperBottom: "#191207",
    ink: "#E6D4A8",
    inkSoft: "#A28F68",
    rule: "#C7A55C",
    stain: "#000000",
    stainOpacity: "0.20",
    grain: "#FFFFFF",
    grainSlope: "0.10",
    stamp: "#B4483A",
    stampOpacity: "0.34",
    shadow: "#000000",
    shadowOpacity: "0.55",
    photoVeil: "#241B10",
  },
  light: {
    paperTop: "#EADCBA",
    paperBottom: "#DCC9A0",
    ink: "#3A2914",
    inkSoft: "#6E5A3C",
    rule: "#8A6B28",
    stain: "#6B4C22",
    stainOpacity: "0.13",
    grain: "#3A2914",
    grainSlope: "0.13",
    stamp: "#9E3226",
    stampOpacity: "0.40",
    shadow: "#4A3A22",
    shadowOpacity: "0.28",
    photoVeil: "#EADCBA",
  },
};

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tepi kertas yang sobek: tiap sisi dipecah jadi segmen pendek dengan
// simpangan acak yang tetap (seed tetap), supaya hasilnya tidak berubah-ubah
// tiap kali script dijalankan dan diff-nya tetap bersih.
function tornEdge({ x0, y0, x1, y1, jitter = 4, step = 26, seed = 20260812 }) {
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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBounty(value) {
  return value.toLocaleString("id-ID").replace(/\./g, ".");
}

async function api(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": `${USER}-profile` };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} untuk ${path}`);
  return res.json();
}

async function collect() {
  const repos = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await api(`/users/${USER}/repos?per_page=100&type=owner&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const owned = repos.filter((repo) => !repo.fork && !repo.archived);

  // Avatar disematkan sebagai data URI: SVG di README dilayani lewat proxy
  // gambar GitHub, yang memblokir permintaan keluar, jadi rujukan URL biasa
  // akan tampil kosong.
  const res = await fetch(`https://avatars.githubusercontent.com/${USER}?s=260`, {
    headers: { "User-Agent": `${USER}-profile` },
  });
  if (!res.ok) throw new Error(`Gagal mengambil avatar: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const avatar = `data:${res.headers.get("content-type") ?? "image/png"};base64,${buffer.toString("base64")}`;

  return { repoCount: owned.length, avatar };
}

function render({ repoCount, avatar }, theme) {
  const t = THEMES[theme];
  const bounty = formatBounty(repoCount * 1_000_000);

  const paper = tornEdge({ x0: 18, y0: 14, x1: W - 18, y1: H - 14 });

  const photo = { x: 112, y: 214, size: 240 };
  const textX = 404;

  // Simbol berry: huruf B yang dicoret dua garis mendatar.
  const berryX = textX;
  const berryY = 392;
  const berry = `
  <text x="${berryX}" y="${berryY}" font-family="${SERIF}" font-size="54" font-weight="bold" fill="${t.ink}">B</text>
  <rect x="${berryX - 5}" y="${berryY - 33}" width="46" height="4" fill="${t.ink}"/>
  <rect x="${berryX - 5}" y="${berryY - 20}" width="46" height="4" fill="${t.ink}"/>`;

  // Stempel: dua lingkaran sepusat dengan teks melengkung di antaranya.
  const stamp = `
  <g transform="rotate(-14 1032 398)" opacity="${t.stampOpacity}">
    <circle cx="1032" cy="398" r="68" fill="none" stroke="${t.stamp}" stroke-width="4"/>
    <circle cx="1032" cy="398" r="56" fill="none" stroke="${t.stamp}" stroke-width="1.5"/>
    <path id="stampArc" d="M986 398a46 46 0 0 1 92 0" fill="none"/>
    <text font-family="${SERIF}" font-size="13" font-weight="bold" letter-spacing="3.4" fill="${t.stamp}">
      <textPath href="#stampArc" startOffset="50%" text-anchor="middle">GRAND LINE</textPath>
    </text>
    <text x="1032" y="404" text-anchor="middle" font-family="${SERIF}" font-size="19" font-weight="bold" letter-spacing="2" fill="${t.stamp}">SEEN</text>
    <text x="1032" y="428" text-anchor="middle" font-family="${MONO}" font-size="10" letter-spacing="2.4" fill="${t.stamp}">FULLSTACK</text>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Poster buronan: Sonny Rilman, fullstack developer">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.paperTop}"/>
      <stop offset="1" stop-color="${t.paperBottom}"/>
    </linearGradient>

    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="11" result="noise"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="${t.grainSlope}" intercept="0"/>
      </feComponentTransfer>
    </filter>

    <filter id="blot" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>

    <filter id="drop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="${t.shadow}" flood-opacity="${t.shadowOpacity}"/>
    </filter>

    <filter id="aged">
      <feColorMatrix type="saturate" values="0.22"/>
    </filter>

    <clipPath id="paperClip"><path d="${paper}"/></clipPath>
    <clipPath id="photoClip"><rect x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}"/></clipPath>
  </defs>

  <path d="${paper}" fill="url(#paper)" filter="url(#drop)"/>

  <g clip-path="url(#paperClip)">
    <!-- noda usia -->
    <ellipse cx="180" cy="90" rx="130" ry="80" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="1080" cy="120" rx="150" ry="90" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="620" cy="500" rx="220" ry="90" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.55"/>
  </g>

  <!-- bingkai ganda khas poster cetak -->
  <rect x="42" y="40" width="${W - 84}" height="${H - 80}" fill="none" stroke="${t.ink}" stroke-opacity="0.55" stroke-width="3"/>
  <rect x="52" y="50" width="${W - 104}" height="${H - 100}" fill="none" stroke="${t.ink}" stroke-opacity="0.3" stroke-width="1"/>

  <text x="600" y="134" text-anchor="middle" font-family="${SERIF}" font-size="80" font-weight="bold" letter-spacing="20" fill="${t.ink}">WANTED</text>

  <line x1="330" y1="156" x2="560" y2="156" stroke="${t.rule}" stroke-opacity="0.6" stroke-width="1.5"/>
  <rect x="596" y="152" width="8" height="8" transform="rotate(45 600 156)" fill="${t.rule}" opacity="0.85"/>
  <line x1="640" y1="156" x2="870" y2="156" stroke="${t.rule}" stroke-opacity="0.6" stroke-width="1.5"/>

  <text x="600" y="190" text-anchor="middle" font-family="${SERIF}" font-size="19" letter-spacing="11" fill="${t.inkSoft}">DEAD OR ALIVE</text>

  <!-- potret -->
  <g clip-path="url(#photoClip)">
    <image href="${avatar}" xlink:href="${avatar}" x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}" preserveAspectRatio="xMidYMid slice" filter="url(#aged)"/>
    <rect x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}" fill="${t.photoVeil}" opacity="0.20"/>
  </g>
  <rect x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}" fill="none" stroke="${t.ink}" stroke-opacity="0.5" stroke-width="2.5"/>

  <!-- keterangan buronan -->
  <text x="${textX}" y="266" font-family="${SERIF}" font-size="46" font-weight="bold" letter-spacing="5" fill="${t.ink}">SONNY RILMAN</text>
  <line x1="${textX}" y1="288" x2="${textX + 190}" y2="288" stroke="${t.rule}" stroke-opacity="0.75" stroke-width="2"/>
  <text x="${textX}" y="320" font-family="${MONO}" font-size="14" letter-spacing="6" fill="${t.inkSoft}">FULLSTACK DEVELOPER</text>
${berry}
  <text x="${berryX + 56}" y="${berryY}" font-family="${SERIF}" font-size="54" font-weight="bold" letter-spacing="2" fill="${t.ink}">${bounty}</text>
  <text x="${textX}" y="430" font-family="${MONO}" font-size="13" letter-spacing="3.4" fill="${t.inkSoft}">LARAVEL &#183; REACT &#183; TYPESCRIPT &#183; FASTAPI</text>
${stamp}

  <text x="600" y="472" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="4" fill="${t.inkSoft}">github.com/${escapeXml(USER)}</text>
</svg>
`;
}

const data = await collect();
await mkdir(resolve(ROOT, "assets"), { recursive: true });

for (const theme of Object.keys(THEMES)) {
  await writeFile(resolve(ROOT, "assets", `hero-${theme}.svg`), render(data, theme), "utf8");
  console.log(`tertulis assets/hero-${theme}.svg`);
}

console.log(`bounty B${formatBounty(data.repoCount * 1_000_000)} dari ${data.repoCount} repositori`);
