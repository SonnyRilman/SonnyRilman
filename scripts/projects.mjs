// Isi kartu project. Dipisah dari kode gambar supaya teksnya bisa disunting
// tanpa menyentuh logika render.

export const PROJECTS = [
  {
    rank: "01",
    title: "Sales Prediction ML",
    url: "https://github.com/SonnyRilman/Fullstack-Technical-Test",
    description:
      "Sistem prediksi penjualan yang mengklasifikasikan produk laris atau tidak laris. Frontend React berbicara ke backend FastAPI lewat REST, diamankan JWT Bearer Auth.",
    stack: "REACT · TYPESCRIPT · FASTAPI · JWT",
  },
  {
    rank: "02",
    title: "GI-GUARD",
    url: "https://github.com/SonnyRilman/GI-GUARD",
    description:
      "Sistem audit dan monitoring aset lini produksi dengan autentikasi biometrik — pengenalan wajah lewat face-api.js dan dukungan Passkeys (WebAuthn).",
    stack: "TYPESCRIPT · WEBAUTHN · FACE-API.JS",
  },
  {
    rank: "03",
    title: "TransJogja Navigator",
    url: "https://github.com/SonnyRilman/TransJogja",
    description:
      "Mencari rute bus terpendek di jaringan Trans Jogja menggunakan algoritma Dijkstra, dibungkus antarmuka Streamlit yang bisa langsung dicoba.",
    stack: "PYTHON · STREAMLIT · DIJKSTRA",
  },
  {
    rank: "04",
    title: "SRWK — Wisata Kapuas",
    url: "https://github.com/SonnyRilman/sisrek_frontend",
    description:
      "Platform rekomendasi destinasi wisata Kabupaten Kapuas, Kalimantan Tengah, memakai hybrid filtering — gabungan content-based dan collaborative filtering.",
    stack: "JAVASCRIPT · REACT · HYBRID FILTERING",
  },
];

// `slug` mengikuti nama berkas di paket simple-icons; lambangnya diambil saat
// build lalu digambar ulang dengan warna tinta, bukan warna merek, supaya
// menyatu dengan kertasnya.
export const STACK = [
  {
    label: "Backend",
    items: [
      { name: "PHP", slug: "php" },
      { name: "Laravel", slug: "laravel" },
      { name: "Node.js", slug: "nodedotjs" },
      { name: ".NET", slug: "dotnet" },
      { name: "Python", slug: "python" },
      { name: "FastAPI", slug: "fastapi" },
    ],
  },
  {
    label: "Frontend",
    items: [
      { name: "React", slug: "react" },
      { name: "Next.js", slug: "nextdotjs" },
      { name: "TypeScript", slug: "typescript" },
      { name: "JavaScript", slug: "javascript" },
      { name: "Vite", slug: "vite" },
    ],
  },
  {
    label: "Data & Tools",
    items: [
      { name: "MySQL", slug: "mysql" },
      { name: "Git", slug: "git" },
      { name: "Postman", slug: "postman" },
      { name: "Streamlit", slug: "streamlit" },
    ],
  },
];

export const SECTIONS = [
  { file: "sec-01", number: "01", title: "CATATAN BURONAN", subtitle: "tentang" },
  { file: "sec-02", number: "02", title: "PERBEKALAN", subtitle: "stack" },
  { file: "sec-03", number: "03", title: "HARTA RAMPASAN", subtitle: "project pilihan" },
  { file: "sec-04", number: "04", title: "LOG POSE", subtitle: "aktivitas" },
];
