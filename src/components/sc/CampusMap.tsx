// Peta Mapbox kampus dengan pin gedung bergaya Smart Campuss.
// Pin digambar sebagai MarkerView (hanya tampilan); ketukan ditangani layer lingkaran
// transparan di ShapeSource, supaya andal di Android.
import Mapbox from "@rnmapbox/maps";
import { useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { POI } from "../../data/poi";
import { sc } from "../../theme/sc";
import { MapPin } from "./MapPin";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

export type LngLat = [number, number];

export type CampusMapHandle = {
  zoomBy: (delta: number) => void;
  flyTo: (pusat: LngLat, zoom?: number) => void;
};

type Props = {
  ref?: Ref<CampusMapHandle>;
  pois: POI[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMapPress?: () => void;
  interactive?: boolean;
  showUser?: boolean;
  center: LngLat;
  zoom: number;
  style?: StyleProp<ViewStyle>;
};

export function CampusMap({
  ref, pois, selectedId = null, onSelect, onMapPress, interactive = true, showUser = false, center, zoom, style,
}: Props) {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const zoomRef = useRef(zoom);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (delta) => {
        zoomRef.current = Math.min(19, Math.max(13, zoomRef.current + delta));
        cameraRef.current?.setCamera({ zoomLevel: zoomRef.current, animationDuration: 300 });
      },
      flyTo: (pusat, z) => {
        if (z !== undefined) zoomRef.current = z;
        cameraRef.current?.setCamera({
          centerCoordinate: pusat,
          zoomLevel: zoomRef.current,
          animationDuration: 600,
        });
      },
    }),
    [],
  );

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: pois.map((p) => ({
        type: "Feature" as const,
        id: p.id,
        properties: { id: p.id },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    }),
    [pois],
  );

  const terpilih = pois.find((p) => p.id === selectedId);

  return (
    <Mapbox.MapView
      style={[styles.map, style]}
      scaleBarEnabled={false}
      compassEnabled={false}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={interactive}
      onPress={onMapPress}
      onCameraChanged={(s) => {
        zoomRef.current = s.properties.zoom;
      }}
    >
      <Mapbox.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: center, zoomLevel: zoom }} />

      {terpilih && (
        <Mapbox.MarkerView coordinate={[terpilih.lng, terpilih.lat]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap pointerEvents="none">
          <View style={styles.area} />
        </Mapbox.MarkerView>
      )}

      {pois.map((p) => (
        <Mapbox.MarkerView
          key={p.id}
          coordinate={[p.lng, p.lat]}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
          pointerEvents="none"
          isSelected={p.id === selectedId}
        >
          <MapPin terpilih={p.id === selectedId} skala={p.id === selectedId ? 1.35 : 1} />
        </Mapbox.MarkerView>
      ))}

      <Mapbox.ShapeSource
        id="sc-pin-source"
        shape={geojson}
        hitbox={{ width: 40, height: 40 }}
        onPress={(e) => {
          const id = e.features[0]?.properties?.id;
          if (typeof id === "string") onSelect?.(id);
        }}
      >
        <Mapbox.CircleLayer
          id="sc-pin-hit"
          style={{ circleRadius: 20, circleOpacity: 0.01, circleColor: "#000000", circleTranslate: [0, -18] }}
        />
      </Mapbox.ShapeSource>

      {showUser && <Mapbox.LocationPuck pulsing={{ isEnabled: true }} />}
    </Mapbox.MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  area: { width: 64, height: 64, borderRadius: 32, backgroundColor: sc.teal, opacity: 0.18 },
});
