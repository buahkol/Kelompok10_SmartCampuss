import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, sc } from "../../theme/sc";

type Props = { title: string; action?: string; onAction?: () => void; trailing?: React.ReactNode };

export function SectionHeader({ title, action, onAction, trailing }: Props) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : (
        trailing
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  title: { flex: 1, fontFamily: font.head, fontSize: 20, lineHeight: 26, letterSpacing: -0.4, color: sc.ink800 },
  action: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: sc.teal },
});
