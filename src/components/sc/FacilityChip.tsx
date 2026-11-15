import { Pressable, StyleSheet, Text } from "react-native";
import { FASILITAS, type FasilitasTipe } from "../../data/fasilitas";
import { font, sc } from "../../theme/sc";
import { ScIcon } from "./ScIcon";

type Props = {
  tipe: FasilitasTipe;
  onPress?: () => void;
  selected?: boolean;
  // "beranda": teks 13 semibold, padding lebih lebar. "filter": teks 12 regular (layar Fasilitas)
  variant?: "beranda" | "filter";
};

export function FacilityChip({ tipe, onPress, selected = false, variant = "beranda" }: Props) {
  const f = FASILITAS[tipe];
  const filter = variant === "filter";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={f.label}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: f.warna, paddingHorizontal: filter ? 14 : 18, opacity: pressed ? 0.8 : 1 },
        filter && { borderWidth: 2, borderColor: selected ? sc.teal : "transparent" },
      ]}
    >
      <ScIcon name={f.ikon} size={18} strokeWidth={1.7} />
      <Text style={[styles.text, filter ? styles.textFilter : styles.textBeranda]}>{f.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderRadius: 16 },
  text: { color: sc.ink700 },
  textBeranda: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
  textFilter: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: sc.ink900 },
});
