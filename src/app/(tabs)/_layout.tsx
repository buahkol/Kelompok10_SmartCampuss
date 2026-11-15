import { Tabs } from "expo-router";
import { AppNav } from "../../components/sc/AppNav";

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Jelajahi" }} />
      <Tabs.Screen name="fasilitas" options={{ title: "Fasilitas" }} />
      <Tabs.Screen name="ruangan" options={{ title: "Ruangan" }} />
      <Tabs.Screen name="favorit" options={{ title: "Favorit" }} />
    </Tabs>
  );
}
