// 03 · Detail Gedung — ringkasan, rute, narasi audio, fasilitas, dan gedung terdekat
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuildingCard } from "../../components/sc/BuildingCard";
import { BuildingHero } from "../../components/sc/BuildingHero";
import { ScIcon } from "../../components/sc/ScIcon";
import { SectionHeader } from "../../components/sc/SectionHeader";
import { FASILITAS, type FasilitasTipe } from "../../data/fasilitas";
import { KATEGORI_LABEL, POIS, sudahDiisi } from "../../data/poi";
import { useUserCoords } from "../../hooks/useUserCoords";
import { font, sc, shadow } from "../../theme/sc";
import { jarakMeter } from "../../utils/geofence";
import { gedungTerdekat, infoGedung, ringkasanGedung } from "../../utils/gedung";
import { menitJalan, perkiraanTiba, teksJarak } from "../../utils/jarak";
import { hentikanNarasi, putarNarasi, teksNarasi } from "../../utils/narasi";

const TOMBOL_BACK = 44;

export default function DetailGedung() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { coords } = useUserCoords();
  const [tersimpan, setTersimpan] = useState(false);
  const [memutar, setMemutar] = useState(false);

  const poi = POIS.find((p) => p.id === id);

  // Narasi berhenti saat meninggalkan layar
  useEffect(() => () => hentikanNarasi(), []);

  if (!poi) {
    return (
      <View style={[styles.screen, styles.kosong]}>
        <Text style={styles.judul}>Gedung tidak ditemukan</Text>
        <Pressable onPress={kembali} accessibilityRole="button" style={styles.btnSekunder}>
          <Text style={styles.btnSekunderText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const info = infoGedung(poi.id);
  const jarak = jarakMeter(coords, poi);
  const deskripsi = sudahDiisi(poi.deskripsi)
    ? poi.deskripsi
    : (info.deskripsiSingkat ?? "Deskripsi belum tersedia.");
  const menitAudio = Math.max(1, Math.round(teksNarasi(poi).split(/\s+/).length / 150));
  const fasilitas = Object.entries(info.fasilitas) as [FasilitasTipe, string][];
  const terdekat = gedungTerdekat(coords, { kecuali: poi.id, batas: 3 });
  const atas = insets.top + 8;

  const toggleAudio = () => {
    if (memutar) {
      hentikanNarasi();
      return;
    }
    putarNarasi(poi, () => setMemutar(true), () => setMemutar(false));
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <BuildingHero height={260 + Math.max(0, atas - 28)} />
          <Pressable
            onPress={kembali}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            style={[styles.roundBtn, shadow.xs, { top: atas, left: 24 }]}
          >
            <ScIcon name="chevron-left" size={22} color={sc.ink900} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            onPress={() => setTersimpan((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={tersimpan ? "Hapus dari favorit" : "Simpan ke favorit"}
            style={[styles.roundBtn, shadow.xs, { top: atas, right: 24 }]}
          >
            <ScIcon
              name="bookmark"
              size={24}
              color={sc.teal}
              fill={tersimpan ? sc.teal : "none"}
              strokeWidth={1.8}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.head}>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: sc.mint }]}>
                <Text style={[styles.tagText, { color: sc.tealDeep }]}>
                  {KATEGORI_LABEL[poi.kategori].toUpperCase()}
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: sc.greenSoft }]}>
                <Text style={[styles.tagText, { color: sc.greenText }]}>BUKA {info.jam.toUpperCase()}</Text>
              </View>
            </View>
            <Text accessibilityRole="header" style={styles.h1}>{poi.nama}</Text>
            <Text style={styles.desc}>{deskripsi}</Text>
          </View>

          <View style={[styles.route, shadow.brand]}>
            <View style={styles.routeCell}>
              <Text style={styles.routeValue}>{teksJarak(jarak)}</Text>
              <Text style={styles.routeLabel}>Jarak</Text>
            </View>
            <View style={styles.routeSep} />
            <View style={[styles.routeCell, styles.routeCellPad]}>
              <Text style={styles.routeValue}>{menitJalan(jarak)} mnt</Text>
              <Text style={styles.routeLabel}>Jalan kaki</Text>
            </View>
            <View style={styles.routeSep} />
            <View style={[styles.routeCell, styles.routeCellPad]}>
              <Text style={styles.routeValue}>{perkiraanTiba(jarak)}</Text>
              <Text style={styles.routeLabel}>Perkiraan tiba</Text>
            </View>
          </View>

          <Pressable
            onPress={toggleAudio}
            accessibilityRole="button"
            accessibilityLabel={memutar ? "Hentikan narasi" : "Dengar cerita gedung ini"}
            style={styles.audio}
          >
            <View style={styles.audioIcon}>
              <ScIcon name="volume" size={24} color={sc.yellowText} strokeWidth={2} />
            </View>
            <View style={styles.audioText}>
              <Text style={styles.audioTitle}>{memutar ? "Sedang diputar · ketuk untuk berhenti" : "Dengar cerita gedung ini"}</Text>
              <Text style={styles.audioSub}>{menitAudio} menit</Text>
            </View>
          </Pressable>

          {fasilitas.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Fasilitas di gedung ini" />
              <View style={styles.grid}>
                {fasilitas.map(([tipe, ket]) => (
                  <Pressable
                    key={tipe}
                    onPress={() => router.navigate({ pathname: "/fasilitas", params: { tipe } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${FASILITAS[tipe].labelPendek}, ${ket}`}
                    style={[styles.tile, { backgroundColor: FASILITAS[tipe].warna }]}
                  >
                    <ScIcon name={FASILITAS[tipe].ikon} size={28} strokeWidth={1.6} />
                    <View style={styles.tileText}>
                      <Text numberOfLines={1} style={styles.tileTitle}>{FASILITAS[tipe].labelPendek}</Text>
                      <Text numberOfLines={1} style={styles.tileSub}>{ket}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {terdekat.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Gedung terdekat" action="Lihat peta" onAction={() => router.push({ pathname: "/peta-kampus", params: { id: poi.id } })} />
              <View style={styles.list}>
                {terdekat.map((g) => (
                  <BuildingCard
                    key={g.poi.id}
                    nama={g.poi.nama}
                    ringkasan={ringkasanGedung(g)}
                    jarakM={g.jarak}
                    onPress={() => router.push({ pathname: "/gedung/[id]", params: { id: g.poi.id } })}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push({ pathname: "/navigasi", params: { id: poi.id } })}
              accessibilityRole="button"
              style={styles.btnPrimer}
            >
              <Text style={styles.btnPrimerText}>Mulai Navigasi</Text>
            </Pressable>
            <Pressable
              onPress={() => setTersimpan((v) => !v)}
              accessibilityRole="button"
              style={styles.btnSekunder}
            >
              <Text style={styles.btnSekunderText}>{tersimpan ? "Tersimpan di Favorit" : "Simpan ke Favorit"}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function kembali() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: sc.bg },
  kosong: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  judul: { fontFamily: font.head, fontSize: 20, color: sc.ink900 },
  roundBtn: {
    position: "absolute", width: TOMBOL_BACK, height: TOMBOL_BACK, borderRadius: 14,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
  },
  content: { paddingHorizontal: 24, paddingTop: 22, gap: 36 },
  head: { gap: 10 },
  tags: { flexDirection: "row", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontFamily: font.bold, fontSize: 10, lineHeight: 13, letterSpacing: 0.6 },
  h1: { fontFamily: font.headXBold, fontSize: 26, lineHeight: 31, letterSpacing: -0.65, color: sc.ink800 },
  desc: { fontFamily: font.regular, fontSize: 14, lineHeight: 22, color: sc.ink500 },
  route: {
    flexDirection: "row", alignItems: "center", backgroundColor: sc.teal,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16,
  },
  routeCell: { flex: 1, gap: 2 },
  routeCellPad: { paddingLeft: 16 },
  routeValue: { fontFamily: font.head, fontSize: 24, lineHeight: 32, letterSpacing: -0.36, color: "#FFFFFF" },
  routeLabel: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.routeSub },
  routeSep: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.3)" },
  audio: {
    flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: sc.yellowSoft,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14,
  },
  audioIcon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: sc.yellow,
    alignItems: "center", justifyContent: "center",
  },
  audioText: { flex: 1, minWidth: 0, gap: 3 },
  audioTitle: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, letterSpacing: -0.075, color: sc.yellowText },
  audioSub: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.yellowSub },
  section: { gap: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48.5%", flexDirection: "row", alignItems: "center", gap: 10,
    paddingLeft: 12, paddingRight: 14, paddingVertical: 11, borderRadius: 16,
  },
  tileText: { flex: 1, minWidth: 0, gap: 1 },
  tileTitle: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: sc.ink700 },
  tileSub: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.ink500 },
  list: { gap: 12 },
  actions: { gap: 10 },
  btnPrimer: {
    height: 56, borderRadius: 18, backgroundColor: sc.teal, alignItems: "center", justifyContent: "center",
  },
  btnPrimerText: { fontFamily: font.head, fontSize: 16, lineHeight: 20, letterSpacing: -0.16, color: "#FFFFFF" },
  btnSekunder: {
    height: 56, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: sc.teal,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 20,
  },
  btnSekunderText: { fontFamily: font.head, fontSize: 16, lineHeight: 20, letterSpacing: -0.16, color: sc.tealDeep },
});
