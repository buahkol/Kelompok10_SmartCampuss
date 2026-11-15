// Bottom sheet "Gedung dipilih" di peta yang diperbesar
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FASILITAS, type FasilitasTipe, type InfoGedung } from "../../data/fasilitas";
import { KATEGORI_LABEL, type POI } from "../../data/poi";
import { font, sc, shadow } from "../../theme/sc";
import { ScIcon } from "./ScIcon";

// Warna latar + titik per fasilitas untuk chip di sheet
const CHIP: Record<FasilitasTipe, { bg: string; dot: string }> = {
  laboratorium: { bg: "#FFE6DD", dot: "#E8643A" },
  "ruang-kelas": { bg: "#E3F5F2", dot: "#0E9C92" },
  cws: { bg: "#FDE4EE", dot: "#E0508A" },
  toilet: { bg: "#DBF1FB", dot: "#2B8FC7" },
  kantin: { bg: "#FFF3D4", dot: "#E8A800" },
  perpustakaan: { bg: "#E6E1FF", dot: "#7A6AE0" },
  musholla: { bg: "#DDF7EA", dot: "#2FA36B" },
};

type Props = {
  poi: POI;
  info: InfoGedung;
  bottomInset?: number;
  onClose: () => void;
  onDetail: () => void;
  onRoute: () => void;
};

export function PlaceSheet({ poi, info, bottomInset = 0, onClose, onDetail, onRoute }: Props) {
  const tipe = (Object.keys(info.fasilitas) as FasilitasTipe[]).slice(0, 3);
  return (
    <View style={[styles.sheet, shadow.float, { paddingBottom: 28 + bottomInset }]}>
      <View style={styles.grabber} />
      <View style={styles.head}>
        <View style={styles.iconBox}>
          <View style={styles.glyph}>
            <View style={styles.g1} />
            <View style={styles.g2} />
          </View>
        </View>
        <View style={styles.titleCol}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{KATEGORI_LABEL[poi.kategori].toUpperCase()}</Text>
          </View>
          <Text numberOfLines={1} accessibilityRole="header" style={styles.name}>{poi.nama}</Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" style={styles.close} hitSlop={8}>
          <ScIcon name="x" size={16} color={sc.ink500} strokeWidth={2.4} />
        </Pressable>
      </View>

      {tipe.length > 0 && (
        <View style={styles.chips}>
          {tipe.map((t) => (
            <View key={t} style={[styles.chip, { backgroundColor: CHIP[t].bg }]}>
              <View style={[styles.dot, { backgroundColor: CHIP[t].dot }]} />
              <Text style={styles.chipText}>{FASILITAS[t].labelPendek}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onDetail} accessibilityRole="button" style={[styles.btn, styles.btnOutline]}>
          <Text style={[styles.btnText, { color: sc.tealDark }]}>Lihat Detail</Text>
        </Pressable>
        <Pressable onPress={onRoute} accessibilityRole="button" style={[styles.btn, styles.btnFill]}>
          <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Rute ke Sini</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, gap: 14,
  },
  grabber: { alignSelf: "flex-start", width: 40, height: 5, borderRadius: 3, backgroundColor: sc.line },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: "#E3F5F2",
    alignItems: "center", justifyContent: "center",
  },
  glyph: { width: 24, height: 26 },
  g1: { position: "absolute", left: 0, top: 2, width: 14, height: 24, borderWidth: 2, borderColor: sc.tealDark, borderRadius: 2 },
  g2: { position: "absolute", left: 14, top: 12, width: 8, height: 14, borderWidth: 2, borderColor: sc.tealDark, borderRadius: 1 },
  titleCol: { flex: 1, minWidth: 0, gap: 4 },
  badge: { alignSelf: "flex-start", backgroundColor: "#E3F5F2", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontFamily: font.semibold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: sc.tealDark },
  name: { fontFamily: font.head, fontSize: 22, lineHeight: 30, color: sc.ink900 },
  close: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#EEF4F2",
    alignItems: "center", justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 10, paddingRight: 12, paddingVertical: 7, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: "#2E3E3B" },
  actions: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnOutline: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: sc.teal },
  btnFill: { backgroundColor: sc.tealDark },
  btnText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
});
