// PB10 — Rute jalan kaki di dalam ITB Jatinangor dari graf jalur pejalan kaki kampus
// (OpenStreetMap + tambalan tim, lihat utils/ruteKampus.ts). Mapbox Directions tidak dipakai
// karena selalu memutar lewat jalan kendaraan saat jalur teduh/lorong antargedung tidak
// ada di datanya. Rute dihitung ulang otomatis bila pengguna menyimpang > SIMPANG_M.
import { useEffect, useMemo, useState } from "react";
import type { LngLat } from "../components/sc/CampusMap";
import { SIMPANG_M, hitungRuteKampus, jarakKeRute, titikBelokan, type Belokan } from "../utils/ruteKampus";
import { kumulatif, ruteEstimasi, type Aksi, type Langkah } from "../utils/rute";

export type Rute = {
  coords: LngLat[]; // seluruh lintasan, untuk progres & simpangan
  jalur: LngLat[]; // bagian yang mengikuti jalur kampus — garis rute utama
  akses: LngLat[][]; // potongan pendek di luar jalur (posisi → jalur, jalur → gedung) — putus-putus
  cum: number[];
  langkah: Langkah[];
  total: number;
  akurat: boolean; // true = mengikuti jalur kampus, false = estimasi garis lurus
  tervalidasi: boolean; // seluruh segmen sudah divalidasi lapangan (PB13)
};

type Opsi = { asal: LngLat; tujuan: LngLat; namaTujuan: string; kunci: string };

function langkahBelokan(b: Belokan): { aksi: Aksi; teks: string } {
  switch (b.arah) {
    case "kiri": return { aksi: "kiri", teks: "Belok kiri" };
    case "kanan": return { aksi: "kanan", teks: "Belok kanan" };
    case "sedikit ke kiri": return { aksi: "kiri", teks: "Serong ke kiri" };
    case "sedikit ke kanan": return { aksi: "kanan", teks: "Serong ke kanan" };
    case "putar balik": return { aksi: "putar", teks: "Putar balik" };
  }
}

function hitung(asal: LngLat, tujuan: LngLat, namaTujuan: string) {
  const r = hitungRuteKampus({ lng: asal[0], lat: asal[1] }, { lng: tujuan[0], lat: tujuan[1] });
  if (!r) {
    const e = ruteEstimasi(asal, tujuan, namaTujuan);
    return { ...e, jalur: [] as LngLat[], akses: [e.coords], akurat: false, tervalidasi: false };
  }
  const coords = r.koordinat as LngLat[];
  const cum = kumulatif(coords);
  // dariAwalM titikBelokan memakai proyeksi planar; ambil jarak kumulatif haversine
  // di indeks yang sama supaya konsisten dengan progresRute
  const langkah: Langkah[] = [
    { teks: "Mulai berjalan", aksi: "mulai", mulaiM: 0, lokasi: coords[0] },
    ...titikBelokan(r.koordinat).map((b) => ({ ...langkahBelokan(b), mulaiM: cum[b.indeks], lokasi: b.titik as LngLat })),
    { teks: `Anda tiba di ${namaTujuan}`, aksi: "tiba", mulaiM: cum[cum.length - 1], lokasi: coords[coords.length - 1] },
  ];
  return {
    coords,
    jalur: r.jalur as LngLat[],
    akses: r.akses as LngLat[][],
    langkah,
    total: cum[cum.length - 1],
    akurat: true,
    tervalidasi: r.tervalidasi,
  };
}

export function useWalkingRoute({ asal, tujuan, namaTujuan, kunci }: Opsi): Rute {
  // Titik awal rute dibekukan supaya rute tidak dihitung ulang di tiap pembaruan GPS;
  // baru diganti saat sumber posisi berubah (kunci) atau pengguna menyimpang dari rute.
  const [awal, setAwal] = useState<{ kunci: string; ll: LngLat }>({ kunci, ll: asal });
  const titikAwal = awal.kunci === kunci ? awal.ll : asal;

  const hasil = useMemo(() => hitung(titikAwal, tujuan, namaTujuan), [titikAwal, tujuan, namaTujuan]);

  const simpangan = useMemo(
    () => (hasil.coords.length > 1 ? jarakKeRute({ lng: asal[0], lat: asal[1] }, hasil.coords) : 0),
    [asal, hasil.coords],
  );

  useEffect(() => {
    // Sinkronisasi titik awal dengan posisi terbaru hanya saat kunci berganti atau menyimpang
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (awal.kunci !== kunci || simpangan > SIMPANG_M) setAwal({ kunci, ll: asal });
  }, [kunci, simpangan, awal.kunci, asal]);

  const cum = useMemo(() => kumulatif(hasil.coords), [hasil.coords]);
  return { ...hasil, cum };
}
