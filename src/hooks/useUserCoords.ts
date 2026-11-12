// Posisi pengguna untuk menghitung jarak ke gedung. Bila izin lokasi ditolak atau
// belum ada fix GPS, dipakai titik tengah kampus supaya daftar tetap terurut.
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type Koordinat = { latitude: number; longitude: number };

export const TITIK_KAMPUS: Koordinat = { latitude: -6.9275, longitude: 107.7697 };

export function useUserCoords() {
  const [coords, setCoords] = useState<Koordinat | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let batal = false;
    (async () => {
      try {
        const izin = await Location.requestForegroundPermissionsAsync();
        if (izin.status !== "granted" || batal) return;
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
  }, []);

  return { coords: coords ?? TITIK_KAMPUS, live: coords !== null };
}
