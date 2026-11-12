// Bilah navigasi bawah: Jelajahi · Fasilitas · [Kamera] · Ruangan · Favorit
import type { BottomTabBarProps } from "expo-router/tabs";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { font, sc, shadow } from "../../theme/sc";
import { ScIcon, type ScIconName } from "./ScIcon";

export const NAV_HEIGHT = 92;

type Item = { key: string; label: string; icon: ScIconName; route?: "index" | "fasilitas" };

const KIRI: Item[] = [
  { key: "jelajahi", label: "Jelajahi", icon: "compass", route: "index" },
  { key: "fasilitas", label: "Fasilitas", icon: "grid", route: "fasilitas" },
];
const KANAN: Item[] = [
  { key: "ruangan", label: "Ruangan", icon: "door" },
  { key: "favorit", label: "Favorit", icon: "bookmark" },
];

const segera = (judul: string) =>
  Alert.alert(judul, "Fitur ini akan tersedia di sprint berikutnya.");

export function AppNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const aktif = state.routes[state.index]?.name;

  const renderItem = (it: Item) => {
    const on = it.route === aktif;
    return (
      <Pressable
        key={it.key}
        style={styles.slot}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={it.label}
        onPress={() => (it.route ? navigation.navigate(it.route) : segera(it.label))}
      >
        <ScIcon name={it.icon} size={22} color={on ? sc.teal : sc.ink500} strokeWidth={1.7} />
        <Text style={[styles.label, { color: on ? sc.tealDark : sc.ink500 }]}>{it.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { height: NAV_HEIGHT + insets.bottom }]} pointerEvents="box-none">
      <View style={[styles.surface, shadow.nav, { height: 76 + insets.bottom }]} />
      <View style={[styles.row, { top: 16 }]}>
        {KIRI.map(renderItem)}
        <View style={styles.slot} />
        {KANAN.map(renderItem)}
      </View>
      <Pressable
        onPress={() => segera("Pindai Gedung")}
        accessibilityRole="button"
        accessibilityLabel="Pindai gedung dengan kamera"
        style={styles.camWrap}
      >
        <View style={[styles.cam, shadow.brand]} />
        <View style={styles.camIcon}>
          <ScIcon name="camera" size={24} color="#FFFFFF" strokeWidth={1.8} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  surface: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: sc.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  row: { position: "absolute", left: 11, right: 11, flexDirection: "row" },
  slot: { flex: 1, alignItems: "center", paddingTop: 18, gap: 6, height: 76 },
  label: { fontFamily: font.semibold, fontSize: 10, lineHeight: 14, textAlign: "center" },
  camWrap: { position: "absolute", top: -8, alignSelf: "center", width: 52, height: 52 },
  cam: { width: 52, height: 52, borderRadius: 16, backgroundColor: sc.teal, transform: [{ rotate: "45deg" }] },
  camIcon: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
});
