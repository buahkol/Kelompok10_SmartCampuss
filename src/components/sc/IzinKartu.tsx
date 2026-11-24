// Kartu penjelasan izin (lokasi, kamera): memberi tahu manfaatnya sebelum dialog sistem muncul
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { font, sc, shadow } from "../../theme/sc";
import { ScIcon, type ScIconName } from "./ScIcon";

type Props = {
  ikon: ScIconName;
  judul: string;
  isi: string;
  poin?: string[];
  utama: string;
  onUtama: () => void;
  kedua?: string;
  onKedua?: () => void;
};

export function IzinKartu({ ikon, judul, isi, poin, utama, onUtama, kedua, onKedua }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.kartu, shadow.md, { paddingBottom: 24 + insets.bottom }]}>
      <View style={styles.grabber} />
      <View style={styles.cincin}>
        <View style={styles.ikon}>
          <ScIcon name={ikon} size={30} color="#FFFFFF" strokeWidth={2} />
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.judul}>{judul}</Text>
      <Text style={styles.isi}>{isi}</Text>
      {poin && poin.length > 0 && (
        <View style={styles.poin}>
          {poin.map((p) => (
            <View key={p} style={styles.poinBaris}>
              <View style={styles.titik} />
              <Text style={styles.poinText}>{p}</Text>
            </View>
          ))}
        </View>
      )}
      <Pressable onPress={onUtama} accessibilityRole="button" style={({ pressed }) => [styles.btnUtama, pressed && { opacity: 0.9 }]}>
        <Text style={styles.btnUtamaText}>{utama}</Text>
      </Pressable>
      {kedua && onKedua && (
        <Pressable onPress={onKedua} accessibilityRole="button" style={styles.btnKedua}>
          <Text style={styles.btnKeduaText}>{kedua}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 16, paddingHorizontal: 24, gap: 14, alignItems: "stretch",
  },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#E3EBE9" },
  cincin: {
    alignSelf: "center", width: 88, height: 88, borderRadius: 44, backgroundColor: sc.mint,
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  ikon: { width: 60, height: 60, borderRadius: 30, backgroundColor: sc.teal, alignItems: "center", justifyContent: "center" },
  judul: { fontFamily: font.headXBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: sc.ink800, textAlign: "center" },
  isi: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: sc.ink500, textAlign: "center" },
  poin: { backgroundColor: sc.bg, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  poinBaris: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  titik: { width: 8, height: 8, borderRadius: 4, backgroundColor: sc.teal, marginTop: 6 },
  poinText: { flex: 1, fontFamily: font.medium, fontSize: 13, lineHeight: 20, color: sc.ink700 },
  btnUtama: { height: 56, borderRadius: 12, backgroundColor: sc.tealDark, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnUtamaText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: "#FFFFFF" },
  btnKedua: { height: 44, alignItems: "center", justifyContent: "center" },
  btnKeduaText: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: sc.ink500 },
});
