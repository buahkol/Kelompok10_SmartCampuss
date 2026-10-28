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
  foto: string | null;
};

export const POIS = raw as POI[];

export const KATEGORI_LABEL: Record<KategoriPOI, string> = {
  ikon: "Ikon kampus",
  gedung: "Gedung utama",
  fasilitas: "Fasilitas kampus",
};

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