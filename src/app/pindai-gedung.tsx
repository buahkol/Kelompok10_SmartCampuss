// 05 · Pindai Gedung — pratinjau kamera langsung + hasil pengenalan gedung di sheet bawah.
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { FacilityChip } from "../components/sc/FacilityChip";
import { IkonGedung, ScIcon } from "../components/sc/ScIcon";
import { POIS, type POI } from "../data/poi";
import type { FasilitasTipe } from "../data/fasilitas";
import { useUserCoords } from "../hooks/useUserCoords";
import { kenaliGedung } from "../services/pengenalan";
import { font, sc } from "../theme/sc";
import { gedungTerdekat, infoGedung } from "../utils/gedung";

const INTERVAL_PINDAI_MS = 2500;

const DESAIN_W = 390;
const DESAIN_H = 844;
const FRAME = 250;

const JENDELA_X = [168, 210, 252];
const JENDELA_Y = [290, 346, 402, 458];

export default function PindaiGedungScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { coords } = useUserCoords();
  const [izin, mintaIzin] = useCameraPermissions();
  const kamera = izin?.granted === true;
  const kameraRef = useRef<CameraView>(null);
  const sibuk = useRef(false);
  const [siap, setSiap] = useState(false);
  const [temuan, setTemuan] = useState<{ poi: POI; yakin: number } | null>(null);
  const [garis] = useState(() => new Animated.Value(0));

  // Mode demo (tanpa izin kamera): gedung terdekat, "Ulangi" pindah ke kandidat berikutnya
  const kandidat = gedungTerdekat(coords);
  const [idx, setIdx] = useState(0);
  const [putaran, setPutaran] = useState(0);
  const [memindaiDemo, setMemindaiDemo] = useState(true);
  const demo = kandidat[idx % Math.max(1, kandidat.length)];

  const s = width / DESAIN_W;
  const hasil: POI | undefined = kamera ? temuan?.poi : demo?.poi;
  const yakin = kamera ? (temuan?.yakin ?? 0) : Math.max(60, 92 - (idx % Math.max(1, kandidat.length)) * 5);
  const chips = hasil ? (Object.keys(infoGedung(hasil.id).fasilitas) as FasilitasTipe[]).slice(0, 3) : [];
  const sedangMemindai = kamera ? temuan === null : memindaiDemo;

  useEffect(() => {
    if (kamera) return;
    const t = setTimeout(() => setMemindaiDemo(false), 1400);
    return () => clearTimeout(t);
  }, [putaran, kamera]);

  // Ambil satu foto lalu minta pengenalan; dilewati bila yang sebelumnya belum selesai
  const pindaiSekali = useEffectEvent(async () => {
    if (sibuk.current || !kameraRef.current) return;
    sibuk.current = true;
    try {
      const foto = await kameraRef.current.takePictureAsync({ quality: 0.5, base64: true, skipProcessing: true, shutterSound: false });
      const r = await kenaliGedung({ uri: foto.uri, base64: foto.base64 });
      const poi = r ? POIS.find((p) => p.id === r.poiId) : undefined;
      if (poi && r) setTemuan({ poi, yakin: Math.round(r.yakin) });
    } catch {
      // kamera belum siap / foto gagal: coba lagi pada putaran berikutnya
    } finally {
      sibuk.current = false;
    }
  });

  useEffect(() => {
    if (!kamera || !siap || temuan) return;
    const timer = setInterval(() => void pindaiSekali(), INTERVAL_PINDAI_MS);
    return () => clearInterval(timer);
  }, [kamera, siap, temuan]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(garis, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(garis, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [garis]);

  const ulangi = () => {
    if (kamera) {
      setTemuan(null);
      return;
    }
    setMemindaiDemo(true);
    setIdx((i) => i + 1);
    setPutaran((p) => p + 1);
  };
  const tutup = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const buka = () => {
    if (hasil) router.push({ pathname: "/gedung/[id]", params: { id: hasil.id } });
  };

  const fx = 70 * s;
  const fy = 236 * s;
  const fs = FRAME * s;

  return (
    <View style={styles.screen}>
      {kamera ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          ref={kameraRef}
          onCameraReady={() => setSiap(true)}
        />
      ) : (
        <LinearGradient colors={["#27465F", "#103C45"]} style={StyleSheet.absoluteFill} />
      )}
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${DESAIN_W} ${DESAIN_H}`}
        preserveAspectRatio="xMidYMin slice"
        style={StyleSheet.absoluteFill}
      >
        {!kamera && (
          <>
        <Rect x={34} y={320} width={120} height={310} rx={8} fill="rgba(12,48,56,0.7)" />
        <Rect x={146} y={258} width={154} height={372} rx={8} fill="rgba(11,58,66,0.8)" />
        <Rect x={292} y={382} width={94} height={248} rx={8} fill="rgba(12,48,56,0.65)" />
        {JENDELA_Y.map((y) =>
          JENDELA_X.map((x) => <Rect key={`${x}-${y}`} x={x} y={y} width={24} height={32} rx={4} fill="rgba(255,196,61,0.4)" />),
        )}
          </>
        )}
        <Rect x={0} y={0} width={DESAIN_W} height={DESAIN_H} fill="rgba(8,42,49,0.32)" />
      </Svg>

      <View style={[styles.header, { top: insets.top + 8 }]}>
        <Pressable onPress={tutup} accessibilityRole="button" accessibilityLabel="Kembali" style={[styles.tombol, styles.tombolKaca]}>
          <ScIcon name="arrow-left" size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.judul}>Pindai Gedung</Text>
        <Pressable onPress={tutup} accessibilityRole="button" accessibilityLabel="Tutup" style={[styles.tombol, styles.tombolKuning]}>
          <ScIcon name="x-circle" size={18} color={sc.yellow} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ position: "absolute", left: fx, top: fy, width: fs, height: fs }} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { borderRadius: 26 * s, backgroundColor: "rgba(255,196,61,0.06)" }]} />
        <Animated.View
          style={{
            position: "absolute", left: 14 * s, right: 14 * s, top: 0, height: 3, opacity: sedangMemindai ? 1 : 0.55,
            transform: [{ translateY: garis.interpolate({ inputRange: [0, 1], outputRange: [16 * s, fs - 20 * s] }) }],
          }}
        >
          <LinearGradient
            colors={["rgba(255,196,61,0)", "#FFD469", "rgba(255,196,61,0)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 2 }}
          />
        </Animated.View>
        <Svg width={fs} height={fs} viewBox="0 0 250 250" style={StyleSheet.absoluteFill}>
          {[
            "M3 36V16a13 13 0 0 1 13-13h20",
            "M247 36V16a13 13 0 0 0-13-13h-20",
            "M3 214v20a13 13 0 0 0 13 13h20",
            "M247 214v20a13 13 0 0 1-13 13h-20",
          ].map((d) => (
            <Path key={d} d={d} stroke={sc.yellow} strokeWidth={4} strokeLinecap="round" fill="none" />
          ))}
        </Svg>
      </View>

      <View style={[styles.petunjuk, { top: 508 * s }]} pointerEvents="none">
        <Text style={styles.petunjukText}>{sedangMemindai ? (kamera ? "Arahkan kamera ke fasad gedung" : "Memindai fasad gedung…") : kamera ? "Gedung terdeteksi" : "Mode demo — izinkan kamera untuk memindai"}</Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: 26 + insets.bottom }]}>
        <View style={styles.grabber} />
        <View style={styles.baris}>
          <View style={styles.ikonKotak}>
            <IkonGedung size={38} />
          </View>
          <View style={styles.teks}>
            <View style={[styles.badge, sedangMemindai && { backgroundColor: sc.tile }]}>
              <View style={[styles.titik, sedangMemindai && { backgroundColor: sc.muted }]} />
              <Text style={[styles.badgeText, sedangMemindai && { color: sc.ink500 }]}>
                {sedangMemindai ? "MEMINDAI…" : `TERDETEKSI ${yakin}%`}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.nama}>{sedangMemindai ? "…" : (hasil?.nama ?? "Tidak dikenali")}</Text>
          </View>
        </View>

        <View style={styles.chips}>
          {!sedangMemindai && chips.map((t) => <FacilityChip key={t} tipe={t} />)}
        </View>

        {!kamera && izin?.canAskAgain !== false && (
          <Pressable onPress={mintaIzin} accessibilityRole="button" style={styles.izin}>
            <Text style={styles.izinText}>Izinkan kamera</Text>
          </Pressable>
        )}
        <View style={styles.tombolBaris}>
          <Pressable onPress={ulangi} accessibilityRole="button" style={[styles.btn, styles.btnSekunder]}>
            <Text style={[styles.btnText, { color: sc.tealDark }]}>Ulangi Pindai</Text>
          </Pressable>
          <Pressable
            onPress={buka}
            disabled={sedangMemindai || !hasil}
            accessibilityRole="button"
            style={[styles.btn, styles.btnUtama, (sedangMemindai || !hasil) && { opacity: 0.5 }]}
          >
            <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Buka Detail</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#103C45" },
  header: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 24 },
  tombol: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  tombolKaca: { backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.2)" },
  tombolKuning: { backgroundColor: "rgba(255,196,61,0.22)", borderColor: "rgba(255,196,61,0.4)" },
  judul: {
    flex: 1, textAlign: "center", fontFamily: font.head, fontSize: 17, lineHeight: 23,
    letterSpacing: -0.255, color: "#FFFFFF",
  },
  petunjuk: {
    position: "absolute", alignSelf: "center", backgroundColor: "rgba(8,42,49,0.72)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10,
  },
  petunjukText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: "#EAFBF8" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 24, gap: 16,
  },
  grabber: { alignSelf: "flex-start", width: 40, height: 5, borderRadius: 3, backgroundColor: "#E3EBE9" },
  baris: { flexDirection: "row", alignItems: "center", gap: 14 },
  ikonKotak: { width: 52, height: 52, borderRadius: 16, backgroundColor: sc.mint, alignItems: "center", justifyContent: "center" },
  teks: { flex: 1, minWidth: 0, gap: 4, alignItems: "flex-start" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#DBF3E7",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9,
  },
  titik: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#178554" },
  badgeText: { fontFamily: font.bold, fontSize: 10, lineHeight: 13, letterSpacing: 0.6, color: "#178554" },
  nama: { fontFamily: font.headXBold, fontSize: 26, lineHeight: 31, letterSpacing: -0.65, color: sc.ink800, alignSelf: "stretch" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, minHeight: 38 },
  tombolBaris: { flexDirection: "row", gap: 10 },
  izin: { alignSelf: "flex-start", backgroundColor: sc.mint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  izinText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: sc.tealDeep },
  btn: { flex: 1, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnSekunder: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: sc.teal },
  btnUtama: { backgroundColor: sc.tealDark },
  btnText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
});
