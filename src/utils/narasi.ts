// PB06 — Audio narasi POI lewat text-to-speech (expo-speech)
import * as Speech from "expo-speech";
import { sudahDiisi, type POI } from "../data/poi";

// Teks yang dibacakan: naskah audio bila sudah ada; kalau belum, nama POI (+ deskripsi)
export function teksNarasi(poi: POI) {
  if (sudahDiisi(poi.naskahAudio)) return poi.naskahAudio;
  return sudahDiisi(poi.deskripsi) ? `${poi.nama}. ${poi.deskripsi}` : poi.nama;
}

// Speech.pause()/resume() tidak tersedia di Android, jadi narasi dipecah per kalimat
// dan dibacakan satu per satu. "Jeda" = berhenti di kalimat ini, "lanjut" = ulang kalimat ini.
export function pecahKalimat(teks: string) {
  // Titik hanya memisahkan kalimat bila diikuti spasi/akhir teks, supaya "3.098" tidak terpotong
  return teks.match(/.+?(?:[.!?]+(?=\s|$)|$)/gs)?.map((k) => k.trim()).filter(Boolean) ?? [teks];
}

export type StatusNarasi = "berhenti" | "memutar" | "jeda";

type Sesi = { poi: POI; kalimat: string[]; indeks: number; token: number };

type Pendengar = (poiId: string | null, status: StatusNarasi) => void;

let sesi: Sesi | null = null;
let tokenTerakhir = 0;
// Beberapa layar (peta, detail gedung, trigger lokasi) bisa mendengarkan sekaligus
const daftarPendengar = new Set<Pendengar>();
const pendengar: Pendengar = (poiId, status) => daftarPendengar.forEach((fn) => fn(poiId, status));

export function pasangPendengarNarasi(fn: Pendengar) {
  daftarPendengar.add(fn);
  return () => {
    daftarPendengar.delete(fn);
  };
}

function bacaKalimat(s: Sesi) {
  Speech.speak(s.kalimat[s.indeks], {
    language: "id-ID",
    onDone: () => {
      // Abaikan callback dari sesi lama yang sudah disela/dihentikan
      if (sesi?.token !== s.token) return;
      s.indeks += 1;
      if (s.indeks < s.kalimat.length) {
        bacaKalimat(s);
      } else {
        sesi = null;
        pendengar(s.poi.id, "berhenti");
      }
    },
    onError: () => {
      if (sesi?.token !== s.token) return;
      sesi = null;
      pendengar(s.poi.id, "berhenti");
    },
  });
}

// Memutar narasi satu POI dari awal. Narasi yang sedang berjalan dihentikan dulu,
// karena Speech.speak() menambah ke antrean, bukan menyela.
export function putarNarasi(poi: POI) {
  Speech.stop();
  const s: Sesi = { poi, kalimat: pecahKalimat(teksNarasi(poi)), indeks: 0, token: ++tokenTerakhir };
  sesi = s;
  pendengar(poi.id, "memutar");
  bacaKalimat(s);
}

export function jedaNarasi() {
  if (!sesi) return;
  const { poi } = sesi;
  // Kalimat yang sedang dibacakan terpotong; token diganti agar callback-nya diabaikan
  sesi = { ...sesi, token: ++tokenTerakhir };
  Speech.stop();
  pendengar(poi.id, "jeda");
}

export function lanjutNarasi() {
  if (!sesi) return;
  pendengar(sesi.poi.id, "memutar");
  bacaKalimat(sesi);
}

export function hentikanNarasi() {
  const id = sesi?.poi.id ?? null;
  sesi = null;
  Speech.stop();
  if (id) pendengar(id, "berhenti");
}
