// 01B · Jelajahi — Peta diperbesar: pilih pin gedung, lihat ringkasan, lanjut ke detail/rute
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CampusMap, type CampusMapHandle, type LngLat } from "../components/sc/CampusMap";
import { Kompas } from "../components/sc/Kompas";
import { MapButton, ZoomControl } from "../components/sc/MapButton";
import { PencarianPeta } from "../components/sc/PencarianPeta";
import { PlaceSheet } from "../components/sc/PlaceSheet";
import { ScIcon } from "../components/sc/ScIcon";
import { POIS } from "../data/poi";
import { useUserCoords } from "../hooks/useUserCoords";
import { sc, shadow } from "../theme/sc";
import { infoGedung } from "../utils/gedung";

const PUSAT: LngLat = [107.7697, -6.9275];

export default function PetaKampus() {
  const { id, dari } = useLocalSearchParams<{ id?: string; dari?: string }>();
  const insets = useSafeAreaInsets();
  const { coords, live } = useUserCoords();
  const peta = useRef<CampusMapHandle>(null);
  const awal = POIS.find((p) => p.id === id);
  const [pilihId, setPilihId] = useState<string | null>(awal?.id ?? null);
  const terpilih = POIS.find((p) => p.id === pilihId);
  const [arah, setArah] = useState(0);

  const atas = insets.top + 8;

  const pilih = (poiId: string) => {
    const p = POIS.find((x) => x.id === poiId);
    if (!p) return;
    setPilihId(poiId);
    peta.current?.flyTo([p.lng, p.lat], 17);
  };

  return (
    <View style={styles.screen}>
      <CampusMap
        ref={peta}
        pois={POIS}
        selectedId={pilihId}
        onSelect={pilih}
        showUser={live}
        onHeading={setArah}
        center={awal ? [awal.lng, awal.lat] : PUSAT}
        zoom={awal ? 17 : 16}
      />

      <PencarianPeta
        top={atas}
        onPilih={(p) => pilih(p.id)}
        kiri={
          <Pressable
            onPress={kembali}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            style={[styles.back, shadow.soft]}
          >
            <ScIcon name="chevron-left" size={22} color={sc.ink900} strokeWidth={2.2} />
          </Pressable>
        }
      />

      <View style={[styles.kontrol, { top: atas + 68 }]}>
        <Kompas heading={arah} onPress={() => peta.current?.resetUtara()} />
        <ZoomControl onIn={() => peta.current?.zoomBy(1)} onOut={() => peta.current?.zoomBy(-1)} />
        <View style={[styles.locate, shadow.soft]}>
          <MapButton
            icon="locate-fixed"
            label="Pusatkan ke lokasi saya"
            iconSize={18}
            onPress={() => peta.current?.flyTo([coords.longitude, coords.latitude], 17)}
          />
        </View>
      </View>

      {terpilih && (
        <PlaceSheet
          poi={terpilih}
          info={infoGedung(terpilih.id)}
          bottomInset={insets.bottom}
          onClose={() => setPilihId(null)}
          onDetail={() => router.push({ pathname: "/gedung/[id]", params: { id: terpilih.id } })}
          onRoute={() =>
            router.push({
              pathname: "/navigasi",
              params: { id: terpilih.id, ...(dari ? { dari } : {}) },
            })
          }
        />
      )}
    </View>
  );
}

function kembali() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: sc.mapBg },
  back: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  kontrol: { position: "absolute", right: 24, gap: 10, alignItems: "center" },
  locate: { borderRadius: 14, overflow: "hidden", backgroundColor: "#FFFFFF" },
});
