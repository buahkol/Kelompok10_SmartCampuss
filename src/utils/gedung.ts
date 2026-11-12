import { POIS, type POI } from "../data/poi";
import { DEFAULT_INFO, INFO_GEDUNG, type FasilitasTipe, type InfoGedung } from "../data/fasilitas";
import type { Koordinat } from "../hooks/useUserCoords";
import { jarakMeter } from "./geofence";

export type GedungJarak = { poi: POI; info: InfoGedung; jarak: number };

export const infoGedung = (id: string): InfoGedung => INFO_GEDUNG[id] ?? DEFAULT_INFO;

// Ikon kampus (patung) bukan gedung, jadi tidak ikut daftar
export const DAFTAR_GEDUNG = POIS.filter((p) => p.kategori !== "ikon");

export function gedungTerdekat(
  dari: Koordinat,
  opsi: { tipe?: FasilitasTipe; kecuali?: string; batas?: number } = {},
): GedungJarak[] {
  const hasil = DAFTAR_GEDUNG.filter((p) => p.id !== opsi.kecuali)
    .map((poi) => ({ poi, info: infoGedung(poi.id), jarak: jarakMeter(dari, poi) }))
    .filter((g) => !opsi.tipe || opsi.tipe in g.info.fasilitas)
    .sort((a, b) => a.jarak - b.jarak);
  return opsi.batas ? hasil.slice(0, opsi.batas) : hasil;
}

export const ringkasanGedung = (g: GedungJarak) => g.info.ringkasan ?? KATEGORI_TEKS[g.poi.kategori];

const KATEGORI_TEKS = { ikon: "Ikon kampus", gedung: "Gedung utama", fasilitas: "Fasilitas kampus" } as const;
