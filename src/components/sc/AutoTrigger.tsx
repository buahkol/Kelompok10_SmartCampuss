// Pemicu otomatis: saat pengguna masuk radius POI, buka layar 06 sekali per kunjungan.
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { POIS } from "../../data/poi";
import { useUserCoords } from "../../hooks/useUserCoords";
import { poiAktif } from "../../utils/geofence";

export function AutoTrigger() {
  const { coords, live } = useUserCoords();
  const aktifId = useRef<string | null>(null);

  useEffect(() => {
    if (!live) return;
    const poi = poiAktif(coords, POIS, aktifId.current);
    const baru = poi?.id ?? null;
    if (baru && baru !== aktifId.current) {
      router.push({ pathname: "/trigger-lokasi", params: { id: baru } });
    }
    aktifId.current = baru;
  }, [coords, live]);

  return null;
}
