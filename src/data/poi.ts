// PB03 — Tipe + pembaca dataset POI
import raw from "./poi.json";

export type KategoriPOI = "ikon" | "gedung" | "fasilitas";

export type POI = {
  id: string;
  nama: string;
  kategori: KategoriPOI;
  lat: number;
  lng: number;
  radiusM: number; // radius geofence (dipakai di PB04)
  koordinatTerverifikasi: boolean;
  mapsUrl: string;
  deskripsi: string;
  ruangan: string[];
  naskahAudio: string;
  foto: string | null; // nama file di assets/images/poi, lihat FOTO_POI
};

// PB07 — Foto POI. Aset lokal harus di-require secara statis supaya ikut ter-bundle,
// jadi setiap nama file di poi.json perlu didaftarkan di sini.
export const FOTO_POI: Record<string, number> = {
  "p01.jpg": require("../../assets/images/poi/p01.jpg"),
  "p03.jpg": require("../../assets/images/poi/p03.jpg"),
  "p04.jpg": require("../../assets/images/poi/p04.jpg"),
  "p05.jpg": require("../../assets/images/poi/p05.jpg"),
  "p06.jpg": require("../../assets/images/poi/p06.jpg"),
  "p07.jpg": require("../../assets/images/poi/p07.jpg"),
  "p08.jpg": require("../../assets/images/poi/p08.jpg"),
  "p09.jpg": require("../../assets/images/poi/p09.jpg"),
  "p10.jpg": require("../../assets/images/poi/p10.jpg"),
};

export const POIS = raw as POI[];

export const KATEGORI_LABEL: Record<KategoriPOI, string> = {
  ikon: "Ikon kampus",
  gedung: "Gedung utama",
  fasilitas: "Fasilitas kampus",
};

// Isi yang masih berupa placeholder "[...]" dianggap belum tersedia
export const sudahDiisi = (teks: string) => !/^\[.*\]$/.test(teks.trim());

// Format GeoJSON untuk ditampilkan Mapbox sebagai layer marker
export const poiGeoJSON = {
  type: "FeatureCollection" as const,
  features: POIS.map((p) => ({
    type: "Feature" as const,
    id: p.id,
    properties: { id: p.id, nama: p.nama, kategori: p.kategori },
    geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
  })),
};

// Pengingat saat development: koordinat yang belum dicek
if (__DEV__) {
  const belum = POIS.filter((p) => !p.koordinatTerverifikasi).map((p) => p.id);
  if (belum.length) console.warn(`Koordinat POI belum diverifikasi: ${belum.join(", ")}`);
}
