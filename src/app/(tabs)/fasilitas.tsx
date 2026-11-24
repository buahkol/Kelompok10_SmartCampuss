// 07 · Fasilitas — pilih satu atau beberapa fasilitas (atau "Semua"), lihat gedung yang memilikinya dari yang terdekat
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NAV_HEIGHT } from "../../components/sc/AppNav";
import { BuildingCard } from "../../components/sc/BuildingCard";
import { FacilityChip } from "../../components/sc/FacilityChip";
import { BARIS_CHIP, FASILITAS, isFasilitasTipe, type FasilitasTipe } from "../../data/fasilitas";
import { ScIcon } from "../../components/sc/ScIcon";
import { useUserCoords } from "../../hooks/useUserCoords";
import { font, sc } from "../../theme/sc";
import { gedungTerdekat, ringkasanGedung } from "../../utils/gedung";

export default function Fasilitas() {
  const insets = useSafeAreaInsets();
  const { tipe: param } = useLocalSearchParams<{ tipe?: string }>();
  // Sumber kebenaran: parameter rute, daftar tipe dipisah koma. Kosong = "Semua".
  const terpilih = (param ?? "").split(",").filter(isFasilitasTipe);
  const { coords } = useUserCoords();
  // Dengan beberapa fasilitas terpilih, hanya gedung yang memiliki semuanya yang tampil
  const hasil = gedungTerdekat(coords).filter((g) => terpilih.every((t) => t in g.info.fasilitas));

  const setTerpilih = (daftar: FasilitasTipe[]) => router.setParams({ tipe: daftar.join(",") });
  const toggle = (t: FasilitasTipe) =>
    setTerpilih(terpilih.includes(t) ? terpilih.filter((x) => x !== t) : [...terpilih, t]);
  const judul = terpilih.length === 0 ? "Semua fasilitas" : terpilih.map((t) => FASILITAS[t].label).join(", ");

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Text accessibilityRole="header" style={styles.title}>Fasilitas</Text>
          <Text style={styles.sub}>Temukan fasilitas sesuai kebutuhanmu</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.chips}>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setTerpilih([])}
                accessibilityRole="button"
                accessibilityState={{ selected: terpilih.length === 0 }}
                accessibilityLabel="Semua fasilitas"
                style={[styles.semua, { borderColor: terpilih.length === 0 ? sc.teal : "transparent" }]}
              >
                <ScIcon name="grid" size={18} color={sc.ink900} strokeWidth={1.7} />
                <Text style={styles.semuaText}>Semua</Text>
              </Pressable>
            </View>
            {BARIS_CHIP.map((baris, i) => (
              <View key={i} style={styles.chipRow}>
                {baris.map((t) => (
                  <FacilityChip
                    key={t}
                    tipe={t}
                    variant="filter"
                    selected={terpilih.includes(t)}
                    onPress={() => toggle(t)}
                  />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.hasil}>
            <View style={styles.hasilHead}>
              <Text accessibilityRole="header" style={styles.hasilTitle}>{judul}</Text>
              <Text style={styles.count}>{hasil.length} gedung</Text>
            </View>
            <Text style={styles.note}>
              {terpilih.length === 0
                ? "Semua gedung kampus terdekat"
                : terpilih.length === 1
                  ? "Bangunan terdekat yang memiliki fasilitas ini"
                  : "Bangunan terdekat yang memiliki semua fasilitas terpilih"}
            </Text>
            {hasil.map((g) => (
              <BuildingCard
                key={g.poi.id}
                variant="fasilitas"
                nama={g.poi.nama}
                ringkasan={ringkasanGedung(g)}
                jarakM={g.jarak}
                onPress={() => router.push({ pathname: "/gedung/[id]", params: { id: g.poi.id } })}
              />
            ))}
            {hasil.length === 0 && <Text style={styles.note}>Belum ada gedung dengan fasilitas ini.</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FBFA" },
  header: { paddingHorizontal: 24, paddingBottom: 20, gap: 6 },
  title: { fontFamily: font.head, fontSize: 28, lineHeight: 34, color: sc.ink900 },
  sub: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: sc.ink500 },
  body: { paddingHorizontal: 24, gap: 22, paddingTop: 20 },
  chips: { gap: 14 },
  semua: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 2, backgroundColor: sc.mint,
  },
  semuaText: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink900 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  hasil: { gap: 14 },
  hasilHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  hasilTitle: { flex: 1, fontFamily: font.head, fontSize: 20, lineHeight: 26, color: sc.ink900 },
  count: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
  note: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
});
