// Penghubung layar Pindai Gedung ke model pengenal fasad (utils/fasadApi.ts → Hugging Face Space).
import { klasifikasiFasadGedung } from "../utils/fasadApi";

export type KandidatGedung = {
  poiId: string; // id gedung di poi.json, mis. "P03"
  yakin: number; // tingkat keyakinan 0–100
};

export type HasilPengenalan =
  // Model yakin (≥ AMBANG_BATAS_KEYAKINAN)
  | ({ status: "dikenali" } & KandidatGedung)
  // Model menjawab tapi kurang yakin: kandidat terurut dari yang paling mungkin (bisa kosong)
  | { status: "tidak-yakin"; kandidat: KandidatGedung[] };

export type FotoPindai = { uri: string; base64?: string | null };

/**
 * Mengirim satu foto ke model pengenal fasad.
 * @throws Error bila server tidak bisa dihubungi atau respons tidak valid.
 */
export async function kenaliGedung(foto: FotoPindai): Promise<HasilPengenalan> {
  const hasil = await klasifikasiFasadGedung({ uri: foto.uri, base64: foto.base64, mimeType: "image/jpeg" });
  const utama = hasil.gedungUtama;
  if (hasil.terverifikasi && utama.poiId) {
    return { status: "dikenali", poiId: utama.poiId, yakin: utama.confidence * 100 };
  }
  const kandidat = [utama, ...hasil.alternatif]
    .filter((p): p is typeof p & { poiId: string } => !!p.poiId)
    .map((p) => ({ poiId: p.poiId, yakin: p.confidence * 100 }))
    .slice(0, 3);
  return { status: "tidak-yakin", kandidat };
}
