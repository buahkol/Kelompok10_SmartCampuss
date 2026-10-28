// PB02 — Izin lokasi + baca posisi pengguna secara berkala (F01 Location Awareness)
// PB03 — Dataset 10 POI tampil sebagai marker di peta
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { KATEGORI_LABEL, POIS, poiGeoJSON, type POI } from "../data/poi";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

// [longitude, latitude] — titik awal perkiraan ITB Jatinangor, diganti saat PB03
const ITB_JATINANGOR: [number, number] = [107.7697, -6.9275];

type Status = "loading" | "granted" | "denied" | "error";

export default function ExploreMap() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [firstFixSec, setFirstFixSec] = useState<number | null>(null);
  const [selected, setSelected] = useState<POI | null>(null);

  const cameraRef = useRef<Mapbox.Camera>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const startRef = useRef(0);
  const hasCentered = useRef(false);

  function flyTo(c: Location.LocationObjectCoords) {
    cameraRef.current?.setCamera({
      centerCoordinate: [c.longitude, c.latitude],
      zoomLevel: 17,
      animationDuration: 800,
    });
  }

  async function startTracking() {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus("denied");
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        setErrorMsg("GPS di HP sedang mati. Nyalakan lokasi, lalu coba lagi.");
        setStatus("error");
        return;
      }

      setStatus("granted");
      startRef.current = Date.now(); // mulai hitung setelah izin diberikan

      const onLocation = (loc: Location.LocationObject) => {
        setCoords(loc.coords);
        setFirstFixSec((prev) => prev ?? (Date.now() - startRef.current) / 1000);
        if (!hasCentered.current) {
          hasCentered.current = true;
          flyTo(loc.coords);
        }
      };

      // 1) Tampilkan posisi terakhir yang diketahui HP secara instan
      //    (maks. 2 menit lalu, akurasi ≤ 100 m) supaya posisi muncul < 5 detik
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 100,
      });
      if (last) onLocation(last);

      // 2) Lalu perbarui terus dengan GPS akurat
      subRef.current?.remove();
      subRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
        onLocation
      );
    } catch (e) {
      setErrorMsg(String(e));
      setStatus("error");
    }
  }

  async function onRetry() {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.granted || perm.canAskAgain) return startTracking();
    Linking.openSettings(); // izin ditolak permanen → arahkan ke pengaturan
  }

  useEffect(() => {
    startTracking();
    return () => subRef.current?.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} scaleBarEnabled={false}>
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: ITB_JATINANGOR, zoomLevel: 16 }}
        />

        {/* Marker 10 POI dari data/poi.json, warna per kategori */}
        <Mapbox.ShapeSource
          id="poi-source"
          shape={poiGeoJSON}
          onPress={(e) => {
            const id = e.features[0]?.properties?.id;
            setSelected(POIS.find((p) => p.id === id) ?? null);
          }}
        >
          <Mapbox.CircleLayer
            id="poi-circle"
            style={{
              circleRadius: 9,
              circleColor: [
                "match", ["get", "kategori"],
                "ikon", "#E4572E",
                "gedung", "#2F6DB5",
                "fasilitas", "#3D7A4E",
                "#666666",
              ],
              circleStrokeWidth: 2,
              circleStrokeColor: "#ffffff",
            }}
          />
          <Mapbox.SymbolLayer
            id="poi-label"
            style={{
              textField: ["get", "nama"],
              textSize: 12,
              textAnchor: "top",
              textOffset: [0, 1.2],
              textColor: "#0F1E33",
              textHaloColor: "#ffffff",
              textHaloWidth: 1.5,
            }}
          />
        </Mapbox.ShapeSource>

        {status === "granted" && <Mapbox.LocationPuck pulsing={{ isEnabled: true }} />}
      </Mapbox.MapView>

      {selected && (
        <View style={styles.poiCard}>
          <Text style={styles.poiMeta}>
            {selected.id} · {KATEGORI_LABEL[selected.kategori]}
          </Text>
          <Text style={styles.title}>{selected.nama}</Text>
          <Text style={styles.body} numberOfLines={3}>{selected.deskripsi}</Text>
          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.close}>Tutup</Text>
          </Pressable>
        </View>
      )}

      {status === "granted" && coords && (
        <>
          <Pressable style={styles.myLocation} onPress={() => flyTo(coords)}>
            <Text style={styles.myLocationText}>◎</Text>
          </Pressable>

          {/* Panel uji untuk bukti acceptance criteria F01 — boleh dihapus nanti */}
          <View style={styles.debug}>
            <Text style={styles.debugText}>
              Lat {coords.latitude.toFixed(6)} · Lng {coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.debugText}>
              Akurasi ± {Math.round(coords.accuracy ?? 0)} m · Posisi pertama {firstFixSec?.toFixed(1)} detik
            </Text>
            <Text style={styles.debugText}>POI dimuat: {POIS.length}</Text>
          </View>
        </>
      )}

      {status === "loading" && (
        <View style={styles.debug}>
          <Text style={styles.debugText}>Mencari posisi…</Text>
        </View>
      )}

      {(status === "denied" || status === "error") && (
        <View style={styles.overlay}>
          <Text style={styles.title}>
            {status === "denied" ? "Izin lokasi ditolak" : "Lokasi tidak tersedia"}
          </Text>
          <Text style={styles.body}>
            {status === "denied"
              ? "Smart Campuss butuh lokasi untuk menampilkan posisimu dan POI terdekat. Kamu tetap bisa mencari gedung secara manual."
              : errorMsg}
          </Text>
          <Pressable style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Izinkan lokasi</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  myLocation: {
    position: "absolute", right: 16, bottom: 120,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    elevation: 4,
  },
  myLocationText: { fontSize: 24, color: "#0F1E33" },
  debug: {
    position: "absolute", left: 16, right: 16, bottom: 32,
    backgroundColor: "rgba(15,30,51,0.85)", borderRadius: 12, padding: 12,
  },
  debugText: { color: "#F3F1EA", fontSize: 13 },
  overlay: {
    position: "absolute", left: 16, right: 16, bottom: 32,
    backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 8, elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F1E33" },
  body: { fontSize: 14, color: "#46505E", lineHeight: 20 },
  button: {
    marginTop: 8, backgroundColor: "#0F1E33", borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  poiCard: {
    position: "absolute", left: 16, right: 16, top: 48,
    backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 4, elevation: 6,
  },
  poiMeta: { fontSize: 12, fontWeight: "700", color: "#B8401C", letterSpacing: 1 },
  close: { marginTop: 8, color: "#2F6DB5", fontWeight: "600" },
});