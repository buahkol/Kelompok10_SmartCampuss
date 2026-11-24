// Kartu izin lokasi di awal aplikasi, dipasang sekali di _layout.
import { useEffect } from "react";
import { AppState, Linking, Modal, StyleSheet, View } from "react-native";
import { mintaIzinLokasi, muatIzinLokasi, tundaIzinLokasi, useIzinLokasi } from "../../store/izin";
import { IzinKartu } from "./IzinKartu";

export function IzinLokasi() {
  const status = useIzinLokasi();

  // Periksa saat dibuka dan setiap kembali dari Pengaturan
  useEffect(() => {
    void muatIzinLokasi();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void muatIzinLokasi();
    });
    return () => sub.remove();
  }, []);

  const diblokir = status === "diblokir";
  return (
    <Modal visible={status === "tanya" || diblokir} transparent animationType="slide" statusBarTranslucent onRequestClose={tundaIzinLokasi}>
      <View style={styles.latar}>
        <IzinKartu
          ikon="pin"
          judul={diblokir ? "Lokasi sedang dimatikan" : "Izinkan akses lokasi"}
          isi={
            diblokir
              ? "Aktifkan izin lokasi di Pengaturan agar Smart Campuss bisa menampilkan posisimu di peta kampus."
              : "Smart Campuss memakai lokasimu untuk membantu menjelajahi kampus ITB Jatinangor"
          }
          poin={
            diblokir
              ? ["Buka Pengaturan, pilih Izin, lalu Lokasi", "Pilih \"Izinkan saat aplikasi digunakan\""]
              : [
                  "Menampilkan posisimu di peta secara real-time",
                  "Memunculkan info dan narasi saat kamu dekat sebuah gedung",
                  "Menghitung jarak dan rute jalan kaki",
                  "Hanya dipakai saat aplikasi dibuka",
                ]
          }
          utama={diblokir ? "Buka Pengaturan" : "Izinkan Lokasi"}
          onUtama={() => (diblokir ? void Linking.openSettings() : void mintaIzinLokasi())}
          kedua="Nanti saja"
          onKedua={tundaIzinLokasi}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  latar: { flex: 1, backgroundColor: "rgba(8,42,49,0.6)", justifyContent: "flex-end" },
});
