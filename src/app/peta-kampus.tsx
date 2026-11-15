// 01B · Jelajahi — Peta diperbesar: pilih pin gedung, lihat ringkasan, lanjut ke detail/rute
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CampusMap, type CampusMapHandle, type LngLat } from "../components/sc/CampusMap";
import { MapButton, ZoomControl } from "../components/sc/MapButton";
import { PlaceSheet } from "../components/sc/PlaceSheet";
import { ScIcon } from "../components/sc/ScIcon";
import { POIS } from "../data/poi";
import { useUserCoords } from "../hooks/useUserCoords";
import { font, sc, shadow } from "../theme/sc";
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
        center={awal ? [awal.lng, awal.lat] : PUSAT}
        zoom={awal ? 17 : 16}
      />

      <View style={[styles.bar, { top: atas }]}>
        <Pressable
          onPress={kembali}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          style={[styles.back, shadow.soft]}
        >
          <ScIcon name="chevron-left" size={22} color={sc.ink900} strokeWidth={2.2} />
        </Pressable>
        <View style={[styles.info, shadow.soft]}>
          <View style={styles.infoDot} />
          <Text numberOfLines={1} style={styles.infoText}>Ketuk pin untuk melihat gedung</Text>
        </View>
      </View>

      <View style={[styles.kontrol, { top: atas + 68 }]}>
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
  bar: { position: "absolute", left: 24, right: 24, flexDirection: "row", alignItems: "center", gap: 10 },
  back: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  info: {
    flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
  },
  infoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: sc.teal },
  infoText: { flexShrink: 1, fontFamily: font.semibold, fontSize: 12, lineHeight: 18, color: sc.ink900 },
  kontrol: { position: "absolute", right: 24, gap: 10, alignItems: "center" },
  locate: { borderRadius: 14, overflow: "hidden", backgroundColor: "#FFFFFF" },
});
