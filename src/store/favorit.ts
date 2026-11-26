// Daftar gedung favorit. Disimpan sebagai file JSON di folder dokumen aplikasi,
// supaya tetap ada setelah aplikasi di-reload atau ditutup.
import { File, Paths } from "expo-file-system";
import { useSyncExternalStore } from "react";

const berkas = () => new File(Paths.document, "favorit.json");

function muat(): readonly string[] {
  try {
    const f = berkas();
    if (!f.exists) return [];
    const data: unknown = JSON.parse(f.textSync());
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return []; // file rusak atau platform tanpa sistem file (web): mulai dari daftar kosong
  }
}

function simpan(daftar: readonly string[]) {
  try {
    const f = berkas();
    if (!f.exists) f.create();
    f.write(JSON.stringify(daftar));
  } catch (e) {
    // Favorit tetap berlaku selama aplikasi terbuka
    console.warn("Favorit gagal disimpan:", e);
  }
}

let ids: readonly string[] = muat();
const pendengar = new Set<() => void>();

const ubah = (baru: readonly string[]) => {
  ids = baru;
  simpan(ids);
  pendengar.forEach((p) => p());
};

export const toggleFavorit = (id: string) =>
  ubah(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
export const hapusFavorit = (id: string) => ubah(ids.filter((x) => x !== id));

export function useFavorit() {
  const daftar = useSyncExternalStore(
    (cb) => {
      pendengar.add(cb);
      return () => void pendengar.delete(cb);
    },
    () => ids,
  );
  return { ids: daftar, ada: (id: string) => daftar.includes(id) };
}
