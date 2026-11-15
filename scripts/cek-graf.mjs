// PB10/PB13 — Cek kesehatan graf jalur kampus: komponen terputus, jarak POI ke jalur,
// dan (opsional) gambar SVG untuk dicocokkan dengan peta Ditmawa.
// Jalankan: bun scripts/cek-graf.mjs [keluaran.svg]
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { bangunGraf, proyeksiKeGraf } from "../src/utils/grafJalur.ts";
import { POIS } from "./poiFixtures.mjs";

const baca = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), "utf8"));
const osm = baca("jalurOsm.json");
const manual = baca("jalurManual.json");
const g = bangunGraf(osm, manual);

const total = g.titik.length;
const utama = g.ukuranKomponen.get(g.komponenUtama);
console.log(`Graf: ${total} simpul, ${osm.features.length} jalur OSM + ${manual.features.length} jalur manual`);
console.log(`Komponen terhubung: ${g.ukuranKomponen.size} (utama ${utama} simpul = ${((utama / total) * 100).toFixed(1)}%)`);

// Komponen kecil = potongan jalur yang tidak tersambung ke jaringan utama
const lepas = [...g.ukuranKomponen.entries()].filter(([id]) => id !== g.komponenUtama);
if (lepas.length) {
  console.log("\nPotongan jalur terputus (perlu disambung di jalurManual.json atau memang tidak relevan):");
  for (const [id, n] of lepas.sort((a, b) => b[1] - a[1])) {
    const i = g.komponen.indexOf(id);
    const [lng, lat] = g.titik[i];
    console.log(`  komponen ${id}: ${n} simpul, contoh titik ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }
}

console.log(`\nSambungan otomatis ujung menggantung (${g.sambunganOtomatis.length}) — cek lapangan, tutup lewat jalurManual.json bila ternyata terhalang:`);
for (const [a, b] of g.sambunganOtomatis) {
  const m = Math.hypot((a[0] - b[0]) * 110_500, (a[1] - b[1]) * 110_574);
  console.log(`  ${a[1].toFixed(6)}, ${a[0].toFixed(6)} → ${m.toFixed(1)} m`);
}

console.log("\nJarak POI ke jalur terdekat (> 25 m → perlu jalur akses ke pintu masuk):");
const akses = [];
for (const p of POIS) {
  const pr = proyeksiKeGraf(g, [p.lng, p.lat]);
  akses.push({ p, pr });
  const tanda = pr.jarakM > 25 ? "  ⚠" : "";
  console.log(`  ${p.id} ${p.nama.padEnd(20)} ${pr.jarakM.toFixed(1).padStart(6)} m${tanda}`);
}

const keluaran = process.argv[2];
if (keluaran) {
  const semua = [...osm.features, ...manual.features].flatMap((f) => f.geometry.coordinates);
  const lngs = semua.map((c) => c[0]).concat(POIS.map((p) => p.lng));
  const lats = semua.map((c) => c[1]).concat(POIS.map((p) => p.lat));
  const [minLng, maxLng, minLat, maxLat] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const W = 1100;
  const H = Math.round((W * (maxLat - minLat)) / ((maxLng - minLng) * Math.cos((6.93 * Math.PI) / 180)));
  const X = (lng) => (((lng - minLng) / (maxLng - minLng)) * (W - 40) + 20).toFixed(1);
  const Y = (lat) => (((maxLat - lat) / (maxLat - minLat)) * (H - 40) + 20).toFixed(1);
  const warna = { footway: "#d62828", path: "#d62828", pedestrian: "#d62828", steps: "#9b2fae", corridor: "#d62828" };
  const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff"/>`];
  for (const f of [...osm.features, ...manual.features]) {
    const pts = f.geometry.coordinates.map((c) => `${X(c[0])},${Y(c[1])}`).join(" ");
    const kunci = `${f.geometry.coordinates[0][0].toFixed(7)},${f.geometry.coordinates[0][1].toFixed(7)}`;
    const idx = g.titik.findIndex((t) => `${t[0].toFixed(7)},${t[1].toFixed(7)}` === kunci);
    const putus = idx >= 0 && g.komponen[idx] !== g.komponenUtama;
    const stroke = f.properties.sumber === "manual" ? "#1a9e3f" : putus ? "#ff9f1c" : (warna[f.properties.jenis] ?? "#8a8f98");
    const dash = f.properties.sumber === "manual" ? ' stroke-dasharray="6,3"' : "";
    svg.push(`<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${putus ? 5 : 3}"${dash}/>`);
  }
  for (const { p, pr } of akses) {
    svg.push(`<line x1="${X(p.lng)}" y1="${Y(p.lat)}" x2="${X(pr.titik[0])}" y2="${Y(pr.titik[1])}" stroke="#06f" stroke-width="1.5" stroke-dasharray="3,2"/>`);
    svg.push(`<circle cx="${X(p.lng)}" cy="${Y(p.lat)}" r="7" fill="${pr.jarakM > 25 ? "#ff006e" : "#06f"}"/>`);
    svg.push(`<text x="${+X(p.lng) + 9}" y="${+Y(p.lat) + 5}" font-size="15" font-weight="bold" font-family="sans-serif" fill="#023">${p.id} ${p.nama} (${pr.jarakM.toFixed(0)} m)</text>`);
  }
  svg.push(`<text x="12" y="${H - 10}" font-size="14" font-family="sans-serif">merah=footway/path · abu=jalan service · oranye tebal=terputus · hijau putus-putus=manual · biru=POI→jalur terdekat · data © OpenStreetMap contributors</text></svg>`);
  writeFileSync(keluaran, svg.join("\n"));
  console.log(`\nSVG ditulis ke ${keluaran}`);
}
