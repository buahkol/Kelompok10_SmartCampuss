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

// Mengekstrak payload JSON dari respons Server-Sent Events (SSE) Gradio
function ekstrakDataDariSSE(sseText: string): any {
  const lines = sseText.split(/\r?\n/);
  let lastDataLine = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("data:")) {
      lastDataLine = line.replace(/^data:\s*/, "");
    }
  }

  if (lastDataLine) {
    try {
      return JSON.parse(lastDataLine);
    } catch {
      // Abaikan error parse jika baris bukan JSON
    }
  }

  // Jika tidak berformat data:, coba parse teks penuh
  try {
    return JSON.parse(sseText);
  } catch {
    return null;
  }
}

export type InputKlasifikasiFasad = {
  uri: string;
  base64?: string | null;
  mimeType?: string;
};

/**
 * Mengirim gambar fasad gedung ke API model Hugging Face Spaces.
 */
export async function klasifikasiFasadGedung(
  input: InputKlasifikasiFasad,
  customBaseUrl?: string
): Promise<HasilKlasifikasiFasad> {
  const baseUrl = (customBaseUrl || DEFAULT_FASAD_API_URL).replace(/\/+$/, "");
  const mime = input.mimeType || "image/jpeg";
  const dataUri = input.base64 ? `data:${mime};base64,${input.base64}` : null;

  let rawResult: any = null;
  let lastError: any = null;

  // Percobaan 1: Endpoint synchronous `/run/predict` atau `/api/predict` dengan Base64
  if (dataUri) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${baseUrl}/run/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ data: [dataUri] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          rawResult = json.data;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Percobaan 2: Unggah file ke `/upload` lalu panggil `/call/predict` (Gradio 4 / 5 standard)
  if (!rawResult) {
    try {
      const formData = new FormData();
      // Gunakan URI lokal file untuk React Native FormData
      formData.append("files", {
        uri: input.uri,
        name: "fasad_gedung.jpg",
        type: mime,
      } as any);

      const uploadController = new AbortController();
      const uploadTimeout = setTimeout(() => uploadController.abort(), 25000);

      const uploadRes = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        body: formData,
        signal: uploadController.signal,
      });
      clearTimeout(uploadTimeout);

      if (uploadRes.ok) {
        const uploadJson = await uploadRes.json();
        const serverFilePath = Array.isArray(uploadJson) ? uploadJson[0] : uploadJson;

        if (serverFilePath) {
          // Panggil `/call/predict`
          const callRes = await fetch(`${baseUrl}/call/predict`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: [
                typeof serverFilePath === "string"
                  ? { path: serverFilePath, meta: { _type: "gradio.FileData" } }
                  : serverFilePath,
              ],
            }),
          });

          if (callRes.ok) {
            const callJson = await callRes.json();
            const eventId = callJson.event_id;

            if (eventId) {
              // Ambil hasil stream dari `/call/predict/{event_id}`
              const eventRes = await fetch(`${baseUrl}/call/predict/${eventId}`);
              const sseText = await eventRes.text();
              const sseData = ekstrakDataDariSSE(sseText);
              if (sseData) {
                rawResult = sseData;
              }
            }
          }
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Percobaan 3: Panggil `/call/predict` langsung dengan dataUri
  if (!rawResult && dataUri) {
    try {
      const callRes = await fetch(`${baseUrl}/call/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{ url: dataUri }],
        }),
      });

      if (callRes.ok) {
        const callJson = await callRes.json();
        const eventId = callJson.event_id;
        if (eventId) {
          const eventRes = await fetch(`${baseUrl}/call/predict/${eventId}`);
          const sseText = await eventRes.text();
          const sseData = ekstrakDataDariSSE(sseText);
          if (sseData) {
            rawResult = sseData;
          }
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!rawResult) {
    const errorMsg =
      lastError?.message ||
      "Gagal menghubungi server model AI. Ruang Hugging Face mungkin sedang booting/hibernasi atau jaringan bermasalah.";
    throw new Error(errorMsg);
  }

  const list = parseGradioData(rawResult);

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
