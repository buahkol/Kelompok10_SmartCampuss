// Integrasi API Klasifikasi Fasad Bangunan ITB Jatinangor (Hugging Face Spaces)
import { POIS, type POI } from "../data/poi";

export type PrediksiGedung = {
  label: string;
  confidence: number; // 0.0 - 1.0 (persentase)
  poiId?: string;
  poi?: POI;
};

export type HasilKlasifikasiFasad = {
  gedungUtama: PrediksiGedung;
  alternatif: PrediksiGedung[];
  terverifikasi: boolean; // bernilai true jika confidence >= AMBANG_BATAS_KEYAKINAN
};

// Ambang batas keyakinan minimal model (50%) untuk memastikan fasad benar-benar teridentifikasi
export const AMBANG_BATAS_KEYAKINAN = 0.5;

// URL Space Hugging Face
export const DEFAULT_FASAD_API_URL =
  process.env.EXPO_PUBLIC_FASAD_API_URL ||
  "https://hakimgans-model-bangunan-itb-jatinangor.hf.space";

// Pemetaan 10 kelas model ke ID POI di poi.json
export const KELAS_KE_POI_ID: Record<string, string> = {
  Transformer: "P01",
  GSG: "P02",
  "Labtek Baru": "P03",
  Asrama: "P04",
  "GKU 1": "P05",
  "GKU 2": "P06",
  Rektorat: "P07",
  KOICA: "P08",
  GKU3: "P09",
  Aljabbar: "P10",
};

// Menghubungkan nama kelas hasil model ke objek POI di aplikasi
export function hubungkanKePOI(label: string): POI | undefined {
  // 1. Cocokkan langsung dari kamus
  const poiId = KELAS_KE_POI_ID[label];
  if (poiId) {
    const p = POIS.find((item) => item.id === poiId);
    if (p) return p;
  }

  // 2. Cocokkan case-insensitive tanpa spasi/simbol
  const cleanLabel = label.toLowerCase().replace(/[\s_\-.]/g, "");
  for (const [key, id] of Object.entries(KELAS_KE_POI_ID)) {
    if (key.toLowerCase().replace(/[\s_\-.]/g, "") === cleanLabel) {
      return POIS.find((item) => item.id === id);
    }
  }

  // 3. Fallback pencarian parsial berdasarkan nama gedung
  return POIS.find((p) => {
    const cleanNama = p.nama.toLowerCase().replace(/[\s_\-.]/g, "");
    return cleanNama.includes(cleanLabel) || cleanLabel.includes(cleanNama);
  });
}

// Parsing berbagai bentuk respons Gradio (Label object, Dict {kelas: skor}, dsb.)
function parseGradioData(raw: any): PrediksiGedung[] {
  let entries: { label: string; confidence: number }[] = [];

  if (!raw) return [];

  // Jika payload adalah array, ambil elemen pertamanya
  const data = Array.isArray(raw) ? raw[0] : raw;

  if (!data) return [];

  // Kasus 1: Format Gradio Label { label: "...", confidences: [ { label: "...", confidence: 0.9 }, ... ] }
  if (Array.isArray(data.confidences)) {
    entries = data.confidences.map((c: any) => ({
      label: String(c.label ?? c.class ?? ""),
      confidence: Number(c.confidence ?? 0),
    }));
  }
  // Kasus 2: Dict langsung { "GKU 1": 0.85, "GSG": 0.1, ... }
  else if (typeof data === "object" && !Array.isArray(data)) {
    entries = Object.entries(data).map(([k, v]) => ({
      label: k,
      confidence: Number(v ?? 0),
    }));
  }
  // Kasus 3: Array of objects [ { label: "...", confidence: ... } ]
  else if (Array.isArray(data)) {
    entries = data.map((item: any) => ({
      label: String(item.label ?? item.class ?? item[0] ?? ""),
      confidence: Number(item.confidence ?? item[1] ?? 0),
    }));
  }

  // Urutkan dari confidence tertinggi
  entries.sort((a, b) => b.confidence - a.confidence);

  return entries.map((entry) => {
    const poi = hubungkanKePOI(entry.label);
    return {
      label: poi ? poi.nama : entry.label,
      confidence: entry.confidence,
      poiId: poi?.id,
      poi,
    };
  });
}

// Mengekstrak payload dari respons Server-Sent Events (SSE) Gradio.
// Gradio mengirim `event: complete` + `data: [...]` bila sukses, atau `event: error` bila gagal.
function ekstrakDataDariSSE(sseText: string): any {
  let event = "";
  let data: any = null;
  for (const baris of sseText.split(/\r?\n/)) {
    const line = baris.trim();
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) {
      try {
        data = JSON.parse(line.slice(5).trim());
      } catch {
        data = null;
      }
    }
  }
  if (event === "error") {
    const detail = typeof data === "string" ? data : data?.message;
    throw new Error(detail ? `Server model AI error: ${detail}` : "Server model AI gagal memproses gambar.");
  }
  return data;
}

async function fetchDenganBatasWaktu(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("Server model AI tidak merespons. Space Hugging Face mungkin sedang booting, coba lagi sebentar.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export type InputKlasifikasiFasad = {
  uri: string;
  base64?: string | null;
  mimeType?: string;
};

/**
 * Mengirim gambar fasad gedung ke API model Hugging Face Spaces (Gradio 6, prefix `/gradio_api`).
 * Gambar dikirim sebagai data URL base64 sehingga tidak perlu unggah multipart
 * (`fetch` bawaan Expo tidak mendukung bagian FormData `{ uri, name, type }` ala React Native).
 */
export async function klasifikasiFasadGedung(
  input: InputKlasifikasiFasad,
  customBaseUrl?: string
): Promise<HasilKlasifikasiFasad> {
  const baseUrl = (customBaseUrl || DEFAULT_FASAD_API_URL).replace(/\/+$/, "");
  if (!input.base64) {
    throw new Error("Data gambar (base64) tidak tersedia untuk dikirim ke model AI.");
  }
  const mime = input.mimeType || "image/jpeg";
  const dataUri = `data:${mime};base64,${input.base64}`;

  // 1. Antrekan prediksi → dapat event_id
  const callRes = await fetchDenganBatasWaktu(
    `${baseUrl}/gradio_api/call/predict`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{ url: dataUri, orig_name: "fasad_gedung.jpg", mime_type: mime, meta: { _type: "gradio.FileData" } }],
      }),
    },
    30000
  );
  if (!callRes.ok) {
    throw new Error(`Server model AI menolak permintaan (HTTP ${callRes.status}).`);
  }
  const { event_id: eventId } = await callRes.json();
  if (!eventId) throw new Error("Server model AI tidak mengembalikan event_id.");

  // 2. Ambil hasil (stream SSE) — bisa lama bila Space baru bangun dari hibernasi
  const eventRes = await fetchDenganBatasWaktu(`${baseUrl}/gradio_api/call/predict/${eventId}`, {}, 60000);
  if (!eventRes.ok) {
    throw new Error(`Gagal mengambil hasil prediksi (HTTP ${eventRes.status}).`);
  }
  const list = parseGradioData(ekstrakDataDariSSE(await eventRes.text()));

  if (list.length === 0) {
    throw new Error("Model AI tidak mengembalikan prediksi yang valid.");
  }

  const gedungUtama = list[0];
  const terverifikasi = gedungUtama.confidence >= AMBANG_BATAS_KEYAKINAN;

  return {
    gedungUtama,
    alternatif: list.slice(1, 4),
    terverifikasi,
  };
}
