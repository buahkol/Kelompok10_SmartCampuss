import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, sc, shadow } from "../../theme/sc";
import { formatJarak, menitJalan } from "../../utils/jarak";
import { IkonGedung, ScIcon } from "./ScIcon";

type Props = {
  nama: string;
  ringkasan: string;
  jarakM: number;
  onPress?: () => void;
  // "beranda": nama Plus Jakarta, angka besar + satuan kecil.
  // "fasilitas": nama Bricolage, angka seragam 18.
  // "jelajah": kartu ringkas layar Jelajahi (nama Bricolage 14, angka 12).
  variant?: "beranda" | "fasilitas" | "jelajah";
};

export function BuildingCard({ nama, ringkasan, jarakM, onPress, variant = "beranda" }: Props) {
  const j = formatJarak(jarakM);
  const split = variant === "beranda";
  const jelajah = variant === "jelajah";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${nama}, ${j.angka} ${j.satuan}, ${menitJalan(jarakM)} menit jalan kaki`}
      style={({ pressed }) => [styles.card, shadow.sm, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <IkonGedung />
        </View>
        <View style={styles.titleCol}>
          <Text numberOfLines={1} style={[styles.title, !split && styles.titleHead, jelajah && styles.titleJelajah]}>
            {nama}
          </Text>
          <Text numberOfLines={1} style={styles.sub}>
            {ringkasan}
          </Text>
        </View>
        <View style={styles.go}>
          <ScIcon name="arrow-up-right" size={15} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <ScIcon name="distance" size={16} color={sc.ink800} strokeWidth={1.8} />
          <Text style={styles.metaValue}>
            <Text style={split ? styles.big : jelajah ? styles.small : styles.flat}>{j.angka}</Text>
            <Text style={split ? styles.unit : jelajah ? styles.small : styles.flat}>{` ${j.satuan}`}</Text>
          </Text>
        </View>
        <View style={styles.metaItem}>
          <ScIcon name="walk" size={24} color={sc.ink800} strokeWidth={1.7} />
          <Text style={[styles.metaValue, !jelajah && { color: sc.ink500 }]}>
            <Text style={split ? styles.big : jelajah ? styles.small : styles.flat}>{menitJalan(jarakM)}</Text>
            <Text style={split ? styles.unit : jelajah ? styles.small : styles.flat}>{" mnt"}</Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: sc.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: sc.teal,
    padding: 16,
    gap: 12,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: sc.tile,
    alignItems: "center", justifyContent: "center",
  },
  titleCol: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, color: sc.ink800, letterSpacing: -0.075 },
  titleHead: { fontFamily: font.head, color: sc.ink900 },
  titleJelajah: { fontSize: 14, letterSpacing: 0 },
  sub: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.ink500 },
  go: {
    width: 29, height: 25, borderRadius: 100, backgroundColor: sc.teal,
    alignItems: "center", justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: sc.hair },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaValue: { fontFamily: font.semibold, color: sc.ink800 },
  big: { fontFamily: font.semibold, fontSize: 18, lineHeight: 24 },
  unit: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
  flat: { fontFamily: font.semibold, fontSize: 18, lineHeight: 24 },
  small: { fontFamily: font.semibold, fontSize: 12, lineHeight: 18, color: sc.ink900 },
});
