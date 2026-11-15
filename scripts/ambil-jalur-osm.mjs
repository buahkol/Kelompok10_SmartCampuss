// PB10 — Ambil jaringan jalan pejalan kaki ITB Jatinangor dari OpenStreetMap.
// Hasil: src/data/jalurOsm.json (GeoJSON LineString, bisa dibuka di geojson.io).
// Tambalan buatan tim TIDAK ditulis di sini, tapi di src/data/jalurManual.json,
// jadi script ini aman dijalankan ulang kapan saja.
//
// Jalankan: bun scripts/ambil-jalur-osm.mjs
// Data © OpenStreetMap contributors, lisensi ODbL — wajib dicantumkan di aplikasi.
import { writeFileSync } from "node:fs";

// Polygon kampus "Institut Teknologi Bandung, Jatinangor" di OSM
const OSM_KAMPUS_WAY = 714615575;

// Jalan raya umum di luar kampus (Jl. Raya Jatinangor) tidak dipakai
const DIBUANG = new Set(["trunk", "trunk_link", "primary", "primary_link", "motorway", "construction", "proposed"]);

const query = `[out:json][timeout:90];
way(${OSM_KAMPUS_WAY});map_to_area->.kampus;
way["highway"](area.kampus);
out geom;`;

const SERVER = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function ambil() {
  for (let coba = 0; coba < 6; coba++) {
    const url = SERVER[coba % SERVER.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "smart-campuss-pb10" },
        body: new URLSearchParams({ data: query }),
      });
      if (res.ok) return await res.json();
      console.warn(`  ${url} → HTTP ${res.status}, coba lagi…`);
    } catch (e) {
      console.warn(`  ${url} → ${e.message}, coba lagi…`);
    }
    await new Promise((r) => setTimeout(r, 3000 * (coba + 1)));
  }
  throw new Error("Semua server Overpass gagal");
}

const bulat = (x) => Math.round(x * 1e7) / 1e7;

const data = await ambil();
const fitur = [];
const dibuang = {};
for (const e of data.elements) {
  const t = e.tags ?? {};
  const alasan =
    DIBUANG.has(t.highway) ? t.highway
    : t.foot === "no" ? "foot=no"
    : t.access === "no" && !["yes", "designated", "permissive"].includes(t.foot) ? "access=no"
    : t.area === "yes" ? "area"
    : null;
  if (alasan) {
    dibuang[alasan] = (dibuang[alasan] ?? 0) + 1;
    continue;
  }
  if (!e.geometry || e.geometry.length < 2) continue;
  fitur.push({
    type: "Feature",
    properties: {
      id: `osm-${e.id}`,
      jenis: t.highway,
      ...(t.name ? { nama: t.name } : {}),
      ...(t.covered === "yes" ? { teduh: true } : {}),
      sumber: "osm",
      tervalidasi: false,
    },
    geometry: { type: "LineString", coordinates: e.geometry.map((g) => [bulat(g.lon), bulat(g.lat)]) },
  });
}

fitur.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
const hasil = {
  type: "FeatureCollection",
  properties: {
    keterangan: "Jaringan jalan pejalan kaki ITB Jatinangor (otomatis dari OSM). Jangan diedit manual — tambalan di jalurManual.json.",
    atribusi: "© OpenStreetMap contributors (ODbL)",
    diambil: new Date().toISOString().slice(0, 10),
    osmKampusWay: OSM_KAMPUS_WAY,
  },
  features: fitur,
};
const tujuan = new URL("../src/data/jalurOsm.json", import.meta.url);
writeFileSync(tujuan, JSON.stringify(hasil) + "\n");

const perJenis = {};
for (const f of fitur) perJenis[f.properties.jenis] = (perJenis[f.properties.jenis] ?? 0) + 1;
console.log(`${fitur.length} jalur disimpan ke src/data/jalurOsm.json`);
console.log("  per jenis:", perJenis);
console.log("  dibuang:", dibuang);
