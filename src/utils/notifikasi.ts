// PB04/F02 — Notifikasi lokal saat pengguna memasuki radius POI (UI02)
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { POI } from "../data/poi";

const CHANNEL_ID = "poi-terdekat";

// Tanpa handler, notifikasi yang datang saat aplikasi terbuka tidak ditampilkan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Android 13+ baru memunculkan dialog izin setelah ada channel, jadi channel dibuat dulu
export async function siapkanNotifikasi(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Lokasi terdekat",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const sekarang = await Notifications.getPermissionsAsync();
    if (sekarang.granted) return true;
    if (!sekarang.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function kirimNotifikasiPOI(poi: POI) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Kamu dekat ${poi.nama}`,
        body: "Ketuk untuk melihat info dan mendengarkan narasinya.",
        data: { poiId: poi.id },
      },
      trigger: null, // langsung tampil
    });
  } catch {
    // Notifikasi hanya pelengkap; kartu info dan narasi tetap jalan tanpanya
  }
}
