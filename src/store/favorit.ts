// Daftar gedung favorit. Disimpan di memori (hilang saat aplikasi ditutup) karena
// belum ada library penyimpanan di build saat ini; ganti isi simpan/muat bila sudah ada.
import { useSyncExternalStore } from "react";

let ids: readonly string[] = [];
const pendengar = new Set<() => void>();

const ubah = (baru: readonly string[]) => {
  ids = baru;
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
