// 01 · Jelajahi — Peta kampus: rute (dari → ke), peta ringkas, dan bangunan terdekat
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { NAV_HEIGHT } from "../../components/sc/AppNav";
import { BuildingCard } from "../../components/sc/BuildingCard";
import { CampusMap, type CampusMapHandle, type LngLat } from "../../components/sc/CampusMap";
import { MapButton, ZoomControl } from "../../components/sc/MapButton";
import { PilihGedungModal } from "../../components/sc/PilihGedungModal";
import { ScIcon } from "../../components/sc/ScIcon";
import { SectionHeader } from "../../components/sc/SectionHeader";
import { POIS, type POI } from "../../data/poi";
import { useUserCoords } from "../../hooks/useUserCoords";
import { font, sc, shadow } from "../../theme/sc";
import { gedungTerdekat, ringkasanGedung } from "../../utils/gedung";

const PUSAT: LngLat = [107.7697, -6.9275];

type Asal = POI | "me" | null;

export default function Jelajahi() {
  const insets = useSafeAreaInsets();
  const { coords, live } = useUserCoords();
  const peta = useRef<CampusMapHandle>(null);
  const [dari, setDari] = useState<Asal>(null);
  const [ke, setKe] = useState<POI | null>(null);
  const [pilih, setPilih] = useState<"dari" | "ke" | null>(null);

  const terdekat = gedungTerdekat(coords, { batas: 3, semua: true });

  const bukaPeta = (id?: string, asal: Asal = dari) =>
    router.push({
      pathname: "/peta-kampus",
      params: { ...(id ? { id } : {}), ...(asal && asal !== "me" ? { dari: asal.id } : {}) },
    });

  const onPilih = (p: POI | "me") => {
    if (pilih === "dari") {
      setDari(p);
      if (ke) bukaPeta(ke.id, p);
    } else if (p !== "me") {
      setKe(p);
      bukaPeta(p.id);
    }
    setPilih(null);
  };

  const tukar = () => {
    if (dari && dari !== "me" && ke) {
      setDari(ke);
      setKe(dari);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[sc.routeFrom, sc.routeTo]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}
        >
          <View style={styles.sapaan}>
            <Text style={styles.overline}>MAU KE MANA HARI INI?</Text>
            <Text accessibilityRole="header" style={styles.h1}>ITB Jatinangor</Text>
          </View>

          <View style={[styles.rute, shadow.card]}>
            <Rail />
            <View style={styles.fields}>
              <Pressable onPress={() => setPilih("dari")} accessibilityRole="button" style={[styles.field, { paddingTop: 4, paddingBottom: 10 }]}>
                <Text style={styles.fieldLabel}>Dari</Text>
                <Text numberOfLines={1} style={[styles.fieldValue, dari && styles.fieldFilled]}>
                  {dari === "me" ? "Lokasi saya" : (dari?.nama ?? "Pilih lokasi awal")}
                </Text>
              </Pressable>
              <View style={styles.pemisah} />
              <Pressable onPress={() => setPilih("ke")} accessibilityRole="button" style={[styles.field, { paddingTop: 10, paddingBottom: 4 }]}>
                <Text style={styles.fieldLabel}>Ke</Text>
                <Text numberOfLines={1} style={[styles.fieldValue, ke && styles.fieldFilled]}>
                  {ke?.nama ?? "Cari gedung tujuan"}
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={tukar} accessibilityRole="button" accessibilityLabel="Tukar arah" style={styles.tukar}>
              <ScIcon name="swap" size={20} color={sc.tealDark} strokeWidth={2} />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={[styles.mapCard, shadow.card]}>
            <CampusMap
              ref={peta}
              pois={POIS}
              interactive={false}
              showUser={live}
              center={PUSAT}
              zoom={15.2}
              onSelect={(id) => bukaPeta(id)}
              onMapPress={() => bukaPeta()}
            />
            <View style={styles.zoom}>
              <ZoomControl onIn={() => bukaPeta()} onOut={() => peta.current?.zoomBy(-1)} />
            </View>
            <View style={styles.hint}>
              <Text style={styles.hintText}>Perbesar peta untuk memilih gedung</Text>
            </View>
            <View style={styles.locate}>
              <MapButton
                icon="locate"
                label="Pusatkan ke lokasi saya"
                size={34}
                iconSize={20}
                onPress={() => peta.current?.flyTo([coords.longitude, coords.latitude], 16.5)}
              />
            </View>
          </View>

          <View style={styles.terdekat}>
            <SectionHeader title="Bangunan terdekat" action="Lihat semua" onAction={() => router.navigate("/fasilitas")} />
            {terdekat.map((g) => (
              <BuildingCard
                key={g.poi.id}
                variant="jelajah"
                nama={g.poi.nama}
                ringkasan={ringkasanGedung(g)}
                jarakM={g.jarak}
                onPress={() => router.push({ pathname: "/gedung/[id]", params: { id: g.poi.id } })}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <PilihGedungModal
        visible={pilih !== null}
        judul={pilih === "dari" ? "Pilih lokasi awal" : "Cari gedung tujuan"}
        denganLokasiSaya={pilih === "dari"}
        onClose={() => setPilih(null)}
        onPilih={onPilih}
      />
    </View>
  );
}

// Rel penanda: titik awal, garis putus-putus, pin tujuan
function Rail() {
  return (
    <Svg width={12} height={56} viewBox="0 0 12 56" accessibilityElementsHidden>
      <Circle cx={6} cy={6} r={4.2} fill="#FFFFFF" stroke={sc.teal} strokeWidth={2.4} />
      {[19, 26, 33].map((y) => (
        <Circle key={y} cx={6} cy={y} r={1.2} fill="#C9D6D2" />
      ))}
      <Path
        d="M6 38c-3 0-5.5 2.4-5.5 5.4 0 4 5.5 10.6 5.5 10.6s5.5-6.6 5.5-10.6C11.5 40.4 9 38 6 38z"
        fill={sc.tealDark}
      />
      <Circle cx={6} cy={43.6} r={1.8} fill="#FFFFFF" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: sc.surface2 },
  header: {
    paddingHorizontal: 24, paddingBottom: 24, gap: 18,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  sapaan: { gap: 2 },
  overline: { fontFamily: font.semibold, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, color: sc.overline },
  h1: { fontFamily: font.head, fontSize: 24, lineHeight: 30, color: "#FFFFFF" },
  rute: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF",
    borderRadius: 20, paddingLeft: 16, paddingRight: 12, paddingVertical: 12,
  },
  fields: { flex: 1, minWidth: 0 },
  field: { gap: 1 },
  fieldLabel: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
  fieldValue: { fontFamily: font.semibold, fontSize: 14, lineHeight: 18, color: sc.muted },
  fieldFilled: { color: sc.ink900 },
  pemisah: { height: 1, backgroundColor: sc.line },
  tukar: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF4F2",
    alignItems: "center", justifyContent: "center",
  },
  content: { paddingHorizontal: 24, paddingTop: 22, gap: 22 },
  mapCard: { height: 280, borderRadius: 22, overflow: "hidden", backgroundColor: sc.mapBg },
  zoom: { position: "absolute", top: 14, right: 14 },
  hint: {
    position: "absolute", left: 11, bottom: 11, backgroundColor: "#FFFFFF",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  hintText: { fontFamily: font.semibold, fontSize: 10, lineHeight: 14, color: sc.ink500 },
  locate: { position: "absolute", right: 13, bottom: 13, borderRadius: 10, overflow: "hidden" },
  terdekat: { gap: 12 },
});
