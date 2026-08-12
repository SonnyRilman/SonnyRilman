// Membangun assets/stats-dark.svg dan assets/stats-light.svg dari GitHub REST API.
//
// Dipakai lokal tanpa token (batas 60 request/jam sudah cukup) maupun di CI
// dengan GITHUB_TOKEN. Tujuannya supaya kartu statistik di README tidak lagi
// bergantung pada instance publik pihak ketiga yang rutin kehabisan kuota.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USER = process.env.STATS_USER ?? "SonnyRilman";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOP_LANGS = 6;

const THEMES = {
  dark: {
    panel: "#0C0E14",
    border: "#C7A55C",
    borderOpacity: "0.20",
    accent: "#C7A55C",
    value: "#F3F4F7",
    label: "#6E7589",
    muted: "#8C93A6",
    track: "#FFFFFF",
    trackOpacity: "0.07",
    divider: "#FFFFFF",
    dividerOpacity: "0.10",
  },
  light: {
    panel: "#FBFBF8",
    border: "#9A7B2F",
    borderOpacity: "0.28",
    accent: "#9A7B2F",
    value: "#0E1017",
    label: "#6B7280",
    muted: "#5D6470",
    track: "#0B0D12",
    trackOpacity: "0.08",
    divider: "#0B0D12",
    dividerOpacity: "0.12",
  },
};

// Warna linguist untuk bahasa yang realistis muncul di profil ini.
const LANG_COLORS = {
  PHP: "#4F5D95",
  JavaScript: "#F1E05A",
  TypeScript: "#3178C6",
  Python: "#3572A5",
  HTML: "#E34C26",
  CSS: "#663399",
  SCSS: "#C6538C",
  Blade: "#F7523F",
  "Jupyter Notebook": "#DA5B0B",
  "C#": "#178600",
  Java: "#B07219",
  Vue: "#41B883",
  Dart: "#00B4AB",
  Shell: "#89E051",
  Ruby: "#701516",
  Go: "#00ADD8",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  C: "#555555",
  "C++": "#F34B7D",
  Rust: "#DEA584",
  Astro: "#FF5A03",
  Svelte: "#FF3E00",
  Hack: "#878787",
  Procfile: "#9AA0AE",
  Dockerfile: "#384D54",
  Makefile: "#427819",
};

const FALLBACK_COLORS = ["#C7A55C", "#8FA5D6", "#7FB0A0", "#B98FBF", "#C79A7C", "#8C93A6"];

const MONO = "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace";
const SANS = "'Segoe UI', -apple-system, Helvetica, Arial, sans-serif";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function api(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${USER}-profile-stats`,
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${res.statusText} untuk ${path}`);
  }
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

  // Byte per bahasa jauh lebih jujur daripada field `language` yang cuma
  // menyimpan satu bahasa dominan per repositori.
  const bytes = new Map();
  for (const repo of owned) {
    try {
      const languages = await api(`/repos/${USER}/${repo.name}/languages`);
      for (const [name, size] of Object.entries(languages)) {
        bytes.set(name, (bytes.get(name) ?? 0) + size);
      }
    } catch (error) {
      console.warn(`  ! lewati bahasa ${repo.name}: ${error.message}`);
    }
  }

  const total = [...bytes.values()].reduce((sum, size) => sum + size, 0);
  const languages = [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LANGS)
    .map(([name, size], index) => ({
      name,
      share: total > 0 ? (size / total) * 100 : 0,
      color: LANG_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }));

  return { repoCount: owned.length, languages };
}

function render({ repoCount, languages }, theme) {
  const t = THEMES[theme];

  const barX = 48;
  const barWidth = 1104;
  const barY = 78;
  const barHeight = 14;

  // Bar bertumpuk: lebar tiap segmen proporsional terhadap bahasa yang tampil,
  // bukan terhadap seluruh basis kode, supaya barnya selalu penuh.
  const shown = languages.reduce((sum, lang) => sum + lang.share, 0) || 1;
  let cursor = barX;
  const segments = languages
    .map((lang) => {
      const width = (lang.share / shown) * barWidth;
      const segment = `
    <rect x="${cursor.toFixed(2)}" y="${barY}" width="${width.toFixed(2)}" height="${barHeight}" fill="${lang.color}" opacity="0.92"/>`;
      cursor += width;
      return segment;
    })
    .join("");

  const columnWidth = barWidth / 3;
  const legend = languages
    .map((lang, index) => {
      const x = barX + (index % 3) * columnWidth;
      const y = 138 + Math.floor(index / 3) * 36;
      return `
  <circle cx="${(x + 5).toFixed(2)}" cy="${y - 5}" r="5" fill="${lang.color}"/>
  <text x="${(x + 22).toFixed(2)}" y="${y}" font-family="${SANS}" font-size="14" fill="${t.muted}">${escapeXml(lang.name)}</text>
  <text x="${(x + columnWidth - 40).toFixed(2)}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="12.5" fill="${t.label}">${lang.share.toFixed(1)}%</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="205" viewBox="0 0 1200 205" role="img" aria-label="Komposisi bahasa pada repositori ${escapeXml(USER)}">
  <defs>
    <clipPath id="barClip">
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="7"/>
    </clipPath>
  </defs>

  <rect x="1" y="1" width="1198" height="203" rx="14" fill="${t.panel}" stroke="${t.border}" stroke-opacity="${t.borderOpacity}"/>

  <text x="48" y="52" font-family="${MONO}" font-size="11" letter-spacing="4.5" fill="${t.accent}">KOMPOSISI BAHASA</text>
  <text x="1152" y="52" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="1.6" fill="${t.label}">${repoCount} repositori publik</text>

  <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="7" fill="${t.track}" fill-opacity="${t.trackOpacity}"/>
  <g clip-path="url(#barClip)">${segments}
  </g>
${legend}
</svg>
`;
}

const data = await collect();
await mkdir(resolve(ROOT, "assets"), { recursive: true });

for (const theme of Object.keys(THEMES)) {
  const file = resolve(ROOT, "assets", `stats-${theme}.svg`);
  await writeFile(file, render(data, theme), "utf8");
  console.log(`tertulis assets/stats-${theme}.svg`);
}

console.log(
  `${data.repoCount} repositori | ` +
    data.languages.map((lang) => `${lang.name} ${lang.share.toFixed(1)}%`).join(", "),
);
