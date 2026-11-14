// Kartu tempat untuk layar Ruangan (dengan nomor & lantai) dan Favorit (dengan tombol hapus)
import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, sc } from "../../theme/sc";
import { formatJarak, menitJalan } from "../../utils/jarak";
import { IkonGedung, ScIcon } from "./ScIcon";

type Props = {
  nama: string;
  deskripsi: string;
  jarakM: number;
  ruangan?: { nomor: string; lantai: number };
  onPress?: () => void;
  onHapus?: () => void;
};

export function PlaceCard({ nama, deskripsi, jarakM, ruangan, onPress, onHapus }: Props) {
  const j = formatJarak(jarakM);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${ruangan ? `Ruang ${ruangan.nomor}, ` : ""}${nama}, ${j.angka} ${j.satuan}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      {ruangan && (
        <View style={styles.nomorBaris}>
          <Text style={styles.nomor}>Ruang {ruangan.nomor}</Text>
          <View style={styles.lantai}>
            <Text style={styles.lantaiText}>Lantai {ruangan.lantai}</Text>
          </View>
        </View>
      )}
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <IkonGedung />
        </View>
        <View style={styles.titleCol}>
          <Text numberOfLines={1} style={styles.title}>{nama}</Text>
          <Text numberOfLines={1} style={styles.sub}>{deskripsi}</Text>
        </View>
        <View style={styles.go}>
          <ScIcon name="arrow-up-right" size={15} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <ScIcon name="distance" size={16} color={sc.ink800} strokeWidth={1.8} />
          <Text style={styles.metaText}>{`${j.angka} ${j.satuan}`}</Text>
        </View>
        <View style={styles.metaItem}>
          <ScIcon name="walk" size={24} color={sc.ink800} strokeWidth={1.7} />
          <Text style={styles.metaText}>{`${menitJalan(jarakM)} mnt`}</Text>
        </View>
      </View>
      {onHapus && (
        <Pressable onPress={onHapus} accessibilityRole="button" style={styles.hapus}>
          <ScIcon name="trash" size={16} color={sc.dangerText} strokeWidth={1.8} />
          <Text style={styles.hapusText}>Hapus dari favorit</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: sc.surface, borderRadius: 20, borderWidth: 1, borderColor: sc.teal, padding: 16, gap: 12 },
  nomorBaris: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  nomor: { flex: 1, fontFamily: font.head, fontSize: 14, lineHeight: 21, color: sc.ink900 },
  lantai: { backgroundColor: "#EDFAF8", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  lantaiText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 18, color: sc.ink900 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: sc.tile, alignItems: "center", justifyContent: "center" },
  titleCol: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: font.head, fontSize: 14, lineHeight: 21, color: sc.ink900 },
  sub: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink500 },
  go: { width: 29, height: 25, borderRadius: 100, backgroundColor: sc.teal, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: sc.hair },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 18, color: sc.ink900 },
  hapus: {
    height: 40, borderRadius: 12, backgroundColor: sc.dangerSoft, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16,
  },
  hapusText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 18, color: sc.dangerText },
});
