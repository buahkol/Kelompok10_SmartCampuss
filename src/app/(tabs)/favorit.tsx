// 09 · Favorit — gedung yang disimpan, dengan jarak dan tombol hapus
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NAV_HEIGHT } from "../../components/sc/AppNav";
import { PlaceCard } from "../../components/sc/PlaceCard";
import { ScIcon } from "../../components/sc/ScIcon";
import { useUserCoords } from "../../hooks/useUserCoords";
import { hapusFavorit, useFavorit } from "../../store/favorit";
import { font, sc } from "../../theme/sc";
import { gedungTerdekat, ringkasanGedung } from "../../utils/gedung";

export default function Favorit() {
  const insets = useSafeAreaInsets();
  const { coords } = useUserCoords();
  const { ids } = useFavorit();
  const daftar = gedungTerdekat(coords, { semua: true }).filter((g) => ids.includes(g.poi.id));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Text accessibilityRole="header" style={styles.title}>Favorit</Text>
          <Text style={styles.sub}>Tempat tersimpan, mudah ditemukan kembali</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.ringkasan}>
            <ScIcon name="bookmark" size={24} color={sc.teal} strokeWidth={1.8} />
            <View style={styles.ringkasanTeks}>
              <Text style={styles.ringkasanJudul}>
                {daftar.length === 0 ? "Belum ada tempat tersimpan" : `${daftar.length} tempat tersimpan`}
              </Text>
              <Text style={styles.sub2}>
                {daftar.length === 0
                  ? "Ketuk ikon penanda di Detail Gedung untuk menyimpan tempat"
                  : "Tersimpan untuk kunjunganmu berikutnya"}
              </Text>
            </View>
          </View>

          <View style={styles.daftar}>
            {daftar.map((g) => (
              <PlaceCard
                key={g.poi.id}
                nama={g.poi.nama}
                deskripsi={ringkasanGedung(g)}
                jarakM={g.jarak}
                onPress={() => router.push({ pathname: "/gedung/[id]", params: { id: g.poi.id } })}
                onHapus={() => hapusFavorit(g.poi.id)}
              />
            ))}
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
  body: { paddingHorizontal: 24, paddingTop: 20, gap: 22 },
  ringkasan: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EDFAF8",
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
  },
  ringkasanTeks: { flex: 1, minWidth: 0, gap: 2 },
  ringkasanJudul: { fontFamily: font.head, fontSize: 16, lineHeight: 22, color: sc.ink900 },
  sub2: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
  daftar: { gap: 16 },
});
