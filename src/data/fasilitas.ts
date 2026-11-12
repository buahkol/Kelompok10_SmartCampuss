// Data fasilitas per gedung untuk layar Beranda, Detail Gedung, dan Fasilitas.
// CATATAN: poi.json belum memuat fasilitas per gedung. Isi di bawah adalah
// PLACEHOLDER (mengikuti contoh di Figma) — ganti dengan data resmi kampus.
import { FASILITAS_WARNA } from "../theme/sc";

export type FasilitasTipe = keyof typeof FASILITAS_WARNA;

export type IkonFasilitas =
  | "toilet" | "kantin" | "cws" | "perpustakaan" | "musholla" | "laboratorium" | "ruang-kelas";

export const FASILITAS: Record<
  FasilitasTipe,
  { label: string; labelPendek: string; warna: string; ikon: IkonFasilitas }
> = {
  toilet: { label: "Toilet", labelPendek: "Toilet", warna: FASILITAS_WARNA.toilet, ikon: "toilet" },
  kantin: { label: "Kantin", labelPendek: "Kantin", warna: FASILITAS_WARNA.kantin, ikon: "kantin" },
  cws: { label: "CWS", labelPendek: "CWS", warna: FASILITAS_WARNA.cws, ikon: "cws" },
  perpustakaan: {
    label: "Perpustakaan Digital",
    labelPendek: "Perpustakaan",
    warna: FASILITAS_WARNA.perpustakaan,
    ikon: "perpustakaan",
  },
  musholla: { label: "Musholla", labelPendek: "Musholla", warna: FASILITAS_WARNA.musholla, ikon: "musholla" },
  laboratorium: {
    label: "Laboratorium",
    labelPendek: "Laboratorium",
    warna: FASILITAS_WARNA.laboratorium,
    ikon: "laboratorium",
  },
  "ruang-kelas": {
    label: "Ruang Kelas",
    labelPendek: "Ruang Kelas",
    warna: FASILITAS_WARNA["ruang-kelas"],
    ikon: "ruang-kelas",
  },
};

// Susunan baris chip persis seperti di desain
export const BARIS_CHIP: FasilitasTipe[][] = [
  ["toilet", "kantin", "cws"],
  ["perpustakaan", "musholla"],
  ["laboratorium", "ruang-kelas"],
];

export function isFasilitasTipe(v: unknown): v is FasilitasTipe {
  return typeof v === "string" && v in FASILITAS;
}

export type InfoGedung = {
  ringkasan?: string; // baris kedua kartu gedung
  deskripsiSingkat?: string; // dipakai bila deskripsi di poi.json masih placeholder
  jam: string; // jam buka (placeholder)
  fasilitas: Partial<Record<FasilitasTipe, string>>; // tipe → keterangan (mis. "5 ruang")
};

const JAM = "07.00–21.00";

export const INFO_GEDUNG: Record<string, InfoGedung> = {
  P03: {
    ringkasan: "Lab Komputer · Lab Riset",
    deskripsiSingkat:
      "Pusat laboratorium riset dan komputasi ITB Jatinangor, dengan ruang kelas dan area kerja bersama di lantai atas.",
    jam: JAM,
    fasilitas: {
      laboratorium: "5 ruang",
      "ruang-kelas": "8 ruang",
      cws: "Lantai 4",
      toilet: "Tiap lantai",
      perpustakaan: "Lantai 2",
      kantin: "Lantai 1",
    },
  },
  P08: {
    ringkasan: "Laboratorium sains",
    jam: JAM,
    fasilitas: { laboratorium: "3 ruang", "ruang-kelas": "4 ruang", toilet: "Tiap lantai" },
  },
  P09: {
    ringkasan: "Laboratorium terpadu",
    jam: JAM,
    fasilitas: { laboratorium: "2 ruang", "ruang-kelas": "10 ruang", toilet: "Tiap lantai", perpustakaan: "Lantai 2" },
  },
  P05: {
    ringkasan: "Ruang kuliah umum",
    jam: JAM,
    fasilitas: { "ruang-kelas": "12 ruang", toilet: "Tiap lantai", kantin: "Lantai 1" },
  },
  P06: {
    ringkasan: "Ruang kuliah umum",
    jam: JAM,
    fasilitas: { "ruang-kelas": "10 ruang", toilet: "Tiap lantai" },
  },
  P02: {
    ringkasan: "Gedung serba guna",
    jam: JAM,
    fasilitas: { "ruang-kelas": "6 ruang", toilet: "Tiap lantai", kantin: "Lantai 1" },
  },
  P07: {
    ringkasan: "Layanan administrasi",
    jam: "08.00–16.00",
    fasilitas: { toilet: "Lantai 1", musholla: "Lantai 1", cws: "Lantai 2" },
  },
  P04: {
    ringkasan: "Hunian mahasiswa",
    jam: "24 jam",
    fasilitas: { kantin: "Lantai 1", musholla: "Lantai 1", cws: "Lantai 2" },
  },
  P10: {
    ringkasan: "Tempat ibadah",
    jam: "24 jam",
    fasilitas: { musholla: "Aula utama", toilet: "Lantai dasar" },
  },
};

export const DEFAULT_INFO: InfoGedung = { jam: JAM, fasilitas: {} };
