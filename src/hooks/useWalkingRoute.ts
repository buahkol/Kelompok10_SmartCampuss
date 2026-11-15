// Rute jalan kaki dari Mapbox Directions. Selama permintaan belum selesai (atau gagal /
// token tidak ada), dipakai rute garis lurus sebagai cadangan.
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import type { LngLat } from "../components/sc/CampusMap";
import { bangunLangkah, kumulatif, ruteEstimasi, type Langkah, type MapboxStep } from "../utils/rute";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

type Hasil = { kunci: string; coords: LngLat[]; langkah: Langkah[]; total: number };

export type Rute = {
  coords: LngLat[];
  cum: number[];
  langkah: Langkah[];
  total: number;
  akurat: boolean; // true = dari Mapbox, false = estimasi garis lurus
};

type Opsi = { asal: LngLat; tujuan: LngLat; namaTujuan: string; kunci: string };

export function useWalkingRoute({ asal, tujuan, namaTujuan, kunci }: Opsi): Rute {
  const [hasil, setHasil] = useState<Hasil | null>(null);

  const ambil = useEffectEvent(async () => {
    if (!TOKEN) return;
    try {
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/walking/${asal[0]},${asal[1]};${tujuan[0]},${tujuan[1]}` +
        `?geometries=geojson&steps=true&overview=full&access_token=${TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const r = json.routes?.[0];
      if (!r) return;
      const steps = (r.legs?.[0]?.steps ?? []) as MapboxStep[];
      setHasil({
        kunci,
        coords: r.geometry.coordinates as LngLat[],
        langkah: bangunLangkah(steps, r.distance, namaTujuan),
        total: r.distance,
      });
    } catch {
      // tetap memakai estimasi
    }
  });

  useEffect(() => {
    // setState terjadi setelah `await` di dalam ambil(), bukan sinkron di effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    ambil();
  }, [kunci]);

  const estimasi = useMemo(() => ruteEstimasi(asal, tujuan, namaTujuan), [asal, tujuan, namaTujuan]);
  const dipakai = hasil && hasil.kunci === kunci ? hasil : null;
  const sumber = dipakai ?? estimasi;
  const cum = useMemo(() => kumulatif(sumber.coords), [sumber.coords]);

  return { ...sumber, cum, akurat: dipakai !== null };
}
