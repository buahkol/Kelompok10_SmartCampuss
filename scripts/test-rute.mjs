// PB10 — Bukti acceptance criteria F06 di luar perangkat (rute, jarak/ETA, deviasi, tiba).
// Jalankan: bun scripts/test-rute.mjs   (token Mapbox opsional — hanya untuk potongan akses)
import assert from "node:assert/strict";
import process from "node:process";

import { POIS } from "./poiFixtures.mjs";
import {
  AKSES_MAPBOX_M, SIMPANG_M, TIBA_M, formatDurasi, formatJarak, grafKampus, hitungRute,
  jarakKeRute, sisaJarakM, sudahTiba, titikBelokan,
} from "../src/utils/ruteKampus.ts";
import { proyeksiKeGraf } from "../src/utils/grafJalur.ts";
import { dalamKampus, jarakTitik } from "../src/utils/kampus.ts";

const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const tujuan = POIS.find((p) => p.id === "P07");
const posisi = { lat: -6.929, lng: 107.7697 }; // sekitar GKU 1

console.log("— TC-10a: rute jalur kampus (jarak + ETA + ≤ 5 detik + di dalam kampus)");
const r = await hitungRute(posisi, tujuan, { token });
console.log(`  sumber=${r.sumber} jarak=${formatJarak(r.jarakM)} ETA=${formatDurasi(r.durasiDetik)} render=${r.renderMs}ms titik=${r.koordinat.length}`);
assert.ok(r.sumber.startsWith("kampus"), "rute harus dari graf jalur kampus");
assert.ok(r.jarakM > 0 && r.durasiDetik > 0, "jarak dan estimasi waktu harus > 0");
assert.ok(r.renderMs <= 5000, `rute harus tampil ≤ 5 detik (aktual ${r.renderMs}ms)`);
assert.ok(r.koordinat.every(dalamKampus), "rute tidak boleh keluar kawasan kampus (NG03)");
assert.ok(r.jalur.length >= 2, "rute harus mengikuti jalur, bukan garis lurus");

console.log("— TC-10b: potongan di luar jalur (posisi → jalur, jalur → gedung) pendek");
for (const a of r.akses) {
  const panjang = jarakTitik(a[0], a[a.length - 1]);
  console.log(`  akses ${panjang.toFixed(1)} m`);
  assert.ok(panjang <= AKSES_MAPBOX_M, "potongan lurus di luar jalur harus ≤ ambang akses");
}

console.log("— TC-10c: seluruh pasangan POI bisa dinavigasi lewat jalur (tanpa token)");
const g = grafKampus();
for (const a of POIS) {
  const pr = proyeksiKeGraf(g, [a.lng, a.lat]);
  assert.ok(pr && pr.jarakM <= 40, `${a.id} terlalu jauh dari jaringan jalur (${pr?.jarakM.toFixed(0)} m)`);
  for (const b of POIS) {
    if (a.id === b.id) continue;
    const x = await hitungRute(a, b, { token: "" });
    assert.ok(x.sumber === "kampus" && x.jalur.length >= 2, `${a.id}→${b.id}: tidak ada rute jalur`);
    const lurus = jarakTitik([a.lng, a.lat], [b.lng, b.lat]);
    assert.ok(x.jarakM >= lurus - 1, `${a.id}→${b.id}: jarak rute < jarak lurus`);
    assert.ok(x.jarakM <= lurus * 3 + 150, `${a.id}→${b.id}: rute memutar tidak wajar (${x.jarakM.toFixed(0)} m vs lurus ${lurus.toFixed(0)} m)`);
  }
}
console.log(`  ${POIS.length * (POIS.length - 1)} pasangan POI terhubung`);

console.log("— TC-10d: deviasi > 30 m terdeteksi (pemicu reroute) dan sisa jarak menyusut saat mengikuti rute");
const tengah = r.jalur[Math.floor(r.jalur.length / 2)];
const simpang = { lat: tengah[1], lng: tengah[0] + 0.0005 }; // ± 55 m ke timur
const deviasi = jarakKeRute(simpang, r.koordinat);
console.log(`  deviasi ${deviasi.toFixed(1)} m (ambang ${SIMPANG_M} m) → ${deviasi > SIMPANG_M ? "reroute" : "tetap ikut rute"}`);
assert.ok(deviasi > SIMPANG_M, "simpang dari rute harus memicu reroute");
const rBaru = await hitungRute(simpang, tujuan, { token });
console.log(`  rute baru dari titik simpang: ${formatJarak(rBaru.jarakM)}, render ${rBaru.renderMs} ms`);
assert.ok(rBaru.jalur.length >= 2);

const sisaAwal = sisaJarakM({ lat: r.koordinat[0][1], lng: r.koordinat[0][0] }, r.koordinat);
const sisaTengah = sisaJarakM({ lat: tengah[1], lng: tengah[0] }, r.koordinat);
console.log(`  sisa jarak saat ikut rute: ${formatJarak(sisaAwal)} → ${formatJarak(sisaTengah)}`);
assert.ok(sisaTengah < sisaAwal, "sisa jarak harus berkurang saat bergerak mengikuti rute");

console.log("— TC-10e: tiba saat ≤ 20 m dari tujuan / di ujung jalur");
const titikTiba = { lat: tujuan.lat + 0.0001, lng: tujuan.lng }; // ± 11 m dari POI
assert.ok(sudahTiba(titikTiba, tujuan, r), "titik ± 11 m dari POI harus dianggap tiba");
const ujung = r.jalur[r.jalur.length - 1];
assert.ok(sudahTiba({ lat: ujung[1], lng: ujung[0] }, tujuan, r), "ujung jalur dekat pintu harus dianggap tiba");
assert.ok(!sudahTiba(simpang, tujuan, r), "titik simpang belum tiba");
console.log(`  tiba pada ≤ ${TIBA_M} m dari POI atau di ujung jalur`);

console.log("— TC-10f: titik belokan tersedia untuk panduan suara (PB11)");
const belokan = titikBelokan(r.koordinat);
console.log(`  ${belokan.length} belokan: ${belokan.map((b) => `${b.dariAwalM.toFixed(0)}m ${b.arah} (${b.belokanDerajat}°)`).join(", ")}`);
assert.ok(belokan.length >= 1, "rute kampus harus punya titik belokan untuk PB11");

console.log("\nSemua uji PB10 (F06) PASS");
