// PB06 — Audio narasi POI lewat text-to-speech (expo-speech)
import * as Speech from "expo-speech";
import { sudahDiisi, type POI } from "../data/poi";

// Teks yang dibacakan: naskah audio bila sudah ada; kalau belum, nama POI (+ deskripsi)
export function teksNarasi(poi: POI) {
  if (sudahDiisi(poi.naskahAudio)) return poi.naskahAudio;
  return sudahDiisi(poi.deskripsi) ? `${poi.nama}. ${poi.deskripsi}` : poi.nama;
}

// Memutar narasi satu POI. Narasi yang sedang berjalan dihentikan dulu,
// karena Speech.speak() menambah ke antrean, bukan menyela.
export function putarNarasi(poi: POI, onMulai: () => void, onSelesai: () => void) {
  Speech.stop();
  Speech.speak(teksNarasi(poi), {
    language: "id-ID",
    onStart: onMulai,
    onDone: onSelesai,
    onStopped: onSelesai,
    onError: onSelesai,
  });
}

export function hentikanNarasi() {
  Speech.stop();
}