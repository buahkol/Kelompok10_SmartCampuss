// F05 — Pencarian gedung, fasilitas, dan ruangan (kata kunci parsial, tanpa peduli huruf besar/kecil)
import { KATEGORI_LABEL, POIS, sudahDiisi, type POI } from "../data/poi";

export type HasilCari = {
  poi: POI;
  ruangan?: string; // ruangan yang cocok dengan kata kunci, bila ada
};

const normal = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function cariPOI(kataKunci: string, daftar: POI[] = POIS): HasilCari[] {
  const q = normal(kataKunci);
  if (!q) return [];

  const hasil: (HasilCari & { skor: number })[] = [];
  for (const poi of daftar) {
    const nama = normal(poi.nama);
    if (nama === q) hasil.push({ poi, skor: 0 });
    else if (nama.startsWith(q)) hasil.push({ poi, skor: 1 });
    else if (nama.includes(q)) hasil.push({ poi, skor: 2 });
    else {
      const ruangan = poi.ruangan.filter(sudahDiisi).find((r) => normal(r).includes(q));
      if (ruangan) hasil.push({ poi, ruangan, skor: 3 });
      else if (normal(KATEGORI_LABEL[poi.kategori]).includes(q)) hasil.push({ poi, skor: 4 });
    }
  }
  return hasil.sort((a, b) => a.skor - b.skor).map(({ poi, ruangan }) => ({ poi, ruangan }));
}
