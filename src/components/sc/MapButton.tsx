// Tombol bulat/kotak putih di atas peta (zoom, lokasi saya)
import { Pressable, StyleSheet, View } from "react-native";
import { sc, shadow } from "../../theme/sc";
import { ScIcon, type ScIconName } from "./ScIcon";

type Props = { icon: ScIconName; label: string; onPress?: () => void; size?: number; iconSize?: number };

export function MapButton({ icon, label, onPress, size = 38, iconSize = 20 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.btn, { width: size, height: size }, pressed && { opacity: 0.7 }]}
    >
      <ScIcon name={icon} size={iconSize} color={sc.ink900} strokeWidth={2} />
    </Pressable>
  );
}

// Dua tombol zoom bertumpuk dalam satu kapsul
export function ZoomControl({ onIn, onOut }: { onIn: () => void; onOut: () => void }) {
  return (
    <View style={[styles.group, shadow.soft]}>
      <MapButton icon="plus" label="Perbesar peta" onPress={onIn} />
      <MapButton icon="minus" label="Perkecil peta" onPress={onOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: "center", justifyContent: "center", backgroundColor: sc.surface },
  group: { backgroundColor: sc.surface, borderRadius: 14, overflow: "hidden" },
});
