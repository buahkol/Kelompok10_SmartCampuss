// 04 · Navigasi Aktif — peta + rute jalan kaki, instruksi belokan, panduan suara
import Mapbox from "@rnmapbox/maps";
import * as Speech from "expo-speech";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LngLat } from "../components/sc/CampusMap";
import { MapPin } from "../components/sc/MapPin";
import { IkonGedung, ScIcon, type ScIconName } from "../components/sc/ScIcon";
import { WaveBars } from "../components/sc/WaveBars";
import { POIS, type POI } from "../data/poi";
import { useUserCoords } from "../hooks/useUserCoords";
import { useWalkingRoute } from "../hooks/useWalkingRoute";
import { font, sc, shadow } from "../theme/sc";
import { menitJalan, perkiraanTiba, teksJarak } from "../utils/jarak";
import { bulatkanMeter, progresRute, type Aksi } from "../utils/rute";

const IKON_AKSI: Record<Aksi, ScIconName> = {
  mulai: "arrow-up", lurus: "arrow-up", kiri: "turn-left", kanan: "turn-right", putar: "turn-left", tiba: "flag",
};

const AMBANG_TIBA_M = 15;
const AMBANG_DEKAT_M = 25;

export default function NavigasiScreen() {
  const { id, dari } = useLocalSearchParams<{ id?: string; dari?: string }>();
  const tujuan = POIS.find((p) => p.id === id);
  const asal = dari ? POIS.find((p) => p.id === dari) : undefined;

  if (!tujuan) {
    return (
      <View style={[styles.screen, styles.kosong]}>
        <Text style={styles.kosongJudul}>Tujuan tidak ditemukan</Text>
        <Pressable onPress={berhenti} accessibilityRole="button" style={styles.btnBahaya}>
          <Text style={styles.btnBahayaText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }
  return <Panduan tujuan={tujuan} asal={asal} />;
}

function Panduan({ tujuan, asal }: { tujuan: POI; asal?: POI }) {
  const insets = useSafeAreaInsets();
  const { coords, live } = useUserCoords();
  const [suara, setSuara] = useState(true);

  // Bila asal dipilih manual, posisi dianggap diam di gedung itu (berguna untuk uji coba)
  const posisi = useMemo<LngLat>(
    () => (asal ? [asal.lng, asal.lat] : [coords.longitude, coords.latitude]),
    [asal, coords.latitude, coords.longitude],
  );
  const tujuanLL = useMemo<LngLat>(() => [tujuan.lng, tujuan.lat], [tujuan]);
  const kunci = asal ? `poi:${asal.id}` : live ? "live" : "estimasi";

  const rute = useWalkingRoute({ asal: posisi, tujuan: tujuanLL, namaTujuan: tujuan.nama, kunci });
  const progres = useMemo(() => progresRute(rute.coords, rute.cum, posisi), [rute.coords, rute.cum, posisi]);

  const sisa = Math.max(0, rute.total - progres.s);
  const tiba = sisa < AMBANG_TIBA_M;
  const idx = tiba ? -1 : rute.langkah.findIndex((l) => l.mulaiM > progres.s + 5);
  const berikut = idx >= 0 ? rute.langkah[idx] : rute.langkah[rute.langkah.length - 1];
  const jarakManuver = idx >= 0 ? Math.max(0, berikut.mulaiM - progres.s) : 0;
  const dekat = !tiba && jarakManuver <= AMBANG_DEKAT_M;

  // Langkah terakhir sebelum sampai ("tiba") ditampilkan sebagai "lurus menuju tujuan"
  const aksi: Aksi = tiba ? "tiba" : berikut.aksi === "tiba" ? "lurus" : berikut.aksi;
  const judul = tiba ? "Tiba" : `${bulatkanMeter(jarakManuver)} m`;
  const teksUtama = tiba
    ? `Anda sudah sampai di ${tujuan.nama}`
    : berikut.aksi === "tiba"
      ? `Lurus menuju ${tujuan.nama}`
      : berikut.teks;
  const ikon: ScIconName = IKON_AKSI[aksi];
  const ucapan = tiba
    ? `Anda telah tiba di ${tujuan.nama}`
    : `${teksUtama}, ${bulatkanMeter(jarakManuver)} meter lagi`;

  const ucap = useEffectEvent((teks: string) => {
    if (!suara) return;
    Speech.stop();
    Speech.speak(teks, { language: "id-ID" });
  });

  // Suara: sekali saat langkah berikutnya berganti, sekali lagi saat sudah dekat belokan
  useEffect(() => {
    ucap(tiba ? `Anda telah tiba di ${tujuan.nama}` : `Dalam ${bulatkanMeter(jarakManuver)} meter, ${teksUtama}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, tiba]);
  useEffect(() => {
    if (dekat) ucap(`${teksUtama} sekarang`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dekat, idx]);
  useEffect(() => () => void Speech.stop(), []);

  const garis = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: rute.coords },
    }),
    [rute.coords],
  );

  return (
    <View style={styles.screen}>
      <Mapbox.MapView style={StyleSheet.absoluteFill} scaleBarEnabled={false} compassEnabled={false}>
        <Mapbox.Camera
          centerCoordinate={posisi}
          zoomLevel={17.5}
          animationMode="easeTo"
          animationDuration={700}
          padding={{ paddingTop: 140, paddingBottom: 340, paddingLeft: 0, paddingRight: 0 }}
        />
        {rute.coords.length > 1 && (
          <Mapbox.ShapeSource id="sc-rute" shape={garis}>
            <Mapbox.LineLayer
              id="sc-rute-garis"
              style={{ lineColor: "#5FB5AC", lineWidth: 6, lineCap: "round", lineJoin: "round", lineOpacity: 0.95 }}
            />
          </Mapbox.ShapeSource>
        )}
        <Mapbox.MarkerView coordinate={tujuanLL} anchor={{ x: 0.5, y: 1 }} allowOverlap>
          <MapPin terpilih />
        </Mapbox.MarkerView>
        <Mapbox.MarkerView coordinate={posisi} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
          <View style={styles.saya}>
            <ScIcon name={ikon} size={22} color="#6B4A00" strokeWidth={2.4} />
          </View>
        </Mapbox.MarkerView>
      </Mapbox.MapView>

      <View style={[styles.instruksi, shadow.md, { top: insets.top + 8 }]}>
        <View style={styles.instruksiIkon}>
          <ScIcon name={ikon} size={30} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <View style={styles.instruksiTeks}>
          <Text style={styles.jarak}>{judul}</Text>
          <Text style={styles.arahan}>{teksUtama}</Text>
        </View>
      </View>

      <View style={[styles.sheet, shadow.md, { paddingBottom: 26 + insets.bottom }]}>
        <View style={styles.grabber} />

        <View style={styles.menuju}>
          <View style={styles.menujuIkon}>
            <IkonGedung size={28} />
          </View>
          <View style={styles.menujuTeks}>
            <Text style={styles.overline}>MENUJU</Text>
            <Text numberOfLines={1} style={styles.nama}>{tujuan.nama}</Text>
          </View>
        </View>

        <View style={styles.statistik}>
          <View style={styles.stat}>
            <Text style={styles.statNilai}>{teksJarak(sisa)}</Text>
            <Text style={styles.statLabel}>Sisa jarak</Text>
          </View>
          <View style={styles.statGaris} />
          <View style={[styles.stat, styles.statPad]}>
            <Text style={styles.statNilai}>{tiba ? 0 : menitJalan(sisa)} mnt</Text>
            <Text style={styles.statLabel}>Durasi</Text>
          </View>
          <View style={styles.statGaris} />
          <View style={[styles.stat, styles.statPad]}>
            <Text style={[styles.statNilai, { color: sc.amber }]}>{perkiraanTiba(sisa)}</Text>
            <Text style={styles.statLabel}>Tiba</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (suara) Speech.stop();
            setSuara((v) => !v);
          }}
          accessibilityRole="switch"
          accessibilityState={{ checked: suara }}
          accessibilityLabel="Panduan suara"
          style={styles.suara}
        >
          <View style={styles.suaraIkon}>
            <ScIcon name="headphones" size={24} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.suaraTeks}>
            <Text style={styles.suaraJudul}>{suara ? "Panduan suara aktif" : "Panduan suara mati"}</Text>
            <Text numberOfLines={1} style={styles.suaraKutipan}>{`"${ucapan}"`}</Text>
          </View>
          <WaveBars aktif={suara} />
        </Pressable>

        {!rute.akurat && (
          <Text style={styles.catatan}>
            Rute berupa garis lurus (perkiraan). Rute jalan kaki memerlukan koneksi dan token Mapbox.
          </Text>
        )}

        <Pressable onPress={berhenti} accessibilityRole="button" style={styles.btnBahaya}>
          <Text style={styles.btnBahayaText}>{tiba ? "Selesai" : "Hentikan Navigasi"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function berhenti() {
  Speech.stop();
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: sc.mapBg },
  kosong: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  kosongJudul: { fontFamily: font.head, fontSize: 20, color: sc.ink900 },
  saya: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: sc.yellow,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF",
  },
  instruksi: {
    position: "absolute", left: 24, right: 24, flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: sc.ink800, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 22,
  },
  instruksiIkon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: sc.tealBright,
    alignItems: "center", justifyContent: "center",
  },
  instruksiTeks: { flex: 1, minWidth: 0, gap: 3 },
  jarak: { fontFamily: font.headXBold, fontSize: 26, lineHeight: 31, letterSpacing: -0.65, color: "#FFFFFF" },
  arahan: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, color: "#9FB5B2" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 24, gap: 18,
  },
  grabber: { alignSelf: "flex-start", width: 40, height: 5, borderRadius: 3, backgroundColor: "#E3EBE9" },
  menuju: { flexDirection: "row", alignItems: "center", gap: 12 },
  menujuIkon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: sc.tile,
    alignItems: "center", justifyContent: "center",
  },
  menujuTeks: { flex: 1, minWidth: 0, gap: 2 },
  overline: { fontFamily: font.bold, fontSize: 10, lineHeight: 13, letterSpacing: 0.6, color: sc.muted },
  nama: { fontFamily: font.head, fontSize: 17, lineHeight: 23, letterSpacing: -0.255, color: sc.ink800 },
  statistik: {
    flexDirection: "row", alignItems: "center", backgroundColor: sc.bg, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  stat: { flex: 1, gap: 2 },
  statPad: { paddingLeft: 16 },
  statNilai: { fontFamily: font.head, fontSize: 24, lineHeight: 32, letterSpacing: -0.36, color: sc.ink800 },
  statLabel: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.muted },
  statGaris: { width: 1, height: 30, backgroundColor: "#E3EBE9" },
  suara: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EDFAF8",
    borderRadius: 18, paddingLeft: 14, paddingRight: 16, paddingVertical: 12,
  },
  suaraIkon: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: sc.teal,
    alignItems: "center", justifyContent: "center",
  },
  suaraTeks: { flex: 1, minWidth: 0, gap: 2 },
  suaraJudul: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: sc.tealDeep },
  suaraKutipan: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.ink500 },
  catatan: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: sc.muted, marginTop: -6 },
  btnBahaya: {
    height: 56, borderRadius: 12, backgroundColor: sc.dangerSoft,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 16,
  },
  btnBahayaText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: sc.dangerText },
});
