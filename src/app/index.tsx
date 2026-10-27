import Mapbox from "@rnmapbox/maps";
import { View } from "react-native";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView style={{ flex: 1 }}>
        <Mapbox.Camera zoomLevel={16} centerCoordinate={[107.7697, -6.9275]} />
      </Mapbox.MapView>
    </View>
  );
}