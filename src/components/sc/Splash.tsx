// 00 · Splash — layar sambutan dengan animasi: awan melayang, pin jatuh lalu mengambang,
// titik rute muncul satu per satu, judul masuk bertahap, dan tombol "Mulai Jelajah".
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Easing, PanResponder, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from "react-native-svg";
import { font } from "../../theme/sc";

const DESAIN_W = 390;
const JUMLAH_TITIK = 22;

// Titik-titik rute mengikuti kurva dari dasar pin (195, 510) ke tepi kiri layar
const titikRute = Array.from({ length: JUMLAH_TITIK }, (_, i) => {
  const t = 0.05 + (i / (JUMLAH_TITIK - 1)) * 0.95;
  const u = 1 - t;
  const p = [
    [195, 512],
    [197, 602],
    [92, 640],
    [-6, 724],
  ];
  return {
    x: u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    y: u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  };
});

const masuk = (v: Animated.Value, delay: number, durasi = 600) =>
  Animated.timing(v, { toValue: 1, duration: durasi, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });

const bolakBalik = (v: Animated.Value, durasi: number) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: durasi, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: durasi, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]),
  );

type Props = { onMulai: () => void };

export function Splash({ onMulai }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = width / DESAIN_W;
  const tinggiVb = height / s;

  const [a] = useState(() => ({
    awan: new Animated.Value(0),
    teksAtas: new Animated.Value(0),
    smart: new Animated.Value(0),
    campuss: new Animated.Value(0),
    tagline: new Animated.Value(0),
    jatuh: new Animated.Value(0),
    ambang: new Animated.Value(0),
    cahaya: new Animated.Value(0),
    tombol: new Animated.Value(0),
    awanA: new Animated.Value(0),
    awanB: new Animated.Value(0),
    kilau: new Animated.Value(0),
    geser: new Animated.Value(0),
    panah: [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    titik: Array.from({ length: JUMLAH_TITIK }, () => new Animated.Value(0)),
    keluar: new Animated.Value(1),
  }));
  // Ukuran lintasan geser: lebar tombol dikurangi padding (6+6) dan bulatan (52)
  const maksGeser = Math.max(1, width - 48 - 12 - 52);
  const [st] = useState(() => ({ selesai: false, maks: 1 }));

  useEffect(() => {
    const urut = Animated.parallel([
      masuk(a.awan, 0, 900),
      masuk(a.teksAtas, 200),
      masuk(a.smart, 360),
      masuk(a.campuss, 520),
      masuk(a.tagline, 760),
      Animated.sequence([
        Animated.delay(450),
        Animated.spring(a.jatuh, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(1000),
        Animated.stagger(
          55,
          a.titik.map((v) => Animated.spring(v, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true })),
        ),
      ]),
      Animated.sequence([
        Animated.delay(1300),
        Animated.spring(a.tombol, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]),
    ]);
    urut.start();

    // Gerak yang berulang selama layar terbuka
    const loops = [
      bolakBalik(a.awanA, 5200),
      bolakBalik(a.awanB, 6800),
      bolakBalik(a.cahaya, 2200),
      Animated.sequence([
        Animated.delay(1300),
        Animated.loop(
          Animated.sequence([
            Animated.timing(a.kilau, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.delay(2200),
            Animated.timing(a.kilau, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ),
      ]),
      Animated.sequence([
        Animated.delay(1800),
        bolakBalik(a.ambang, 1500),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.stagger(
            180,
            a.panah.map((v) =>
              Animated.sequence([
                Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: true }),
                Animated.timing(v, { toValue: 0, duration: 420, useNativeDriver: true }),
              ]),
            ),
          ),
          Animated.delay(500),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => {
      urut.stop();
      loops.forEach((l) => l.stop());
    };
  }, [a]);

  useEffect(() => {
    st.maks = maksGeser;
  }, [st, maksGeser]);

  // Bulatan hanya bisa digeser ke kanan di dalam tombol; lewat ±70% lintasan = masuk
  const [geser] = useState(() => {
    const masukApp = () => {
      if (st.selesai) return;
      st.selesai = true;
      Animated.parallel([
        Animated.timing(a.geser, { toValue: st.maks, duration: 120, useNativeDriver: true }),
        Animated.timing(a.keluar, { toValue: 0, duration: 380, delay: 80, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => onMulai());
    };
    const kembali = () =>
      Animated.spring(a.geser, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }).start();
    const pan = PanResponder.create({
      onStartShouldSetPanResponder: () => !st.selesai,
      onMoveShouldSetPanResponder: () => !st.selesai,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => a.geser.stopAnimation(),
      onPanResponderMove: (_, g) => a.geser.setValue(Math.min(Math.max(g.dx, 0), st.maks)),
      onPanResponderRelease: (_, g) => {
        if (g.dx >= st.maks * 0.7) masukApp();
        else if (g.dx < 6) {
          // Ketukan biasa: bulatan bergeser sedikit sebagai petunjuk bahwa tombol harus digeser
          Animated.sequence([
            Animated.timing(a.geser, { toValue: 36, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.spring(a.geser, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }),
          ]).start();
        } else kembali();
      },
      onPanResponderTerminate: kembali,
    });
    return { pan, masukApp };
  });

  const naik = (v: Animated.Value, jarak = 18) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [jarak, 0] }) }],
  });

  const pinW = 84 * s;
  const pinH = 124 * s;
  const pinTop = 388 * s;
  const bawahTombol = Math.max(36, insets.bottom + 16);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: a.keluar,
          transform: [{ scale: a.keluar.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
        },
      ]}
    >
      <LinearGradient
        colors={["#0F8F83", "#3FBFAF", "#A6E6DC", "#A6E6DC"]}
        locations={[0, 0.45, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Awan */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", left: 18 * s, top: 318 * s, width: 100 * s, height: 52 * s, opacity: a.awan,
          transform: [{ translateX: a.awanA.interpolate({ inputRange: [0, 1], outputRange: [-8 * s, 12 * s] }) }],
        }}
      >
        <Awan />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", left: 290 * s, top: 292 * s, width: 78 * s, height: 40.56 * s, opacity: a.awan,
          transform: [{ translateX: a.awanB.interpolate({ inputRange: [0, 1], outputRange: [10 * s, -12 * s] }) }],
        }}
      >
        <Awan />
      </Animated.View>

      {/* Cahaya di belakang pin */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", left: (195 - 110) * s, top: (448 - 110) * s, width: 220 * s, height: 220 * s,
          borderRadius: 110 * s, backgroundColor: "rgba(255,255,255,0.11)",
          opacity: a.jatuh,
          transform: [{ scale: a.cahaya.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] }) }],
        }}
      />

      {/* Bukit */}
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${DESAIN_W} ${tinggiVb}`}
        preserveAspectRatio="xMidYMin slice"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Path d={`M-30 446 C30 386 150 372 225 452 C285 420 345 410 420 444 V${tinggiVb + 40} H-30 Z`} fill="rgba(255,255,255,0.55)" />
        <Path d={`M-30 534 C80 508 140 490 200 490 C280 490 345 500 420 520 V${tinggiVb + 40} H-30 Z`} fill="#8DD6C1" />
        <Path d={`M-30 612 C90 584 300 572 420 604 V${tinggiVb + 40} H-30 Z`} fill="#58B98F" />
      </Svg>

      {/* Titik rute */}
      {titikRute.map((t, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute", left: t.x * s - 3, top: t.y * s - 3, width: 6, height: 6, borderRadius: 3,
            backgroundColor: "#FFFFFF", opacity: a.titik[i],
            transform: [{ scale: a.titik[i] }],
          }}
        />
      ))}

      {/* Bayangan & pin */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", left: (195 - 20) * s, top: 502 * s, width: 40 * s, height: 10 * s,
          borderRadius: 5 * s, backgroundColor: "rgba(6,70,64,0.25)",
          opacity: a.jatuh,
          transform: [
            { scaleX: Animated.multiply(a.jatuh, a.ambang.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] })) },
          ],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", left: (195 - 42) * s, top: pinTop, width: pinW, height: pinH,
          opacity: a.jatuh.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: a.jatuh.interpolate({ inputRange: [0, 1], outputRange: [-380 * s, 0] }) },
            { translateY: a.ambang.interpolate({ inputRange: [0, 1], outputRange: [0, -9 * s] }) },
          ],
        }}
      >
        <Svg width={pinW} height={pinH} viewBox="0 0 84 124">
          <Defs>
            <SvgGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FF9E80" />
              <Stop offset="1" stopColor="#F0643F" />
            </SvgGradient>
          </Defs>
          <Path
            d="M42 0 C65.2 0 84 18.8 84 42 C84 70 56 98 42 122 C28 98 0 70 0 42 C0 18.8 18.8 0 42 0 Z"
            fill="url(#pinGrad)"
          />
          <Circle cx={42} cy={42} r={19} fill="#FFFFFF" />
          <Circle cx={42} cy={42} r={8.5} fill="#0B7E73" />
        </Svg>
      </Animated.View>

      {/* Judul */}
      <View style={[styles.judul, { top: 97 * s }]} pointerEvents="none">
        <Animated.Text style={[styles.atas, naik(a.teksAtas)]}>SELAMAT DATANG DI</Animated.Text>
        <View>
          <Animated.Text style={[styles.nama, { color: "#FFFFFF" }, naik(a.smart, 26)]}>Smart</Animated.Text>
          <Animated.Text style={[styles.nama, { color: "#FBE7A4" }, naik(a.campuss, 26)]}>Campuss</Animated.Text>
        </View>
        <Animated.Text style={[styles.tagline, naik(a.tagline, 12)]}>Jelajahi kampus tanpa tersesat</Animated.Text>
      </View>

      {/* Tombol */}
      <Animated.View
        style={[
          styles.tombolLuar,
          {
            bottom: bawahTombol,
            opacity: a.tombol,
            transform: [{ translateY: a.tombol.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }],
          },
        ]}
      >
        <View
          style={styles.tombol}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Mulai Jelajah. Geser ke kanan untuk masuk"
          accessibilityActions={[{ name: "activate", label: "Mulai Jelajah" }]}
          onAccessibilityAction={() => geser.masukApp()}
        >
          <LinearGradient
            colors={["#FFFFFF", "#EDB50F"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.garisAtas} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.kilau,
              {
                opacity: a.kilau.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.8, 0.8, 0] }),
                transform: [
                  { translateX: a.kilau.interpolate({ inputRange: [0, 1], outputRange: [-80, 400] }) },
                  { skewX: "-20deg" },
                ],
              },
            ]}
          />
          <View style={styles.bulatRuang} />
          <Animated.Text
            style={[
              styles.tombolText,
              { opacity: a.geser.interpolate({ inputRange: [0, maksGeser * 0.5], outputRange: [1, 0], extrapolate: "clamp" }) },
            ]}
          >
            Mulai Jelajah
          </Animated.Text>
          <Animated.View
            style={[
              styles.panahBaris,
              { opacity: a.geser.interpolate({ inputRange: [0, maksGeser * 0.35], outputRange: [1, 0], extrapolate: "clamp" }) },
            ]}
          >
            {a.panah.map((v, i) => (
              <Animated.View
                key={i}
                style={{
                  marginRight: i < 2 ? -4 : 0,
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3 + i * 0.2, 1] }),
                  transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) }],
                }}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="m9 18 6-6-6-6" stroke="#3D2A00" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>
            ))}
          </Animated.View>
          {/* Bulatan yang digeser; dibatasi di dalam tombol */}
          <Animated.View {...geser.pan.panHandlers} style={[styles.bulat, { transform: [{ translateX: a.geser }] }]}>
            <LinearGradient colors={["#14A898", "#0B7E73"]} style={StyleSheet.absoluteFill} />
            <View style={{ zIndex: 1 }}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path d="M5 12h14m-7-7 7 7-7 7" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Awan() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 52" preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="awanGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.98} />
          <Stop offset="1" stopColor="#D9F4EE" stopOpacity={0.92} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={24} width={100} height={28} rx={14} fill="url(#awanGrad)" />
      <Circle cx={32} cy={28} r={16} fill="url(#awanGrad)" />
      <Circle cx={58} cy={20} r={20} fill="url(#awanGrad)" />
      <Circle cx={80} cy={30} r={14} fill="url(#awanGrad)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  judul: { position: "absolute", left: 0, right: 0, alignItems: "center", gap: 10 },
  atas: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.8)" },
  nama: {
    fontFamily: font.headXBold, fontSize: 54, lineHeight: 54, letterSpacing: -2.16, textAlign: "center",
  },
  tagline: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: "rgba(255,255,255,0.92)" },
  tombolLuar: { position: "absolute", left: 24, right: 24, height: 64 },
  tombol: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 32, overflow: "hidden",
    paddingLeft: 6, paddingRight: 22, shadowColor: "#8C5C00", shadowOpacity: 0.35, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 }, elevation: 8, backgroundColor: "#F3D27A",
  },
  garisAtas: { position: "absolute", left: 0, right: 0, top: 0, height: 2, backgroundColor: "rgba(255,255,255,0.45)" },
  kilau: { position: "absolute", top: 0, bottom: 0, width: 46, backgroundColor: "rgba(255,255,255,0.55)" },
  bulatRuang: { width: 52, height: 52 },
  bulat: {
    position: "absolute", left: 6, top: 6, width: 52, height: 52, borderRadius: 26, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#054D45", shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  tombolText: {
    flex: 1, fontFamily: font.head, fontSize: 18, letterSpacing: -0.36, color: "#3D2A00",
  },
  panahBaris: { flexDirection: "row", alignItems: "center" },
});