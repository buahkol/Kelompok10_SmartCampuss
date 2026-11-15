// Fixture POI untuk uji non-perangkat: baca src/data/poi.json tanpa bundling aset gambar.
import { readFileSync } from "node:fs";
const raw = JSON.parse(readFileSync(new URL("../src/data/poi.json", import.meta.url), "utf8"));
export const POIS = raw.map((p) => ({ id: p.id, nama: p.nama, lat: p.lat, lng: p.lng }));
