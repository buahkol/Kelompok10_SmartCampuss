// Data fasilitas per gedung untuk layar Beranda, Detail Gedung, dan Fasilitas.
// Daftar fasilitas dari data tim; jumlah ruang kelas mengikuti Master Ruangan ITB
// Jatinangor (lihat ruangan.ts). Jam buka masih PLACEHOLDER.
import { FASILITAS_WARNA } from "../theme/sc";

export type FasilitasTipe = keyof typeof FASILITAS_WARNA;

export type IkonFasilitas =
  | "toilet" | "kantin" | "cws" | "perpustakaan" | "musholla" | "laboratorium" | "ruang-kelas"
  | "auditorium" | "koperasi" | "atm";

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
  auditorium: { label: "Auditorium", labelPendek: "Auditorium", warna: FASILITAS_WARNA.auditorium, ikon: "auditorium" },
  koperasi: { label: "Koperasi", labelPendek: "Koperasi", warna: FASILITAS_WARNA.koperasi, ikon: "koperasi" },
  atm: { label: "ATM Center", labelPendek: "ATM", warna: FASILITAS_WARNA.atm, ikon: "atm" },
};

// Susunan baris chip: tiga baris pertama seperti di desain, baris terakhir fasilitas tambahan
export const BARIS_CHIP: FasilitasTipe[][] = [
  ["toilet", "kantin", "cws"],
  ["perpustakaan", "musholla"],
  ["laboratorium", "ruang-kelas"],
  ["auditorium", "koperasi", "atm"],
];

export function isFasilitasTipe(v: unknown): v is FasilitasTipe {
  return typeof v === "string" && v in FASILITAS;
}

export type InfoGedung = {
  ringkasan?: string; // baris kedua kartu gedung
  deskripsiSingkat?: string; // dipakai bila deskripsi di poi.json masih placeholder
  jam: string; // jam buka (placeholder)
  // tipe → keterangan (mis. "8 ruang"). Urutan penting: tiga pertama tampil sebagai chip ringkas.
  fasilitas: Partial<Record<FasilitasTipe, string>>;
};

const JAM = "07.00–21.00";
const ADA = "Tersedia";

// P01 (Patung Transformer) dan P02 (GSG) tidak punya data fasilitas
export const INFO_GEDUNG: Record<string, InfoGedung> = {
  P02: {
    ringkasan: "Gedung serbaguna · 600 orang",
    jam: JAM,
    fasilitas: {},
  },
  P03: {
    ringkasan: "Laboratorium terpadu",
    jam: JAM,
    fasilitas: { laboratorium: "Praktikum & riset", perpustakaan: ADA, musholla: ADA, toilet: ADA },
  },
  P04: {
    ringkasan: "Hunian mahasiswa",
    jam: "24 jam",
    fasilitas: { kantin: ADA, koperasi: ADA, cws: ADA, musholla: ADA, toilet: ADA },
  },
  P05: {
    ringkasan: "Ruang kuliah umum · 8 kelas",
    jam: JAM,
    fasilitas: { "ruang-kelas": "8 ruang", auditorium: "±500 orang", cws: ADA, musholla: ADA, toilet: ADA },
  },
  P06: {
    ringkasan: "Ruang kuliah umum · Auditorium",
    jam: JAM,
    fasilitas: {
      "ruang-kelas": "4 ruang",
      auditorium: "Lt. 3 · 500 orang",
      kantin: ADA,
      atm: ADA,
      musholla: ADA,
      toilet: ADA,
    },
  },
  P07: {
    ringkasan: "Pusat administrasi",
    jam: "08.00–16.00",
    fasilitas: { "ruang-kelas": "10 ruang", laboratorium: "Lab komputer", musholla: ADA, toilet: ADA },
  },
  P08: {
    ringkasan: "Riset keamanan siber",
    jam: JAM,
    fasilitas: {
      laboratorium: "Lab komputer",
      perpustakaan: ADA,
      cws: ADA,
      kantin: ADA,
      musholla: ADA,
      toilet: ADA,
    },
  },
  P09: {
    ringkasan: "Ruang kuliah umum · 10 kelas",
    jam: JAM,
    fasilitas: { "ruang-kelas": "10 ruang", cws: ADA, musholla: ADA, toilet: ADA },
  },
  P10: {
    ringkasan: "Tempat ibadah",
    jam: "24 jam",
    fasilitas: { toilet: ADA },
  },
};

export const DEFAULT_INFO: InfoGedung = { jam: JAM, fasilitas: {} };
