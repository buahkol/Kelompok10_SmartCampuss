// 07 · Fasilitas — pilih fasilitas, lihat gedung yang memilikinya dari yang terdekat
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NAV_HEIGHT } from "../../components/sc/AppNav";
import { BuildingCard } from "../../components/sc/BuildingCard";
import { FacilityChip } from "../../components/sc/FacilityChip";
import { BARIS_CHIP, FASILITAS, isFasilitasTipe } from "../../data/fasilitas";
import { useUserCoords } from "../../hooks/useUserCoords";
import { font, sc } from "../../theme/sc";
import { gedungTerdekat, ringkasanGedung } from "../../utils/gedung";

export default function Fasilitas() {
  const insets = useSafeAreaInsets();
  const { tipe: param } = useLocalSearchParams<{ tipe?: string }>();
  const tipe = isFasilitasTipe(param) ? param : "laboratorium"; // sumber kebenaran: parameter rute
  const { coords } = useUserCoords();
  const hasil = gedungTerdekat(coords, { tipe });

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Text accessibilityRole="header" style={styles.title}>Fasilitas</Text>
          <Text style={styles.sub}>Temukan gedung sesuai kebutuhanmu.</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.chips}>
            {BARIS_CHIP.map((baris, i) => (
              <View key={i} style={styles.chipRow}>
                {baris.map((t) => (
                  <FacilityChip
                    key={t}
                    tipe={t}
                    variant="filter"
                    selected={t === tipe}
                    onPress={() => router.setParams({ tipe: t })}
                  />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.hasil}>
            <View style={styles.hasilHead}>
              <Text accessibilityRole="header" style={styles.hasilTitle}>{FASILITAS[tipe].label}</Text>
              <Text style={styles.count}>{hasil.length} gedung</Text>
            </View>
            <Text style={styles.note}>Bangunan yang memiliki fasilitas ini, dari yang terdekat.</Text>
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
  chipRow: { flexDirection: "row", gap: 10 },
  hasil: { gap: 14 },
  hasilHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  hasilTitle: { flex: 1, fontFamily: font.head, fontSize: 20, lineHeight: 26, color: sc.ink900 },
  count: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
  note: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
});
