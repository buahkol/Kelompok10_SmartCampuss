// Daftar ruangan per gedung. PLACEHOLDER: poi.json belum memuat ruangan.
// Ganti dengan data resmi (nomor, lantai, keterangan) per gedung.
import { DAFTAR_GEDUNG } from "../utils/gedung";

export type Ruangan = { id: string; nomor: string; lantai: number; gedungId: string; keterangan: string };

const CONTOH: [string, number, string][] = [
  ["101", 1, "Ruang kuliah"], ["102", 1, "Ruang kuliah"], ["201", 2, "Ruang kuliah"],
  ["204", 2, "Ruang praktikum"], ["205", 2, "Ruang diskusi"], ["301", 3, "Laboratorium"],
  ["401", 4, "Ruang kerja bersama"],
];

export const RUANGAN: Ruangan[] = DAFTAR_GEDUNG.flatMap((g) =>
  CONTOH.map(([nomor, lantai, keterangan]) => ({
    id: `${g.id}-${nomor}`, nomor, lantai, gedungId: g.id, keterangan,
  })),
);
