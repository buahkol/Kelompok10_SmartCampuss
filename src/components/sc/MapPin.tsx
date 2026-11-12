// Pin peta berbentuk tetesan dengan ikon lokasi (digambar ulang dari "SC/Map pin" di Figma)
import Svg, { G, Path } from "react-native-svg";
import { sc } from "../../theme/sc";

type Props = { skala?: number; terpilih?: boolean };

export function MapPin({ skala = 1, terpilih = false }: Props) {
  const w = 30 * skala;
  const h = 36 * skala;
  return (
    <Svg width={w} height={h} viewBox="0 0 30 36">
      <Path
        d="M15 0a15 15 0 0 1 15 15c0 8-9 15-15 21C9 30 0 23 0 15A15 15 0 0 1 15 0z"
        fill={terpilih ? sc.tealDark : sc.teal}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <G transform="translate(5 4.5) scale(0.83)">
        <Path
          d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"
          stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
        <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke="#FFFFFF" strokeWidth={2} fill="none" />
      </G>
    </Svg>
  );
}
