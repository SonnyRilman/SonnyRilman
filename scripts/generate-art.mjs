// Membangun seluruh aset gambar README dalam satu jalan: poster buronan,
// empat judul section, empat kartu project, dan kartu komposisi bahasa.
//
// Disatukan supaya data GitHub cukup diambil sekali, dan supaya seluruh
// halaman dijamin memakai kertas serta palet yang sama.

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  THEMES,
  SERIF,
  MONO,
  api,
  anchorMark,
  escapeXml,
  paperDefs,
  textWidth,
  tornEdge,
  wrapText,
} from "./lib/paper.mjs";
import { PROJECTS, SECTIONS, STACK } from "./projects.mjs";

const USER = process.env.STATS_USER ?? "SonnyRilman";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOP_LANGS = 6;

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
  Go: "#00ADD8",
  Kotlin: "#A97BFF",
  C: "#555555",
  "C++": "#F34B7D",
  Rust: "#DEA584",
  Svelte: "#FF3E00",
  Dockerfile: "#384D54",
};
const FALLBACK_COLORS = ["#C7A55C", "#8FA5D6", "#7FB0A0", "#B98FBF", "#C79A7C", "#8C93A6"];

/* ---------------------------------------------------------------- data --- */

async function collect() {
  const repos = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await api(`/users/${USER}/repos?per_page=100&type=owner&page=${page}`, USER);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const owned = repos.filter((repo) => !repo.fork && !repo.archived);

  // Byte per bahasa lebih jujur daripada field `language`, yang hanya menyimpan
  // satu bahasa dominan per repositori.
  const bytes = new Map();
  for (const repo of owned) {
    try {
      const languages = await api(`/repos/${USER}/${repo.name}/languages`, USER);
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

  // Avatar ditanam sebagai data URI: SVG di README dilayani lewat proxy gambar
  // GitHub, yang memblokir permintaan keluar, jadi rujukan URL akan kosong.
  const res = await fetch(`https://avatars.githubusercontent.com/${USER}?s=260`, {
    headers: { "User-Agent": `${USER}-profile` },
  });
  if (!res.ok) throw new Error(`Gagal mengambil avatar: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const avatar = `data:${res.headers.get("content-type") ?? "image/png"};base64,${buffer.toString("base64")}`;

  return { repoCount: owned.length, languages, avatar };
}

/* -------------------------------------------------------------- poster --- */

function renderHero({ repoCount, avatar }, t) {
  const W = 1200;
  const H = 520;
  const bounty = (repoCount * 1_000_000).toLocaleString("id-ID");
  const paper = tornEdge({ x0: 18, y0: 14, x1: W - 18, y1: H - 14, seed: 7001 });
  const photo = { x: 112, y: 214, size: 240 };
  const textX = 404;
  const berryY = 392;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Poster buronan: Sonny Rilman, fullstack developer">
  <defs>${paperDefs(t, { grainOctaves: 4 })}
    <filter id="aged"><feColorMatrix type="saturate" values="0.22"/></filter>
    <clipPath id="paperClip"><path d="${paper}"/></clipPath>
    <clipPath id="photoClip"><rect x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}"/></clipPath>
  </defs>

  <path d="${paper}" fill="url(#paper)" filter="url(#drop)"/>
  <g clip-path="url(#paperClip)">
    <ellipse cx="180" cy="90" rx="130" ry="80" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="1080" cy="120" rx="150" ry="90" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="620" cy="500" rx="220" ry="90" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.55"/>
  </g>

  <rect x="42" y="40" width="${W - 84}" height="${H - 80}" fill="none" stroke="${t.ink}" stroke-opacity="0.55" stroke-width="3"/>
  <rect x="52" y="50" width="${W - 104}" height="${H - 100}" fill="none" stroke="${t.ink}" stroke-opacity="0.3" stroke-width="1"/>

  <text x="600" y="134" text-anchor="middle" font-family="${SERIF}" font-size="80" font-weight="bold" letter-spacing="20" fill="${t.ink}">WANTED</text>
  <line x1="330" y1="156" x2="566" y2="156" stroke="${t.rule}" stroke-opacity="0.6" stroke-width="1.5"/>
  ${anchorMark(600, 156, 0.62, t.rule, 0.9)}
  <line x1="634" y1="156" x2="870" y2="156" stroke="${t.rule}" stroke-opacity="0.6" stroke-width="1.5"/>
  <text x="600" y="190" text-anchor="middle" font-family="${SERIF}" font-size="19" letter-spacing="11" fill="${t.inkSoft}">DEAD OR ALIVE</text>

  <g clip-path="url(#photoClip)">
    <image href="${avatar}" xlink:href="${avatar}" x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}" preserveAspectRatio="xMidYMid slice" filter="url(#aged)"/>
    <rect x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}" fill="${t.veil}" opacity="0.2"/>
  </g>
  <rect x="${photo.x}" y="${photo.y}" width="${photo.size}" height="${photo.size}" fill="none" stroke="${t.ink}" stroke-opacity="0.5" stroke-width="2.5"/>

  <text x="${textX}" y="266" font-family="${SERIF}" font-size="46" font-weight="bold" letter-spacing="5" fill="${t.ink}">SONNY RILMAN</text>
  <line x1="${textX}" y1="288" x2="${textX + 190}" y2="288" stroke="${t.rule}" stroke-opacity="0.75" stroke-width="2"/>
  <text x="${textX}" y="320" font-family="${MONO}" font-size="14" letter-spacing="6" fill="${t.inkSoft}">FULLSTACK DEVELOPER</text>

  <text x="${textX}" y="${berryY}" font-family="${SERIF}" font-size="54" font-weight="bold" fill="${t.ink}">B</text>
  <rect x="${textX - 5}" y="${berryY - 33}" width="46" height="4" fill="${t.ink}"/>
  <rect x="${textX - 5}" y="${berryY - 20}" width="46" height="4" fill="${t.ink}"/>
  <text x="${textX + 56}" y="${berryY}" font-family="${SERIF}" font-size="54" font-weight="bold" letter-spacing="2" fill="${t.ink}">${bounty}</text>
  <text x="${textX}" y="430" font-family="${MONO}" font-size="13" letter-spacing="3.4" fill="${t.inkSoft}">LARAVEL &#183; REACT &#183; TYPESCRIPT &#183; FASTAPI</text>

  <g transform="rotate(-14 1032 398)" opacity="${t.stampOpacity}">
    <circle cx="1032" cy="398" r="68" fill="none" stroke="${t.stamp}" stroke-width="4"/>
    <circle cx="1032" cy="398" r="56" fill="none" stroke="${t.stamp}" stroke-width="1.5"/>
    <path id="stampArc" d="M986 398a46 46 0 0 1 92 0" fill="none"/>
    <text font-family="${SERIF}" font-size="13" font-weight="bold" letter-spacing="3.4" fill="${t.stamp}">
      <textPath href="#stampArc" startOffset="50%" text-anchor="middle">GRAND LINE</textPath>
    </text>
    <text x="1032" y="404" text-anchor="middle" font-family="${SERIF}" font-size="19" font-weight="bold" letter-spacing="2" fill="${t.stamp}">SEEN</text>
    <text x="1032" y="428" text-anchor="middle" font-family="${MONO}" font-size="10" letter-spacing="2.4" fill="${t.stamp}">FULLSTACK</text>
  </g>

  <text x="600" y="472" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="4" fill="${t.inkSoft}">github.com/${escapeXml(USER)}</text>
</svg>
`;
}

/* ------------------------------------------------------ judul section --- */

// Latarnya sengaja tembus pandang: menaruh lembar kertas penuh di tiap judul
// akan membuat halaman terasa penuh tumpukan.
// Judul di kiri, subtitle dipatok di tepi kanan, garis mengisi sisanya.
// Taksiran lebar teks hanya menentukan di mana garis mulai dan berhenti, jadi
// kalau taksirannya meleset yang berubah cuma panjang garis — dua teks tidak
// pernah bisa saling menabrak.
function renderSection({ number, title, subtitle }, t) {
  const W = 1200;
  const rightEdge = 1192;
  const label = subtitle.toUpperCase();

  const ruleStart = 88 + textWidth(title, 26, 4, "serifBold") + 30;
  const ruleEnd = rightEdge - textWidth(label, 11, 3, "mono") - 30;

  const rule =
    ruleEnd - ruleStart > 40
      ? `  <line x1="${ruleStart.toFixed(0)}" y1="41" x2="${ruleEnd.toFixed(0)}" y2="41" stroke="${t.rule}" stroke-opacity="0.45" stroke-width="1"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="72" viewBox="0 0 ${W} 72" role="img" aria-label="${escapeXml(number)} — ${escapeXml(title)} (${escapeXml(subtitle)})">
  ${anchorMark(26, 38, 0.95, t.rule, 0.85)}
  <text x="56" y="44" font-family="${MONO}" font-size="13" letter-spacing="2" fill="${t.inkSoft}">${escapeXml(number)}</text>
  <text x="88" y="46" font-family="${SERIF}" font-size="26" font-weight="bold" letter-spacing="4" fill="${t.ink}">${escapeXml(title)}</text>
${rule}
  <text x="${rightEdge}" y="46" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${t.inkSoft}">${escapeXml(label)}</text>
</svg>
`;
}

/* -------------------------------------------------------- kartu project --- */

function renderCard(project, index, t) {
  const W = 600;
  const H = 330;
  const paper = tornEdge({ x0: 10, y0: 10, x1: W - 10, y1: H - 10, jitter: 3, step: 22, seed: 4100 + index * 37 });
  const lines = wrapText(project.description, 46).slice(0, 4);

  const body = lines
    .map((line, i) => `  <text x="54" y="${160 + i * 29}" font-family="${SERIF}" font-size="20" fill="${t.inkSoft}">${escapeXml(line)}</text>`)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(project.title)} — ${escapeXml(project.description)}">
  <defs>${paperDefs(t, { grainOctaves: 2, blur: 18 })}
    <clipPath id="paperClip"><path d="${paper}"/></clipPath>
  </defs>

  <path d="${paper}" fill="url(#paper)" filter="url(#drop)"/>
  <g clip-path="url(#paperClip)">
    <ellipse cx="90" cy="40" rx="90" ry="55" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="540" cy="320" rx="110" ry="60" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  </g>

  <rect x="30" y="26" width="540" height="278" fill="none" stroke="${t.ink}" stroke-opacity="0.5" stroke-width="2.5"/>
  <rect x="38" y="34" width="524" height="262" fill="none" stroke="${t.ink}" stroke-opacity="0.28" stroke-width="1"/>

  <text x="54" y="64" font-family="${MONO}" font-size="12" letter-spacing="4" fill="${t.inkSoft}">N&#186; ${escapeXml(project.rank)}</text>
  <text x="54" y="112" font-family="${SERIF}" font-size="28" font-weight="bold" letter-spacing="1.5" fill="${t.ink}">${escapeXml(project.title)}</text>
  <line x1="54" y1="128" x2="134" y2="128" stroke="${t.rule}" stroke-opacity="0.8" stroke-width="2"/>

${body}

  <text x="54" y="284" font-family="${MONO}" font-size="12.5" letter-spacing="2.4" fill="${t.inkSoft}">${escapeXml(project.stack)}</text>
  ${anchorMark(534, 270, 0.62, t.rule, 0.3)}
</svg>
`;
}

/* ---------------------------------------------------------- kartu stack --- */

// Lambang diambil dari simple-icons saat build dan ditanam sebagai path, sebab
// SVG di README tidak boleh memuat rujukan keluar. Kalau pengambilannya gagal,
// kartunya tetap terbit — hanya tanpa lambang.
async function fetchIcons() {
  const slugs = STACK.flatMap((group) => group.items.map((item) => item.slug));
  const paths = new Map();

  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${slug}.svg`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const match = /<path\s+d="([^"]+)"/.exec(await res.text());
        if (match) paths.set(slug, match[1]);
      } catch (error) {
        console.warn(`  ! lambang ${slug} dilewati: ${error.message}`);
      }
    }),
  );

  return paths;
}

function renderStack(icons, t) {
  const W = 1200;
  const H = 300;
  const paper = tornEdge({ x0: 10, y0: 10, x1: W - 10, y1: H - 10, jitter: 3, step: 24, seed: 6205 });

  const rows = STACK.map((group, rowIndex) => {
    const y = 108 + rowIndex * 66;
    let x = 258;

    const items = group.items
      .map((item) => {
        const path = icons.get(item.slug);
        const glyph = path
          ? `  <g transform="translate(${x} ${y - 17}) scale(0.9)"><path d="${path}" fill="${t.ink}" fill-opacity="0.85"/></g>`
          : "";
        const nameX = path ? x + 32 : x;
        const label = `  <text x="${nameX}" y="${y}" font-family="${SERIF}" font-size="16" fill="${t.ink}">${escapeXml(item.name)}</text>`;
        x = nameX + textWidth(item.name, 16, 0, "serif") + 36;
        return `${glyph}\n${label}`;
      })
      .join("\n");

    return `  <text x="62" y="${y}" font-family="${SERIF}" font-size="17" font-weight="bold" letter-spacing="2.5" fill="${t.inkSoft}">${escapeXml(group.label)}</text>
  <line x1="62" y1="${y + 14}" x2="212" y2="${y + 14}" stroke="${t.rule}" stroke-opacity="0.35" stroke-width="1"/>
${items}`;
  }).join("\n\n");

  const label = `Perbekalan: ${STACK.map((g) => `${g.label} — ${g.items.map((i) => i.name).join(", ")}`).join("; ")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(label)}">
  <defs>${paperDefs(t, { grainOctaves: 2, blur: 22 })}
    <clipPath id="paperClip"><path d="${paper}"/></clipPath>
  </defs>

  <path d="${paper}" fill="url(#paper)" filter="url(#drop)"/>
  <g clip-path="url(#paperClip)">
    <ellipse cx="150" cy="40" rx="120" ry="60" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="1050" cy="290" rx="140" ry="70" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  </g>

  <rect x="30" y="26" width="1140" height="248" fill="none" stroke="${t.ink}" stroke-opacity="0.5" stroke-width="2.5"/>
  <rect x="38" y="34" width="1124" height="232" fill="none" stroke="${t.ink}" stroke-opacity="0.28" stroke-width="1"/>

${rows}
  ${anchorMark(1108, 240, 0.6, t.rule, 0.28)}
</svg>
`;
}

/* --------------------------------------------------------- kartu bahasa --- */

function renderStats({ repoCount, languages }, t) {
  const W = 1200;
  const H = 230;
  const paper = tornEdge({ x0: 10, y0: 10, x1: W - 10, y1: H - 10, jitter: 3, step: 24, seed: 8803 });

  const barX = 62;
  const barW = 1076;
  const barY = 96;
  const barH = 14;

  const shown = languages.reduce((sum, lang) => sum + lang.share, 0) || 1;
  let cursor = barX;
  const segments = languages
    .map((lang) => {
      const width = (lang.share / shown) * barW;
      const segment = `    <rect x="${cursor.toFixed(2)}" y="${barY}" width="${width.toFixed(2)}" height="${barH}" fill="${lang.color}" opacity="0.85"/>`;
      cursor += width;
      return segment;
    })
    .join("\n");

  const columnWidth = barW / 3;
  const legend = languages
    .map((lang, index) => {
      const x = barX + (index % 3) * columnWidth;
      const y = 158 + Math.floor(index / 3) * 34;
      return `  <circle cx="${(x + 5).toFixed(2)}" cy="${y - 5}" r="5" fill="${lang.color}"/>
  <text x="${(x + 22).toFixed(2)}" y="${y}" font-family="${SERIF}" font-size="16" fill="${t.ink}">${escapeXml(lang.name)}</text>
  <text x="${(x + columnWidth - 44).toFixed(2)}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="12.5" fill="${t.inkSoft}">${lang.share.toFixed(1)}%</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Komposisi bahasa pada ${repoCount} repositori publik">
  <defs>${paperDefs(t, { grainOctaves: 2, blur: 22 })}
    <clipPath id="paperClip"><path d="${paper}"/></clipPath>
    <clipPath id="barClip"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="7"/></clipPath>
  </defs>

  <path d="${paper}" fill="url(#paper)" filter="url(#drop)"/>
  <g clip-path="url(#paperClip)">
    <ellipse cx="140" cy="30" rx="120" ry="60" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <ellipse cx="1060" cy="220" rx="140" ry="70" fill="${t.stain}" opacity="${t.stainOpacity}" filter="url(#blot)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  </g>

  <rect x="30" y="26" width="1140" height="178" fill="none" stroke="${t.ink}" stroke-opacity="0.5" stroke-width="2.5"/>
  <rect x="38" y="34" width="1124" height="162" fill="none" stroke="${t.ink}" stroke-opacity="0.28" stroke-width="1"/>

  <text x="62" y="72" font-family="${SERIF}" font-size="20" font-weight="bold" letter-spacing="5" fill="${t.ink}">KOMPOSISI BAHASA</text>
  <text x="1138" y="72" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="1.6" fill="${t.inkSoft}">${repoCount} repositori publik</text>

  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="7" fill="${t.ink}" fill-opacity="0.12"/>
  <g clip-path="url(#barClip)">
${segments}
  </g>
${legend}
</svg>
`;
}

/* ----------------------------------------------------------------- tulis --- */

const data = await collect();
const icons = await fetchIcons();
await mkdir(resolve(ROOT, "assets"), { recursive: true });

// SVG yang bukan XML sah tidak digambar browser sama sekali — yang muncul cuma
// teks alt-nya. Karena seluruh isi kartu di sini dirakit lewat template string,
// satu `&` yang lolos escape sudah cukup mematikan satu lembar penuh, jadi tiap
// berkas diperiksa sebelum ditulis.
function assertWellFormed(name, svg) {
  const loose = svg.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g);
  if (loose) {
    throw new Error(`${name}.svg: ${loose.length} ampersand belum di-escape`);
  }
  if (!svg.trimStart().startsWith("<svg") || !svg.trimEnd().endsWith("</svg>")) {
    throw new Error(`${name}.svg: bukan dokumen SVG utuh`);
  }
}

let written = 0;

async function emit(name, svg) {
  assertWellFormed(name, svg);
  await writeFile(resolve(ROOT, "assets", `${name}.svg`), svg, "utf8");
  written += 1;
}

// Proxy gambar GitHub menyimpan tiap URL dan menyajikannya kembali selama
// alamatnya persis sama. Tanpa penanda versi, memperbaiki sebuah lembar tidak
// pernah terlihat di halaman: yang tampil tetap salinan lama, kadang berhari-
// hari. Penandanya diturunkan dari isi berkas, jadi URL hanya berubah kalau
// gambarnya memang berubah.
async function stampReadme() {
  const dir = resolve(ROOT, "assets");
  const path = resolve(ROOT, "README.md");
  const before = await readFile(path, "utf8");
  let after = before;

  // Seluruh isi assets/ ikut distempel, bukan hanya yang dibangkitkan script
  // ini: berkas yang ditulis tangan terkena cache proxy yang sama persis.
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".svg"))) {
    const name = file.slice(0, -4);
    const digest = createHash("sha1")
      .update(await readFile(resolve(dir, file)))
      .digest("hex")
      .slice(0, 8);

    after = after.replace(
      new RegExp(`(assets/${name}\\.svg)(\\?v=[0-9a-f]+)?`, "g"),
      `$1?v=${digest}`,
    );
  }

  if (after !== before) {
    await writeFile(path, after, "utf8");
    console.log("README.md: penanda versi diperbarui");
  }
}

for (const [theme, t] of Object.entries(THEMES)) {
  await emit(`hero-${theme}`, renderHero(data, t));
  await emit(`stack-${theme}`, renderStack(icons, t));
  await emit(`stats-${theme}`, renderStats(data, t));

  for (const section of SECTIONS) {
    await emit(`${section.file}-${theme}`, renderSection(section, t));
  }
  for (const [index, project] of PROJECTS.entries()) {
    await emit(`card-${project.rank}-${theme}`, renderCard(project, index, t));
  }
}

await stampReadme();

console.log(`${written} aset tertulis ke assets/`);
console.log(`bounty B${(data.repoCount * 1_000_000).toLocaleString("id-ID")} dari ${data.repoCount} repositori`);
console.log(`bahasa: ${data.languages.map((l) => `${l.name} ${l.share.toFixed(1)}%`).join(", ")}`);
