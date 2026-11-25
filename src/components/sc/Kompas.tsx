// Kompas peta: jarum berputar mengikuti arah peta (U = utara); ketuk untuk menegakkan peta ke utara
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { font, sc, shadow } from "../../theme/sc";

type Props = { heading: number; onPress?: () => void };

export function Kompas({ heading, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Arahkan peta ke utara"
      hitSlop={4}
      style={({ pressed }) => [styles.btn, shadow.soft, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.putar, { transform: [{ rotate: `${-heading}deg` }] }]}>
        <Text style={styles.u}>U</Text>
        <Svg width={22} height={22} viewBox="0 0 26 26" style={styles.jarum}>
          <Path d="M13 2 L18 13 H8 Z" fill="#E5484D" />
          <Path d="M13 24 L18 13 H8 Z" fill="#C5D0CD" />
          <Circle cx={13} cy={13} r={2} fill="#FFFFFF" stroke={sc.ink500} strokeWidth={1} />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 38, height: 38, borderRadius: 14, backgroundColor: sc.surface, alignItems: "center", justifyContent: "center" },
  putar: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  u: { position: "absolute", top: 2, fontFamily: font.bold, fontSize: 8, lineHeight: 10, color: "#E5484D" },
  jarum: { marginTop: 6 },
});
