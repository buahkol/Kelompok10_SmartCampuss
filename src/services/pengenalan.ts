// Penghubung layar Pindai Gedung ke model pengenal fasad (utils/fasadApi.ts → Hugging Face Space).
import { klasifikasiFasadGedung } from "../utils/fasadApi";

export type HasilPengenalan = {
  poiId: string; // id gedung di poi.json, mis. "P03"
  yakin: number; // tingkat keyakinan 0–100
};

export type FotoPindai = { uri: string; base64?: string | null };

/**
 * @returns gedung yang dikenali, atau null bila model kurang yakin (< AMBANG_BATAS_KEYAKINAN)
 *          atau server tidak bisa dihubungi.
 */
export async function kenaliGedung(foto: FotoPindai): Promise<HasilPengenalan | null> {
  const hasil = await klasifikasiFasadGedung({ uri: foto.uri, base64: foto.base64, mimeType: "image/jpeg" });
  const utama = hasil.gedungUtama;
  if (!hasil.terverifikasi || !utama.poiId) return null;
  return { poiId: utama.poiId, yakin: utama.confidence * 100 };
}
