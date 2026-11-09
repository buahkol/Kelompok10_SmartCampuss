// PB04 — Pemicu saat pengguna dekat POI (geofence berbasis jarak)
import type { POI } from "../data/poi";

type Titik = { latitude: number; longitude: number; accuracy?: number | null };

// Bacaan GPS dengan akurasi lebih buruk dari ini diabaikan supaya tidak salah memicu
export const AKURASI_MAKS_M = 30;
// Pemicu baru lepas setelah pengguna keluar sejauh radius × faktor ini,
// supaya tidak nyala-mati saat posisi GPS bergoyang di tepi radius
export const FAKTOR_KELUAR = 1.5;

const R_BUMI_M = 6_371_000;
const rad = (derajat: number) => (derajat * Math.PI) / 180;

// Jarak dua titik di permukaan bumi (haversine), dalam meter
export function jarakMeter(a: Titik, poi: Pick<POI, "lat" | "lng">) {
  const dLat = rad(poi.lat - a.latitude);
  const dLng = rad(poi.lng - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(poi.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_BUMI_M * Math.asin(Math.sqrt(h));
}

export function poiTerdekat(posisi: Titik, pois: POI[]) {
  let hasil: { poi: POI; jarak: number } | null = null;
  for (const poi of pois) {
    const jarak = jarakMeter(posisi, poi);
    if (!hasil || jarak < hasil.jarak) hasil = { poi, jarak };
  }
  return hasil;
}

// Menentukan POI yang sedang "aktif" (pengguna berada di dalam radiusnya).
// `aktifId` = POI aktif sebelumnya, dipakai untuk histeresis saat keluar.
export function poiAktif(posisi: Titik, pois: POI[], aktifId: string | null): POI | null {
  const aktif = pois.find((p) => p.id === aktifId) ?? null;

  // Akurasi buruk → pertahankan keadaan sebelumnya
  if ((posisi.accuracy ?? 0) > AKURASI_MAKS_M) return aktif;

  if (aktif && jarakMeter(posisi, aktif) <= aktif.radiusM * FAKTOR_KELUAR) return aktif;

  const terdekat = poiTerdekat(posisi, pois);
  return terdekat && terdekat.jarak <= terdekat.poi.radiusM ? terdekat.poi : null;
}
