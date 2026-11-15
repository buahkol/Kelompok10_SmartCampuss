// Pengolah rute jalan kaki: instruksi bahasa Indonesia, jarak sepanjang rute, progres pengguna
import type { LngLat } from "../components/sc/CampusMap";

export type Aksi = "mulai" | "lurus" | "kiri" | "kanan" | "putar" | "tiba";

export type Langkah = {
  teks: string; // "Belok kanan ke Jalan Ganesha"
  aksi: Aksi;
  mulaiM: number; // jarak dari awal rute sampai manuver ini
  lokasi: LngLat;
};

// Bentuk minimal langkah dari Mapbox Directions API
export type MapboxStep = {
  distance: number;
  name?: string;
  maneuver: { type: string; modifier?: string; location: LngLat };
};

const R_BUMI_M = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function jarakAntara(a: LngLat, b: LngLat) {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_BUMI_M * Math.asin(Math.sqrt(h));
}

// Jarak kumulatif tiap titik rute (meter dari awal)
export function kumulatif(coords: LngLat[]) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + jarakAntara(coords[i - 1], coords[i]));
  return cum;
}

function aksiDari(type: string, modifier?: string): Aksi {
  if (type === "arrive") return "tiba";
  if (type === "depart") return "mulai";
  if (modifier === "uturn") return "putar";
  if (modifier?.includes("left")) return "kiri";
  if (modifier?.includes("right")) return "kanan";
  return "lurus";
}

export function teksInstruksi(type: string, modifier: string | undefined, nama: string | undefined, tujuan: string) {
  const jalan = nama ? ` ke ${nama}` : "";
  if (type === "arrive") return `Anda tiba di ${tujuan}`;
  if (type === "depart") return nama ? `Mulai berjalan di ${nama}` : "Mulai berjalan";
  switch (modifier) {
    case "uturn": return "Putar balik";
    case "sharp left": return `Belok tajam ke kiri${jalan}`;
    case "sharp right": return `Belok tajam ke kanan${jalan}`;
    case "slight left": return `Serong ke kiri${jalan}`;
    case "slight right": return `Serong ke kanan${jalan}`;
    case "left": return `Belok kiri${jalan}`;
    case "right": return `Belok kanan${jalan}`;
    default: return `Lurus${jalan}`;
  }
}

export function bangunLangkah(steps: MapboxStep[], totalM: number, tujuan: string): Langkah[] {
  const sum = steps.reduce((t, s) => t + s.distance, 0) || 1;
  const skala = totalM > 0 ? totalM / sum : 1; // samakan dengan panjang geometri rute
  let acc = 0;
  return steps.map((s) => {
    const l: Langkah = {
      teks: teksInstruksi(s.maneuver.type, s.maneuver.modifier, s.name, tujuan),
      aksi: aksiDari(s.maneuver.type, s.maneuver.modifier),
      mulaiM: acc * skala,
      lokasi: s.maneuver.location,
    };
    acc += s.distance;
    return l;
  });
}

// Rute cadangan (garis lurus) bila Mapbox Directions tidak tersedia
export function ruteEstimasi(asal: LngLat, tujuan: LngLat, namaTujuan: string) {
  const total = jarakAntara(asal, tujuan);
  const langkah: Langkah[] = [
    { teks: `Berjalan menuju ${namaTujuan}`, aksi: "mulai", mulaiM: 0, lokasi: asal },
    { teks: `Anda tiba di ${namaTujuan}`, aksi: "tiba", mulaiM: total, lokasi: tujuan },
  ];
  return { coords: [asal, tujuan] as LngLat[], langkah, total };
}

// Posisi pengguna pada rute: jarak yang sudah ditempuh (meter) dan simpangannya dari rute
export function progresRute(coords: LngLat[], cum: number[], pos: LngLat) {
  let terdekat = 0;
  let min = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = jarakAntara(coords[i], pos);
    if (d < min) {
      min = d;
      terdekat = i;
    }
  }
  return { s: cum[terdekat] ?? 0, simpangan: min };
}

export const bulatkanMeter = (m: number) => (m < 100 ? Math.round(m / 5) * 5 : Math.round(m / 10) * 10);
