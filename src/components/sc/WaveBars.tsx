import { StyleSheet, View } from "react-native";
import { sc } from "../../theme/sc";

const BAR: [number, number][] = [[8, 0.62], [15, 0.81], [22, 1], [12, 0.73], [18, 0.89], [10, 0.67]];

export function WaveBars({ aktif = true }: { aktif?: boolean }) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {BAR.map(([h, o], i) => (
        <View key={i} style={[styles.bar, { height: aktif ? h : 6, opacity: aktif ? o : 0.35 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
  bar: { width: 3.5, borderRadius: 2, backgroundColor: sc.teal },
});
