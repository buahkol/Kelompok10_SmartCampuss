// Ilustrasi hero Detail Gedung (digambar ulang dari Figma "03 · Detail Gedung")
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { sc } from "../../theme/sc";

export function BuildingHero({ height = 260 }: { height?: number }) {
  return (
    <View style={{ height, overflow: "hidden" }}>
      <LinearGradient colors={[sc.heroTop, sc.heroBottom]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height={260} viewBox="0 0 390 260" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", bottom: 0 }}>
        <Circle cx={322} cy={56} r={22} fill={sc.yellow} />
        <Rect x={0} y={214} width={390} height={46} fill="#BFE8DE" />
        <Rect x={108} y={104} width={174} height={112} rx={8} fill="#FFFFFF" />
        {[122, 156, 190, 224, 254].map((x) => (
          <Rect key={x} x={x} y={132} width={14} height={84} rx={2} fill="#E6F6F2" />
        ))}
        <Rect x={126} y={112} width={138} height={16} rx={4} fill={sc.teal} />
        <Rect x={96} y={216} width={214} height={7} rx={2} fill="#DBF0EA" />
        <Circle cx={343} cy={151} r={25} fill="#7FCFC4" />
        <Rect x={338} y={170} width={9} height={46} rx={3} fill="#5FB5AC" />
        <Circle cx={53} cy={161} r={21} fill="#7FCFC4" />
        <Rect x={49} y={176} width={8} height={40} rx={3} fill="#5FB5AC" />
      </Svg>
    </View>
  );
}
