// 06 · Trigger Lokasi Otomatis — muncul sendiri saat pengguna masuk radius sebuah POI.
// Peta digambar sebagai ilustrasi (seperti di Figma); jarak dihitung dari GPS bila ada.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useEffectEvent, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { MapPin } from "../components/sc/MapPin";
import { ScIcon } from "../components/sc/ScIcon";
import { WaveBars } from "../components/sc/WaveBars";
import { POIS } from "../data/poi";
import { useUserCoords } from "../hooks/useUserCoords";
import { font, sc, shadow } from "../theme/sc";
import { jarakMeter } from "../utils/geofence";
import { menitJalan, perkiraanTiba, teksJarak } from "../utils/jarak";
import {
  hentikanNarasi,
  jedaNarasi,
  lanjutNarasi,
  pasangPendengarNarasi,
  putarNarasi,
  type StatusNarasi,
} from "../utils/narasi";

const W = 390;
const H = 844;

export default function TriggerLokasiScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { coords, live } = useUserCoords();
  const poi = POIS.find((p) => p.id === id) ?? POIS[0];
  const [suara, setSuara] = useState(true);
  const [narasi, setNarasi] = useState<StatusNarasi>("berhenti");
  const bicara = narasi === "memutar";

  // Tanpa GPS (mis. emulator) jarak diperagakan 320 m seperti di desain
  const jarak = live ? jarakMeter(coords, poi) : 320;
  const dalam = jarak <= poi.radiusM;
  const kutipan = dalam ? `Anda telah tiba di ${poi.nama}` : `${poi.nama}, ${teksJarak(jarak)} lagi`;

  useEffect(
    () => pasangPendengarNarasi((poiId, status) => setNarasi(poiId === poi.id ? status : "berhenti")),
    [poi.id],
  );

  const putar = () => putarNarasi(poi);
  const mulai = useEffectEvent(() => {
    // Getar tepat saat narasi dimulai supaya pengguna sadar sudah dekat, tanpa menatap layar
    Vibration.vibrate([0, 250, 120, 250]);
    if (suara) putar();
  });
  useEffect(() => {
    mulai();
    return () => hentikanNarasi();
  }, [poi.id]);

  const berhenti = () => {
    // Lewat narasi.ts agar sesi narasi ikut direset, bukan hanya Speech.stop()
    hentikanNarasi();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin slice" style={StyleSheet.absoluteFill}>
        <Rect width={W} height={H} fill={sc.mapBg} />
        <Rect x={-40} y={110} width={220} height={200} rx={60} fill="#CDEBD8" />
        <Rect x={240} y={330} width={230} height={210} rx={60} fill="#CDEBD8" />
        <Rect x={60} y={560} width={200} height={180} rx={60} fill="#CDEBD8" />
        <Rect x={28} y={134} width={128} height={92} rx={24} fill="#C6E6F7" />
        <Rect x={190} y={-40} width={20} height={900} rx={10} fill="#FFFFFF" />
        <Rect x={-50} y={300} width={480} height={22} rx={11} fill="#FFFFFF" transform="rotate(7 190 311)" />
        <Rect x={-20} y={440} width={300} height={18} rx={9} fill="#FFFFFF" transform="rotate(-10 130 449)" />
        <Path d="M164 436C150 470 150 520 164 560" stroke="#9ED5CE" strokeWidth={5} strokeLinecap="round" fill="none" />
        <Circle cx={200} cy={330} r={88} fill="rgba(14,156,146,0.16)" stroke={sc.teal} strokeWidth={2} strokeDasharray="7 6" />
        <Circle cx={196} cy={414} r={22} fill="rgba(14,156,146,0.22)" />
        <Circle cx={196} cy={414} r={10} fill="#FFFFFF" />
        <Circle cx={196} cy={414} r={6} fill={sc.teal} />
      </Svg>
      <View style={{ position: "absolute", left: (width - 36) / 2, top: 292 }} pointerEvents="none">
        <MapPin skala={1.2} terpilih />
      </View>

      <View style={[styles.instruksi, shadow.md, { top: insets.top + 8 }]}>
        <View style={styles.instruksiIkon}>
          <ScIcon name="turn-right" size={30} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <View style={styles.instruksiTeks}>
          <Text numberOfLines={1} style={styles.judul}>{poi.nama}</Text>
          <Text style={styles.arahan}>{dalam ? "Berada di dekatmu" : "Menuju lokasi"}</Text>
        </View>
      </View>

      <View style={[styles.sheet, shadow.md, { paddingBottom: 26 + insets.bottom }]}>
        <View style={styles.grabber} />
        <View style={styles.menuju}>
          <View style={styles.menujuIkon}>
            <ScIcon name="flag" size={22} color="#F26A4B" strokeWidth={2} />
          </View>
          <View style={styles.menujuTeks}>
            <Text style={styles.overline}>MENUJU</Text>
            <Text numberOfLines={1} style={styles.nama}>{poi.nama}</Text>
          </View>
        </View>

        <View style={styles.statistik}>
          <View style={styles.stat}>
            <Text style={styles.statNilai}>{teksJarak(jarak)}</Text>
            <Text style={styles.statLabel}>Sisa jarak</Text>
          </View>
          <View style={styles.statGaris} />
          <View style={[styles.stat, styles.statPad]}>
            <Text style={styles.statNilai}>{dalam ? 0 : menitJalan(jarak)} mnt</Text>
            <Text style={styles.statLabel}>Durasi</Text>
          </View>
          <View style={styles.statGaris} />
          <View style={[styles.stat, styles.statPad]}>
            <Text style={[styles.statNilai, { color: sc.amber }]}>{perkiraanTiba(jarak)}</Text>
            <Text style={styles.statLabel}>Tiba</Text>
          </View>
        </View>

        <View style={styles.suara}>
          <Pressable
            onPress={() => {
              if (suara) hentikanNarasi();
              else putar();
              setSuara((v) => !v);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: suara }}
            accessibilityLabel="Panduan suara"
            style={styles.suaraSakelar}
          >
            <View style={styles.suaraIkon}>
              <ScIcon name="headphones" size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.suaraTeks}>
              <Text style={styles.suaraJudul}>
                {!suara ? "Panduan suara mati" : narasi === "jeda" ? "Panduan suara dijeda" : "Panduan suara aktif"}
              </Text>
              <Text numberOfLines={1} style={styles.suaraKutipan}>{`"${kutipan}"`}</Text>
            </View>
            <WaveBars aktif={suara && bicara} />
          </Pressable>
          {suara && narasi !== "berhenti" && (
            <Pressable
              onPress={narasi === "memutar" ? jedaNarasi : lanjutNarasi}
              accessibilityRole="button"
              accessibilityLabel={narasi === "memutar" ? "Jeda panduan suara" : "Lanjutkan panduan suara"}
              style={styles.suaraTombol}
            >
              <ScIcon name={narasi === "memutar" ? "pause" : "play"} size={20} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <Pressable onPress={berhenti} accessibilityRole="button" style={styles.btnBahaya}>
          <Text style={styles.btnBahayaText}>Hentikan Navigasi</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: sc.mapBg },
  instruksi: {
    position: "absolute", left: 24, right: 24, flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: sc.ink800, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 22,
  },
  instruksiIkon: { width: 56, height: 56, borderRadius: 16, backgroundColor: sc.tealBright, alignItems: "center", justifyContent: "center" },
  instruksiTeks: { flex: 1, minWidth: 0, gap: 3 },
  judul: { fontFamily: font.headXBold, fontSize: 26, lineHeight: 31, letterSpacing: -0.65, color: "#FFFFFF" },
  arahan: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, color: "#9FB5B2" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 24, gap: 18,
  },
  grabber: { alignSelf: "flex-start", width: 40, height: 5, borderRadius: 3, backgroundColor: "#E3EBE9" },
  menuju: { flexDirection: "row", alignItems: "center", gap: 12 },
  menujuIkon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFE6DE", alignItems: "center", justifyContent: "center" },
  menujuTeks: { flex: 1, minWidth: 0, gap: 2 },
  overline: { fontFamily: font.bold, fontSize: 10, lineHeight: 13, letterSpacing: 0.6, color: sc.muted },
  nama: { fontFamily: font.head, fontSize: 17, lineHeight: 23, letterSpacing: -0.255, color: sc.ink800 },
  statistik: { flexDirection: "row", alignItems: "center", backgroundColor: sc.bg, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16 },
  stat: { flex: 1, gap: 2 },
  statPad: { paddingLeft: 16 },
  statNilai: { fontFamily: font.head, fontSize: 24, lineHeight: 32, letterSpacing: -0.36, color: sc.ink800 },
  statLabel: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.muted },
  statGaris: { width: 1, height: 30, backgroundColor: "#E3EBE9" },
  suara: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EDFAF8", borderRadius: 18, paddingLeft: 14, paddingRight: 16, paddingVertical: 12 },
  suaraSakelar: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  suaraTombol: { width: 40, height: 40, borderRadius: 20, backgroundColor: sc.teal, alignItems: "center", justifyContent: "center" },
  suaraIkon: { width: 40, height: 40, borderRadius: 13, backgroundColor: sc.teal, alignItems: "center", justifyContent: "center" },
  suaraTeks: { flex: 1, minWidth: 0, gap: 2 },
  suaraJudul: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: sc.tealDeep },
  suaraKutipan: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.ink500 },
  btnBahaya: { height: 56, borderRadius: 12, backgroundColor: sc.dangerSoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnBahayaText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: sc.dangerText },
});
