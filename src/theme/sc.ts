// Token desain Smart Campuss (diambil dari Figma "Transdig": tosca + kuning,
// Bricolage Grotesque untuk judul, Plus Jakarta Sans untuk teks).
import type { ViewStyle } from "react-native";

export const sc = {
  teal: "#0E9C92",
  tealBright: "#17B8AA",
  tealDark: "#0B8077", // primary/700
  tealDeep: "#0A7A71",
  mint: "#D7F4F0",
  bg: "#F5FAF8",
  surface: "#FFFFFF",
  ink900: "#0E201E",
  ink800: "#0D1B1A",
  ink700: "#2B3A38",
  ink500: "#64736F",
  muted: "#8E9B98",
  hair: "#F0F5F3",
  tile: "#F0F7F5",
  yellow: "#FFC43D",
  yellowSoft: "#FFF3D4",
  yellowText: "#6B4A00",
  yellowSub: "#A07A1E",
  amber: "#E8A800",
  greenSoft: "#DBF3E7",
  greenText: "#178554",
  overline: "#A7E5DE",
  routeSub: "#B3E8E2",
  heroTop: "#38C6BB",
  line: "#E4ECE9",
  mapBg: "#E6F4EF",
  surface2: "#F7FBFA",
  dangerSoft: "#FBE4E4",
  dangerText: "#B42318",
  routeFrom: "#0B8077",
  routeTo: "#14AFA2",
  heroBottom: "#CFF3EC",
} as const;

export const font = {
  head: "BricolageGrotesque_700Bold",
  headXBold: "BricolageGrotesque_800ExtraBold",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
} as const;

// Bayangan: SC/Shadow/XS, SM, Brand, dan bayangan bilah navigasi
const sh = (color: string, y: number, blur: number, opacity: number, elevation: number): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur / 2,
  elevation,
});
export const shadow = {
  xs: sh("#0D2B29", 2, 6, 0.05, 1),
  sm: sh("#0D2B29", 4, 14, 0.07, 3),
  brand: sh("#0E9C92", 8, 18, 0.32, 8),
  nav: sh("#0A2624", -6, 24, 0.1, 12),
  card: sh("#0E3C38", 6, 18, 0.08, 4),
  soft: sh("#0E3C38", 3, 10, 0.06, 2),
  float: sh("#0A2B29", -12, 30, 0.14, 14),
  md: sh("#0A2624", 10, 26, 0.12, 10),
};

// Warna dan jenis fasilitas yang dipakai di chip
export const FASILITAS_WARNA = {
  toilet: "#DBF1FB",
  kantin: "#FFF3D4",
  cws: "#FDE4EE",
  perpustakaan: "#C3BBFF",
  musholla: "#B4FFDA",
  laboratorium: "#E5E5E5",
  "ruang-kelas": "#F2FFB3",
} as const;
