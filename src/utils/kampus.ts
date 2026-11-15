// PB10 — Batas kawasan ITB Jatinangor (NG03: navigasi hanya di dalam kampus).
// Graf jalur pejalan kaki ada di grafJalur.ts, datanya di src/data/jalurOsm.json + jalurManual.json.

// Batas kasar kawasan kampus (bbox polygon OSM way 714615575 + penyangga ± 300 m)
export const BBOX_KAMPUS = {
  minLng: 107.763,
  maxLng: 107.775,
  minLat: -6.937,
  maxLat: -6.921,
};

export function dalamKampus(c: [number, number]): boolean {
  return (
    c[0] >= BBOX_KAMPUS.minLng &&
    c[0] <= BBOX_KAMPUS.maxLng &&
    c[1] >= BBOX_KAMPUS.minLat &&
    c[1] <= BBOX_KAMPUS.maxLat
  );
}

const RAD = Math.PI / 180;
export function jarakTitik(a: [number, number], b: [number, number]) {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
