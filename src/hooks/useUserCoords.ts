// Posisi pengguna untuk menghitung jarak ke gedung. Bila izin lokasi ditolak atau
// belum ada fix GPS, dipakai titik tengah kampus supaya daftar tetap terurut.
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useIzinLokasi } from "../store/izin";

export type Koordinat = { latitude: number; longitude: number };

export const TITIK_KAMPUS: Koordinat = { latitude: -6.9275, longitude: 107.7697 };

export function useUserCoords() {
  const [coords, setCoords] = useState<Koordinat | null>(null);
  // Izin diminta lewat kartu di IzinLokasi.tsx; pemantauan baru mulai setelah diberikan
  const izin = useIzinLokasi();

  useEffect(() => {
    if (izin !== "diberikan") return;
    let sub: Location.LocationSubscription | null = null;
    let batal = false;
    (async () => {
      try {
        if (batal) return;
        const s = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 4000 },
          (loc) => setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
        );
        if (batal) s.remove();
        else sub = s;
      } catch {
        // tetap pakai titik kampus
      }
    })();
    return () => {
      batal = true;
      sub?.remove();
    };
  }, [izin]);

  // coords tetap berisi titik kampus sebagai cadangan; layar yang menampilkan jarak ke pengguna
  // harus memeriksa izinDiberikan, supaya tidak menampilkan jarak dari titik palsu itu.
  return { coords: coords ?? TITIK_KAMPUS, live: coords !== null, izinDiberikan: izin === "diberikan" };
}
