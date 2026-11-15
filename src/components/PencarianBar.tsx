// F05 / UI05 — Kolom pencarian gedung, fasilitas, dan ruangan
import { useMemo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KATEGORI_LABEL, type POI } from "../data/poi";
import { cariPOI } from "../utils/pencarian";

type Props = { onPilih: (poi: POI) => void };

export default function PencarianBar({ onPilih }: Props) {
  const [query, setQuery] = useState("");
  const hasil = useMemo(() => cariPOI(query), [query]);
  const aktif = query.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Cari gedung, fasilitas, atau ruangan"
        placeholderTextColor="#7A8494"
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Cari gedung, fasilitas, atau ruangan"
      />
      {aktif && (
        <View style={styles.hasil}>
          {hasil.length === 0 ? (
            <Text style={styles.kosong}>Tidak ditemukan</Text>
          ) : (
            hasil.map(({ poi, ruangan }) => (
              <Pressable
                key={poi.id}
                style={styles.item}
                onPress={() => {
                  Keyboard.dismiss();
                  setQuery("");
                  onPilih(poi);
                }}
              >
                <Text style={styles.nama}>{poi.nama}</Text>
                <Text style={styles.sub}>
                  {ruangan ? `${ruangan} · ` : ""}
                  {KATEGORI_LABEL[poi.kategori]}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, top: 48, zIndex: 10 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: "#0F1E33", elevation: 6,
  },
  hasil: {
    marginTop: 6, backgroundColor: "#fff", borderRadius: 12, elevation: 6,
    overflow: "hidden", maxHeight: 280,
  },
  item: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#D5D9E0" },
  nama: { fontSize: 14, fontWeight: "600", color: "#0F1E33" },
  sub: { fontSize: 12, color: "#46505E", marginTop: 2 },
  kosong: { padding: 14, fontSize: 14, color: "#46505E" },
});
