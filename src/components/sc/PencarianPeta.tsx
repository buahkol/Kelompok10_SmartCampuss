// Kolom pencarian di atas peta: cari gedung, fasilitas, atau nomor ruangan, lalu terbang ke pinnya
import { useMemo, useState, type ReactNode } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { FASILITAS, type FasilitasTipe } from "../../data/fasilitas";
import { KATEGORI_LABEL, POIS, type POI } from "../../data/poi";
import { RUANGAN } from "../../data/ruangan";
import { font, sc, shadow } from "../../theme/sc";
import { infoGedung } from "../../utils/gedung";
import { cariPOI } from "../../utils/pencarian";
import { ScIcon } from "./ScIcon";

type Hasil = { poi: POI; sub: string };
// Pencocokan nomor ruangan dibuat lokal: abaikan huruf besar/kecil, spasi, titik, dan tanda hubung
const rapikan = (s: string) => s.toLowerCase().replace(/[\s.\-_]/g, "");
const cocokNomor = (nomor: string, kata: string) => {
  const k = rapikan(kata);
  return k.length > 0 && rapikan(nomor).includes(k);
};
const MAKS_HASIL = 6;

function cari(kata: string): Hasil[] {
  const q = kata.trim();
  if (!q) return [];
  const hasil = new Map<string, Hasil>();

  for (const { poi, ruangan } of cariPOI(q)) {
    const kategori = KATEGORI_LABEL[poi.kategori];
    hasil.set(poi.id, { poi, sub: ruangan ? `${ruangan} · ${kategori}` : kategori });
  }
  for (const r of RUANGAN) {
    if (hasil.has(r.gedungId) || !cocokNomor(r.nomor, q)) continue;
    const poi = POIS.find((p) => p.id === r.gedungId);
    if (poi) hasil.set(poi.id, { poi, sub: `Ruang ${r.nomor} · Lantai ${r.lantai}` });
  }
  const kecil = q.toLowerCase();
  for (const poi of POIS) {
    if (hasil.has(poi.id)) continue;
    const tipe = (Object.keys(infoGedung(poi.id).fasilitas) as FasilitasTipe[]).find((t) =>
      FASILITAS[t].label.toLowerCase().includes(kecil),
    );
    if (tipe) hasil.set(poi.id, { poi, sub: `Fasilitas: ${FASILITAS[tipe].label}` });
  }
  return [...hasil.values()].slice(0, MAKS_HASIL);
}

type Props = { top: number; kiri?: ReactNode; onPilih: (poi: POI) => void };

export function PencarianPeta({ top, kiri, onPilih }: Props) {
  const [query, setQuery] = useState("");
  const hasil = useMemo(() => cari(query), [query]);
  const aktif = query.trim().length > 0;

  return (
    <View style={[styles.wrap, { top }]}>
      <View style={styles.baris}>
        {kiri}
        <View style={[styles.input, shadow.soft]}>
          <ScIcon name="search" size={18} color={sc.ink900} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari gedung, fasilitas, ruangan"
            placeholderTextColor={sc.muted}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Cari gedung, fasilitas, atau ruangan"
            style={styles.teks}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Hapus pencarian" hitSlop={10}>
              <ScIcon name="x" size={16} color={sc.ink900} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {aktif && (
        <View style={[styles.hasil, shadow.soft]}>
          {hasil.length === 0 ? (
            <Text style={styles.kosong}>Tidak ditemukan</Text>
          ) : (
            hasil.map(({ poi, sub }) => (
              <Pressable
                key={poi.id}
                accessibilityRole="button"
                accessibilityLabel={`${poi.nama}, ${sub}`}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: sc.bg }]}
                onPress={() => {
                  Keyboard.dismiss();
                  setQuery("");
                  onPilih(poi);
                }}
              >
                <View style={styles.ikon}>
                  <ScIcon name="pin" size={18} color={sc.tealDark} strokeWidth={2} />
                </View>
                <View style={styles.itemTeks}>
                  <Text numberOfLines={1} style={styles.nama}>{poi.nama}</Text>
                  <Text numberOfLines={1} style={styles.sub}>{sub}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 24, right: 24, zIndex: 20, gap: 8 },
  baris: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1, minWidth: 0, height: 46, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 14,
  },
  teks: { flex: 1, minWidth: 0, fontFamily: font.medium, fontSize: 13, color: sc.ink900, paddingVertical: 0 },
  hasil: { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  ikon: { width: 36, height: 36, borderRadius: 12, backgroundColor: sc.mint, alignItems: "center", justifyContent: "center" },
  itemTeks: { flex: 1, minWidth: 0, gap: 1 },
  nama: { fontFamily: font.bold, fontSize: 14, lineHeight: 20, color: sc.ink900 },
  sub: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: sc.ink500 },
  kosong: { padding: 16, fontFamily: font.regular, fontSize: 13, color: sc.ink500 },
});
