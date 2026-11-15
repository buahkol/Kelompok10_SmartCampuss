// 05 · Pindai Gedung — pratinjau kamera langsung; pengguna menekan tombol rana untuk memotret,
// foto dikirim ke model pengenal fasad, dan status/hasilnya tampil di sheet bawah.
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { FacilityChip } from "../components/sc/FacilityChip";
import { PilihGedungModal } from "../components/sc/PilihGedungModal";
import { IkonGedung, ScIcon } from "../components/sc/ScIcon";
import type { FasilitasTipe } from "../data/fasilitas";
import { POIS, type POI } from "../data/poi";
import { useUserCoords } from "../hooks/useUserCoords";
import { kenaliGedung, type FotoPindai, type KandidatGedung } from "../services/pengenalan";
import { font, sc } from "../theme/sc";
import { gedungTerdekat, infoGedung } from "../utils/gedung";

// Setelah sekian detik tanpa jawaban, beri tahu bahwa Space Hugging Face mungkin sedang bangun
const DETIK_SERVER_LAMBAT = 8;
// AR03: setelah sekian kali berturut-turut kurang yakin, tampilkan saran pemotretan
const SARAN_SETELAH = 2;
const DURASI_DEMO_MS = 1400;

const DESAIN_W = 390;
const DESAIN_H = 844;
const FRAME = 250;

const JENDELA_X = [168, 210, 252];
const JENDELA_Y = [290, 346, 402, 458];

type Kandidat = { poi: POI; yakin: number };
type Fase =
  | { t: "bidik" }
  | { t: "memotret" }
  | { t: "menganalisis"; foto: FotoPindai | null; mulai: number }
  | { t: "dikenali"; foto: FotoPindai | null; poi: POI; yakin: number }
  | { t: "tidak-yakin"; foto: FotoPindai | null; kandidat: Kandidat[] }
  | { t: "gagal"; foto: FotoPindai | null; pesan: string; detail?: string };

const keKandidat = (daftar: KandidatGedung[]): Kandidat[] =>
  daftar.flatMap((k) => {
    const poi = POIS.find((p) => p.id === k.poiId);
    return poi ? [{ poi, yakin: Math.round(k.yakin) }] : [];
  });

const umumkan = (teks: string) => AccessibilityInfo.announceForAccessibility(teks);

export default function PindaiGedungScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { coords } = useUserCoords();
  const [izin, mintaIzin] = useCameraPermissions();
  const kamera = izin?.granted === true;
  const kameraRef = useRef<CameraView>(null);
  const [siap, setSiap] = useState(false);
  const [fase, setFase] = useState<Fase>({ t: "bidik" });
  const [sekarang, setSekarang] = useState(0);
  const [kurangYakinBeruntun, setKurangYakinBeruntun] = useState(0);
  const [pilihManual, setPilihManual] = useState(false);
  // Penanda permintaan aktif: hasil dari permintaan yang sudah dibatalkan/diganti diabaikan
  const permintaan = useRef(0);
  const [garis] = useState(() => new Animated.Value(0));
  const [kilat] = useState(() => new Animated.Value(0));

  // Mode demo (tanpa izin kamera): gedung terdekat, tiap pemotretan pindah ke kandidat berikutnya
  const kandidatDemo = gedungTerdekat(coords);
  const [idxDemo, setIdxDemo] = useState(0);

  const s = width / DESAIN_W;
  const sibuk = fase.t === "memotret" || fase.t === "menganalisis";
  const detik = fase.t === "menganalisis" ? Math.max(0, Math.floor((sekarang - fase.mulai) / 1000)) : 0;
  const foto = "foto" in fase ? fase.foto : null;
  const bisaMemotret = fase.t === "bidik" && (!kamera || siap);

  // Penghitung waktu tunggu selama analisis
  useEffect(() => {
    if (fase.t !== "menganalisis") return;
    const timer = setInterval(() => setSekarang(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [fase.t]);

  // Garis pindai hanya bergerak saat sistem benar-benar sedang bekerja
  useEffect(() => {
    if (!sibuk) return;
    garis.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(garis, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(garis, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [garis, sibuk]);

  const mulaiAnalisis = (f: FotoPindai | null) => {
    const id = ++permintaan.current;
    const mulai = Date.now();
    setSekarang(mulai);
    setFase({ t: "menganalisis", foto: f, mulai });
    return id;
  };

  const terimaHasil = (f: FotoPindai | null, status: "dikenali" | "tidak-yakin", kandidat: Kandidat[]) => {
    const utama = kandidat[0];
    if (status === "dikenali" && utama) {
      setKurangYakinBeruntun(0);
      setFase({ t: "dikenali", foto: f, poi: utama.poi, yakin: utama.yakin });
      umumkan(`${utama.poi.nama} terdeteksi, keyakinan ${utama.yakin} persen`);
      return;
    }
    setKurangYakinBeruntun((n) => n + 1);
    setFase({ t: "tidak-yakin", foto: f, kandidat });
    umumkan("Gedung belum dapat dipastikan. Coba foto ulang atau pilih gedung secara manual.");
  };

  const analisis = async (f: FotoPindai) => {
    const id = mulaiAnalisis(f);
    try {
      const r = await kenaliGedung(f);
      if (id !== permintaan.current) return;
      terimaHasil(f, r.status, keKandidat(r.status === "dikenali" ? [r] : r.kandidat));
    } catch (e) {
      if (id !== permintaan.current) return;
      setFase({
        t: "gagal",
        foto: f,
        pesan: "Tidak dapat terhubung ke server AI. Periksa koneksi internet, lalu coba lagi.",
        detail: e instanceof Error ? e.message : undefined,
      });
      umumkan("Gagal terhubung ke server AI.");
    }
  };

  const analisisDemo = () => {
    const id = mulaiAnalisis(null);
    const d = kandidatDemo[idxDemo % Math.max(1, kandidatDemo.length)];
    const yakin = Math.max(60, 92 - (idxDemo % Math.max(1, kandidatDemo.length)) * 5);
    setIdxDemo((i) => i + 1);
    setTimeout(() => {
      if (id !== permintaan.current) return;
      terimaHasil(null, d ? "dikenali" : "tidak-yakin", d ? [{ poi: d.poi, yakin }] : []);
    }, DURASI_DEMO_MS);
  };

  const potret = async () => {
    if (!bisaMemotret) return;
    if (!kamera) {
      analisisDemo();
      return;
    }
    if (!kameraRef.current) return;
    setFase({ t: "memotret" });
    kilat.setValue(0.85);
    Animated.timing(kilat, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    let hasilFoto: FotoPindai;
    try {
      const f = await kameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      hasilFoto = { uri: f.uri, base64: f.base64 };
    } catch (e) {
      setFase({
        t: "gagal",
        foto: null,
        pesan: "Foto gagal diambil. Pastikan kamera tidak dipakai aplikasi lain, lalu coba lagi.",
        detail: e instanceof Error ? e.message : undefined,
      });
      return;
    }
    await analisis(hasilFoto);
  };

  // Kembali ke mode membidik; membatalkan analisis yang sedang berjalan
  const fotoUlang = () => {
    permintaan.current++;
    setFase({ t: "bidik" });
  };
  const kirimUlang = () => {
    if (foto) void analisis(foto);
  };
  const tutup = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const bukaDetail = (poi: POI) => router.push({ pathname: "/gedung/[id]", params: { id: poi.id } });

  const fx = 70 * s;
  const fy = 236 * s;
  const fs = FRAME * s;

  const petunjuk = (() => {
    switch (fase.t) {
      case "bidik":
        if (!kamera) return "Mode demo — izinkan kamera untuk memindai";
        return siap ? "Posisikan fasad gedung di dalam bingkai" : "Menyiapkan kamera…";
      case "memotret":
        return "Memotret…";
      case "menganalisis":
        return "Menganalisis fasad…";
      case "dikenali":
        return "Gedung dikenali";
      case "tidak-yakin":
        return "Gedung belum dapat dipastikan";
      case "gagal":
        return "Terjadi kesalahan";
    }
  })();

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
      {/* Foto yang dikirim dibekukan di layar agar pengguna tahu gambar mana yang sedang dianalisis */}
      {foto && <Image source={{ uri: foto.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
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
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF", opacity: kilat }]} />

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
        {sibuk && (
          <Animated.View
            style={{
              position: "absolute", left: 14 * s, right: 14 * s, top: 0, height: 3,
              transform: [{ translateY: garis.interpolate({ inputRange: [0, 1], outputRange: [16 * s, fs - 20 * s] }) }],
            }}
          >
            <LinearGradient
              colors={["rgba(255,196,61,0)", "#FFD469", "rgba(255,196,61,0)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 2 }}
            />
          </Animated.View>
        )}
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

      <View style={[styles.petunjuk, { top: 508 * s }]} pointerEvents="none" accessibilityLiveRegion="polite">
        {sibuk && <ActivityIndicator size="small" color="#EAFBF8" />}
        <Text style={styles.petunjukText}>{petunjuk}</Text>
      </View>

      {fase.t === "bidik" || fase.t === "memotret" ? (
        <View style={[styles.bilahRana, { paddingBottom: 28 + insets.bottom }]}>
          {!kamera && izin?.canAskAgain !== false && (
            <Pressable onPress={mintaIzin} accessibilityRole="button" style={styles.izin}>
              <ScIcon name="camera" size={16} color={sc.tealDeep} />
              <Text style={styles.izinText}>Izinkan kamera</Text>
            </Pressable>
          )}
          <Pressable
            onPress={potret}
            disabled={!bisaMemotret}
            accessibilityRole="button"
            accessibilityLabel="Ambil foto gedung"
            accessibilityState={{ disabled: !bisaMemotret, busy: fase.t === "memotret" }}
            style={({ pressed }) => [styles.rana, !bisaMemotret && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.92 }] }]}
          >
            <View style={styles.ranaIsi}>
              {fase.t === "memotret" ? (
                <ActivityIndicator color={sc.tealDark} />
              ) : (
                <ScIcon name="camera" size={26} color={sc.tealDark} strokeWidth={2} />
              )}
            </View>
          </Pressable>
          <Text style={styles.ranaLabel}>{fase.t === "memotret" ? "Memotret…" : "Ketuk untuk memindai"}</Text>
        </View>
      ) : (
        <View style={[styles.sheet, { paddingBottom: 26 + insets.bottom }]}>
          <View style={styles.grabber} />
          <LembarHasil
            fase={fase}
            detik={detik}
            saran={kurangYakinBeruntun >= SARAN_SETELAH}
            onBukaDetail={bukaDetail}
          />
          <View style={styles.tombolBaris}>
            {fase.t === "menganalisis" ? (
              <Pressable onPress={fotoUlang} accessibilityRole="button" style={[styles.btn, styles.btnSekunder]}>
                <Text style={[styles.btnText, { color: sc.tealDark }]}>Batal</Text>
              </Pressable>
            ) : (
              <>
                <Pressable onPress={fotoUlang} accessibilityRole="button" style={[styles.btn, styles.btnSekunder]}>
                  <Text style={[styles.btnText, { color: sc.tealDark }]}>Foto Ulang</Text>
                </Pressable>
                {fase.t === "dikenali" && (
                  <Pressable onPress={() => bukaDetail(fase.poi)} accessibilityRole="button" style={[styles.btn, styles.btnUtama]}>
                    <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Buka Detail</Text>
                  </Pressable>
                )}
                {fase.t === "tidak-yakin" && (
                  <Pressable onPress={() => setPilihManual(true)} accessibilityRole="button" style={[styles.btn, styles.btnUtama]}>
                    <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Pilih Manual</Text>
                  </Pressable>
                )}
                {fase.t === "gagal" && foto && (
                  <Pressable onPress={kirimUlang} accessibilityRole="button" style={[styles.btn, styles.btnUtama]}>
                    <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Kirim Ulang</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      )}

      <PilihGedungModal
        visible={pilihManual}
        judul="Pilih gedung"
        onClose={() => setPilihManual(false)}
        onPilih={(p) => {
          setPilihManual(false);
          if (p !== "me") bukaDetail(p);
        }}
      />
    </View>
  );
}

type LembarProps = {
  fase: Exclude<Fase, { t: "bidik" } | { t: "memotret" }>;
  detik: number;
  saran: boolean;
  onBukaDetail: (poi: POI) => void;
};

function LembarHasil({ fase, detik, saran, onBukaDetail }: LembarProps) {
  const badge = {
    menganalisis: { teks: `MENGANALISIS · ${detik} DTK`, bg: sc.tile, fg: sc.ink500 },
    dikenali: { teks: `TERDETEKSI ${fase.t === "dikenali" ? fase.yakin : 0}%`, bg: sc.greenSoft, fg: sc.greenText },
    "tidak-yakin": { teks: "KURANG YAKIN", bg: sc.yellowSoft, fg: sc.yellowText },
    gagal: { teks: "GAGAL", bg: sc.dangerSoft, fg: sc.dangerText },
  }[fase.t];
  const judul = {
    menganalisis: "Mengenali gedung…",
    dikenali: fase.t === "dikenali" ? fase.poi.nama : "",
    "tidak-yakin": "Belum yakin",
    gagal: "Gagal memindai",
  }[fase.t];
  const chips =
    fase.t === "dikenali" ? (Object.keys(infoGedung(fase.poi.id).fasilitas) as FasilitasTipe[]).slice(0, 3) : [];

  return (
    <>
      <View style={styles.baris}>
        <View style={styles.ikonKotak}>
          {fase.t === "menganalisis" ? <ActivityIndicator color={sc.tealDark} /> : <IkonGedung size={38} />}
        </View>
        <View style={styles.teks}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <View style={[styles.titik, { backgroundColor: badge.fg }]} />
            <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.teks}</Text>
          </View>
          <Text numberOfLines={1} style={styles.nama}>{judul}</Text>
        </View>
      </View>

      {fase.t === "menganalisis" && (
        <Text style={styles.keterangan}>
          {detik < DETIK_SERVER_LAMBAT
            ? "Foto sedang dikirim ke model AI untuk dikenali."
            : "Server AI sedang dimuat — permintaan pertama bisa memakan waktu hingga 30 detik."}
        </Text>
      )}

      {fase.t === "dikenali" && (
        <View style={styles.chips}>
          {chips.map((t) => <FacilityChip key={t} tipe={t} />)}
        </View>
      )}

      {fase.t === "tidak-yakin" && (
        <View style={{ gap: 10 }}>
          {fase.kandidat.length > 0 && (
            <>
              <Text style={styles.keterangan}>Mungkin salah satu dari:</Text>
              <View style={styles.chips}>
                {fase.kandidat.map((k) => (
                  <Pressable
                    key={k.poi.id}
                    onPress={() => onBukaDetail(k.poi)}
                    accessibilityRole="button"
                    accessibilityLabel={`Buka ${k.poi.nama}, keyakinan ${k.yakin} persen`}
                    style={styles.kandidat}
                  >
                    <Text style={styles.kandidatText}>{k.poi.nama}</Text>
                    <Text style={styles.kandidatPersen}>{k.yakin}%</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <Text style={styles.keterangan}>
            {saran
              ? "Tips: pastikan cahaya cukup, mundur hingga seluruh fasad masuk bingkai, dan tahan ponsel dengan stabil."
              : "Coba foto ulang dari sudut lain, atau pilih gedung secara manual."}
          </Text>
        </View>
      )}

      {fase.t === "gagal" && (
        <View style={{ gap: 4 }}>
          <Text style={styles.keterangan}>{fase.pesan}</Text>
          {fase.detail && <Text numberOfLines={2} style={styles.detail}>{fase.detail}</Text>}
        </View>
      )}
    </>
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
    position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(8,42,49,0.72)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10,
  },
  petunjukText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: "#EAFBF8" },
  bilahRana: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 12 },
  rana: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)",
  },
  ranaIsi: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  ranaLabel: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: "#FFFFFF" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 24, gap: 16,
  },
  grabber: { alignSelf: "flex-start", width: 40, height: 5, borderRadius: 3, backgroundColor: "#E3EBE9" },
  baris: { flexDirection: "row", alignItems: "center", gap: 14 },
  ikonKotak: { width: 52, height: 52, borderRadius: 16, backgroundColor: sc.mint, alignItems: "center", justifyContent: "center" },
  teks: { flex: 1, minWidth: 0, gap: 4, alignItems: "flex-start" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  titik: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontFamily: font.bold, fontSize: 10, lineHeight: 13, letterSpacing: 0.6 },
  nama: { fontFamily: font.headXBold, fontSize: 26, lineHeight: 31, letterSpacing: -0.65, color: sc.ink800, alignSelf: "stretch" },
  keterangan: { fontFamily: font.medium, fontSize: 13, lineHeight: 19, color: sc.ink700 },
  detail: { fontFamily: font.regular, fontSize: 11, lineHeight: 15, color: sc.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, minHeight: 38 },
  kandidat: {
    flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: sc.line,
    backgroundColor: sc.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  kandidatText: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: sc.ink800 },
  kandidatPersen: { fontFamily: font.bold, fontSize: 11, lineHeight: 15, color: sc.muted },
  tombolBaris: { flexDirection: "row", gap: 10 },
  izin: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: sc.mint,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
  },
  izinText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: sc.tealDeep },
  btn: { flex: 1, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnSekunder: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: sc.teal },
  btnUtama: { backgroundColor: sc.tealDark },
  btnText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
});
