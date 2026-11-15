// Pemilih lokasi (asal/tujuan) berbentuk sheet dari bawah
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { POIS, type POI } from "../../data/poi";
import { font, sc } from "../../theme/sc";
import { ScIcon } from "./ScIcon";

type Props = {
  visible: boolean;
  judul: string;
  denganLokasiSaya?: boolean;
  onClose: () => void;
  onPilih: (pilihan: POI | "me") => void;
};

export function PilihGedungModal({ visible, judul, denganLokasiSaya = false, onClose, onPilih }: Props) {
  const insets = useSafeAreaInsets();
  const [kata, setKata] = useState("");
  const daftar = useMemo(() => {
    const q = kata.trim().toLowerCase();
    return q ? POIS.filter((p) => p.nama.toLowerCase().includes(q)) : POIS;
  }, [kata]);

  const tutup = () => {
    setKata("");
    onClose();
  };
  const pilih = (p: POI | "me") => {
    setKata("");
    onPilih(p);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={tutup} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={tutup} accessibilityLabel="Tutup pemilih" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <Text accessibilityRole="header" style={styles.judul}>{judul}</Text>
        <View style={styles.search}>
          <ScIcon name="search" size={20} color={sc.ink500} />
          <TextInput
            value={kata}
            onChangeText={setKata}
            placeholder="Cari gedung"
            placeholderTextColor={sc.muted}
            style={styles.input}
            autoFocus={false}
          />
        </View>
        <FlatList
          data={daftar}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 340 }}
          ListHeaderComponent={
            denganLokasiSaya ? (
              <Pressable onPress={() => pilih("me")} style={styles.row} accessibilityRole="button">
                <View style={[styles.rowIcon, { backgroundColor: sc.mint }]}>
                  <ScIcon name="locate-fixed" size={20} color={sc.tealDark} />
                </View>
                <Text style={styles.rowTitle}>Lokasi saya</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.kosong}>Gedung tidak ditemukan.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => pilih(item)} style={styles.row} accessibilityRole="button">
              <View style={styles.rowIcon}>
                <ScIcon name="pin" size={20} color={sc.teal} />
              </View>
              <Text numberOfLines={1} style={styles.rowTitle}>{item.nama}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(10,38,36,0.4)" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingHorizontal: 24, gap: 14,
  },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: sc.line },
  judul: { fontFamily: font.head, fontSize: 20, lineHeight: 26, color: sc.ink900 },
  search: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: sc.bg,
    borderRadius: 14, paddingHorizontal: 14, minHeight: 48,
  },
  input: { flex: 1, fontFamily: font.medium, fontSize: 14, color: sc.ink900, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: sc.tile,
    alignItems: "center", justifyContent: "center",
  },
  rowTitle: { flex: 1, fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: sc.ink900 },
  kosong: { fontFamily: font.regular, fontSize: 13, color: sc.ink500, paddingVertical: 12 },
});
