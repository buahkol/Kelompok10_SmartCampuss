// Status izin lokasi. Dialog bawaan sistem baru dimunculkan setelah pengguna menyetujui
// kartu penjelasan di IzinLokasi.tsx, bukan langsung saat aplikasi dibuka.
import * as Location from "expo-location";
import { useSyncExternalStore } from "react";

// tanya: belum diputuskan, tampilkan kartu · diblokir: sistem tidak mau bertanya lagi, arahkan ke Pengaturan
// ditunda: pengguna memilih "Nanti saja" atau menolak, kartu tidak ditampilkan lagi sampai aplikasi dibuka ulang
export type StatusIzin = "memuat" | "diberikan" | "tanya" | "diblokir" | "ditunda";

let lokasi: StatusIzin = "memuat";
const pendengar = new Set<() => void>();

const setLokasi = (s: StatusIzin) => {
  if (s === lokasi) return;
  lokasi = s;
  pendengar.forEach((p) => p());
};

export async function muatIzinLokasi() {
  try {
    const r = await Location.getForegroundPermissionsAsync();
    if (r.granted) setLokasi("diberikan");
    else if (lokasi !== "ditunda") setLokasi(r.canAskAgain ? "tanya" : "diblokir");
  } catch {
    setLokasi("ditunda");
  }
}

export async function mintaIzinLokasi() {
  try {
    const r = await Location.requestForegroundPermissionsAsync();
    setLokasi(r.granted ? "diberikan" : "ditunda");
  } catch {
    setLokasi("ditunda");
  }
}

export const tundaIzinLokasi = () => setLokasi("ditunda");

// Dipanggil saat sebuah fitur butuh lokasi tapi izin belum ada: kartu izin ditampilkan lagi
// walau sebelumnya pengguna memilih "Nanti saja" atau menolak (status "ditunda").
export async function tampilkanKartuIzin() {
  try {
    const r = await Location.getForegroundPermissionsAsync();
    setLokasi(r.granted ? "diberikan" : r.canAskAgain ? "tanya" : "diblokir");
  } catch {
    setLokasi("ditunda");
  }
}

export function useIzinLokasi(): StatusIzin {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb);
      return () => void pendengar.delete(cb);
    },
    () => lokasi,
  );
}
