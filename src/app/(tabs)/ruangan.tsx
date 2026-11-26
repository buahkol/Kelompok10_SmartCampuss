// 08 · Ruangan — cari ruangan dengan nomornya; hasil menampilkan gedung, lantai, dan jarak
import { router } from "expo-router";
import { useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NAV_HEIGHT } from "../../components/sc/AppNav";
import { IzinBanner } from "../../components/sc/IzinBanner";
import { PlaceCard } from "../../components/sc/PlaceCard";
import { ScIcon } from "../../components/sc/ScIcon";
import { RUANGAN, type Ruangan as DataRuangan } from "../../data/ruangan";
import { useUserCoords } from "../../hooks/useUserCoords";
import { font, sc } from "../../theme/sc";
import { gedungTerdekat } from "../../utils/gedung";

const BATAS = 20;

// Pencocokan nomor ruangan lokal: abaikan huruf besar/kecil, spasi, titik, dan tanda hubung
const rapikan = (s: string) => s.toLowerCase().replace(/[\s.\-_]/g, "");
const cocokRuangan = (r: DataRuangan, kata: string) => {
  const k = rapikan(kata);
  return k.length > 0 && rapikan(r.nomor).includes(k);
};

export default function Ruangan() {
  const insets = useSafeAreaInsets();
  const { coords, izinDiberikan } = useUserCoords();
  const [q, setQ] = useState("");
  const kata = q.trim();

  const jarak = new Map(gedungTerdekat(coords).map((g) => [g.poi.id, g]));
  // Tanpa kata kunci, semua ruangan tampil dari gedung terdekat; mengetik menyaringnya
  const hasil = (kata ? RUANGAN.filter((r) => cocokRuangan(r, kata)) : RUANGAN)
    .map((r) => ({ r, g: jarak.get(r.gedungId) }))
    .flatMap((x) => (x.g ? [{ r: x.r, g: x.g }] : []))
    // Tanpa izin lokasi tidak ada urutan jarak; urut berdasarkan gedung lalu nomor ruangan
    .sort((a, b) =>
      izinDiberikan
        ? a.g.jarak - b.g.jarak
        : a.g.poi.nama.localeCompare(b.g.poi.nama) || a.r.nomor.localeCompare(b.r.nomor, undefined, { numeric: true }),
    );

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Text accessibilityRole="header" style={styles.title}>Ruangan</Text>
          <Text style={styles.sub}>Informasi ruangan, gedung, dan lantai</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.input}>
            <ScIcon name="search" size={20} color={sc.ink900} strokeWidth={1.8} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Cari Ruangan"
              placeholderTextColor={sc.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              accessibilityLabel="Cari nomor ruangan"
              style={styles.inputText}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")} accessibilityRole="button" accessibilityLabel="Hapus pencarian" hitSlop={10}>
                <ScIcon name="x" size={18} color={sc.ink900} strokeWidth={2} />
              </Pressable>
            )}
          </View>

          {!izinDiberikan && <IzinBanner teks="Jarak dan urutan terdekat memerlukan izin lokasi." />}

          <View style={styles.daftar}>
            {hasil.slice(0, BATAS).map(({ r, g }) => (
              <PlaceCard
                key={r.id}
                nama={g.poi.nama}
                deskripsi={r.keterangan}
                jarakM={izinDiberikan ? g.jarak : undefined}
                ruangan={r}
                onPress={() => router.push({ pathname: "/gedung/[id]", params: { id: g.poi.id } })}
              />
            ))}
            {kata !== "" && hasil.length === 0 && <Text style={styles.note}>Ruangan tidak ditemukan.</Text>}
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
  body: { paddingHorizontal: 24, paddingTop: 2, gap: 12 },
  input: {
    height: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16,
    backgroundColor: sc.surface, borderWidth: 1.5, borderColor: sc.teal, borderRadius: 12,
  },
  inputText: { flex: 1, fontFamily: font.regular, fontSize: 13, color: sc.ink900, paddingVertical: 0 },
  note: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
  count: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.teal },
  daftar: { gap: 14, paddingTop: 6 },
});
