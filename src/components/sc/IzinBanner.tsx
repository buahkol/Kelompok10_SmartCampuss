// Keterangan singkat saat izin lokasi belum ada: menjelaskan apa yang tidak tersedia
// dan membuka kembali kartu izin lokasi saat diketuk.
import { Pressable, StyleSheet, Text } from "react-native";
import { tampilkanKartuIzin } from "../../store/izin";
import { font, sc } from "../../theme/sc";
import { ScIcon } from "./ScIcon";

type Props = { teks: string };

export function IzinBanner({ teks }: Props) {
  return (
    <Pressable
      onPress={() => void tampilkanKartuIzin()}
      accessibilityRole="button"
      accessibilityLabel={`${teks} Izinkan lokasi`}
      style={styles.banner}
    >
      <ScIcon name="pin" size={18} color={sc.tealDark} strokeWidth={2} />
      <Text style={styles.teks}>
        {teks} <Text style={styles.aksi}>Izinkan lokasi</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, backgroundColor: sc.mint },
  teks: { flex: 1, fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink700 },
  aksi: { fontFamily: font.semibold, color: sc.tealDark },
});
