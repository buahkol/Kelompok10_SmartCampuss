// Ikon garis (gaya lucide) digambar dengan react-native-svg.
// Aset ikon Figma tidak bisa diunduh dari lingkungan pengembangan ini, jadi ikon
// digambar ulang; bila ingin persis, ganti isi `PATHS` dengan SVG ekspor Figma.
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type ScIconName =
  | "compass" | "grid" | "door" | "bookmark" | "camera" | "volume" | "chevron-left"
  | "search" | "arrow-up-right" | "walk" | "distance"
  | "plus" | "minus" | "locate" | "locate-fixed" | "swap" | "x" | "pin" | "headphones"
  | "turn-right" | "turn-left" | "arrow-up" | "flag"
  | "toilet" | "kantin" | "cws" | "perpustakaan" | "musholla" | "laboratorium" | "ruang-kelas";

type Props = { name: ScIconName; size?: number; color?: string; strokeWidth?: number; fill?: string };

export function ScIcon({ name, size = 22, color = "#0E201E", strokeWidth = 1.8, fill = "none" }: Props) {
  const p = { stroke: color, strokeWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      {name === "compass" && (
        <>
          <Circle cx={12} cy={12} r={10} {...p} />
          <Path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" {...p} />
        </>
      )}
      {name === "grid" && (
        <>
          <Rect x={3} y={3} width={7} height={7} rx={1} {...p} />
          <Rect x={14} y={3} width={7} height={7} rx={1} {...p} />
          <Rect x={14} y={14} width={7} height={7} rx={1} {...p} />
          <Rect x={3} y={14} width={7} height={7} rx={1} {...p} />
        </>
      )}
      {name === "door" && (
        <>
          <Path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" {...p} />
          <Path d="M2 20h20M14 12v.01" {...p} />
        </>
      )}
      {name === "bookmark" && <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" {...p} fill={fill} />}
      {name === "camera" && (
        <>
          <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" {...p} />
          <Circle cx={12} cy={13} r={3} {...p} />
        </>
      )}
      {name === "volume" && (
        <>
          <Path d="M11 5 6 9H2v6h4l5 4z" {...p} />
          <Path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" {...p} />
        </>
      )}
      {name === "chevron-left" && <Path d="m15 18-6-6 6-6" {...p} />}
      {name === "search" && (
        <>
          <Circle cx={11} cy={11} r={7.5} {...p} />
          <Path d="m21 21-4.3-4.3" {...p} />
        </>
      )}
      {name === "arrow-up-right" && <Path d="M7 17 17 7M8 7h9v9" {...p} />}
      {name === "walk" && (
        <>
          <Circle cx={13} cy={4.5} r={2} fill={color} stroke="none" />
          <Path d="m9 21 2.5-6.5M11.5 14.5 10 10.5l4-1.5 2 3.5 3 .5M12 14.5l3 2 .5 4.5M10 10.5 7.5 13" {...p} />
        </>
      )}
      {name === "distance" && (
        <>
          <Circle cx={5.5} cy={18.5} r={2} {...p} />
          <Circle cx={18.5} cy={5.5} r={2} {...p} />
          <Path d="M7.5 18.5H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6.5" {...p} strokeDasharray="0.1 2.4" />
        </>
      )}
      {name === "plus" && <Path d="M5 12h14M12 5v14" {...p} />}
      {name === "minus" && <Path d="M5 12h14" {...p} />}
      {(name === "locate" || name === "locate-fixed") && (
        <>
          <Circle cx={12} cy={12} r={7} {...p} />
          <Path d="M2 12h3M19 12h3M12 2v3M12 19v3" {...p} />
          {name === "locate-fixed" && <Circle cx={12} cy={12} r={3} fill={color} stroke="none" />}
        </>
      )}
      {name === "swap" && <Path d="M7 20V4M7 4 3.5 7.5M7 4l3.5 3.5M17 4v16M17 20l-3.5-3.5M17 20l3.5-3.5" {...p} />}
      {name === "x" && <Path d="M18 6 6 18M6 6l12 12" {...p} />}
      {name === "pin" && (
        <>
          <Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" {...p} />
          <Circle cx={12} cy={10} r={3} {...p} />
        </>
      )}
      {name === "headphones" && (
        <Path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" {...p} />
      )}
      {name === "turn-right" && <Path d="m15 14 5-5-5-5M4 20v-7a4 4 0 0 1 4-4h12" {...p} />}
      {name === "turn-left" && <Path d="M9 14 4 9l5-5M20 20v-7a4 4 0 0 0-4-4H4" {...p} />}
      {name === "arrow-up" && <Path d="M12 19V5M5 12l7-7 7 7" {...p} />}
      {name === "flag" && <Path d="M4 22V4M4 4h13l-2 4 2 4H4" {...p} />}
      {name === "toilet" && (
        <>
          <Circle cx={7} cy={4.5} r={2} {...p} />
          <Circle cx={17} cy={4.5} r={2} {...p} />
          <Path d="M4 10h6v5H8.6V21H5.4v-6H4zM14 10h6l-1.5 5H17v6h-1.5v-6H14z" {...p} />
        </>
      )}
      {name === "kantin" && (
        <>
          <Path d="M3 12h18a9 8.5 0 0 1-18 0z" {...p} />
          <Path d="M9 8c0-2 2-2 2-4M14 8c0-2 2-2 2-4" {...p} />
          <Path d="m17 3-3 7" {...p} />
        </>
      )}
      {name === "cws" && (
        <>
          <Rect x={5} y={5} width={14} height={10} rx={1.5} {...p} />
          <Path d="M2 19h20" {...p} />
        </>
      )}
      {name === "perpustakaan" && (
        <>
          <Path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" {...p} />
          <Path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" {...p} />
        </>
      )}
      {name === "musholla" && (
        <>
          <Path d="M5 21v-8a7 7 0 0 1 14 0v8" {...p} />
          <Path d="M2 21h20M12 3v3M9.5 21v-4a2.5 2.5 0 0 1 5 0v4" {...p} />
        </>
      )}
      {name === "laboratorium" && (
        <Path d="M9 3h6M10 3v6l-5.5 10a1.6 1.6 0 0 0 1.4 2.3h12.2a1.6 1.6 0 0 0 1.4-2.3L14 9V3M7.5 15h9" {...p} />
      )}
      {name === "ruang-kelas" && (
        <>
          <Rect x={3} y={4} width={18} height={12} rx={1.5} {...p} />
          <Path d="M7 8.5h5M7 12h3M15 9h3M15 12h3M8 20l1-4M16 20l-1-4" {...p} />
        </>
      )}
    </Svg>
  );
}

// Ikon gedung berwarna ("Icon / Facility") di kartu gedung
export function IkonGedung({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x={5} y={7} width={13} height={20} rx={2} fill="#0E9C92" opacity={0.18} stroke="#0E9C92" strokeWidth={1.6} />
      <Rect x={13} y={12} width={14} height={15} rx={2} fill="#FFFFFF" stroke="#0E9C92" strokeWidth={1.6} />
      <Path d="M8.5 11h2M12.5 11h2M8.5 15h2M12.5 15h2M8.5 19h2M12.5 19h2M16.5 16.5h2M20.5 16.5h2M16.5 20.5h2M20.5 20.5h2" stroke="#0E9C92" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M3 27.5h26" stroke="#0E9C92" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
