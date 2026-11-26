// Skrip pengujian API Hugging Face Spaces (Cek Fasad Gedung)
import fs from "fs";
import path from "path";

const HF_URL = process.env.EXPO_PUBLIC_FASAD_API_URL || "https://hakimgans-model-bangunan-itb-jatinangor.hf.space";
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN;
const TEST_IMAGE = path.resolve("assets/images/poi/p05.jpg"); // Foto GKU 1

console.log("=== PENGUJIAN API CEK FASAD GEDUNG ===");
console.log("Target Server:", HF_URL);
console.log("File Sampel  :", TEST_IMAGE);
console.log("HF Token     :", HF_TOKEN ? "Terdeteksi (Bearer ***)" : "Tidak ada (Anonim)");

async function testApi() {
  if (!fs.existsSync(TEST_IMAGE)) {
    console.error("File sampel tidak ditemukan:", TEST_IMAGE);
    return;
  }

  const base64Data = fs.readFileSync(TEST_IMAGE, { encoding: "base64" });
  const dataUri = `data:image/jpeg;base64,${base64Data}`;

  const authHeaders = HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};

  console.log("1. Mengirim permintaan prediksi ke /gradio_api/call/predict...");
  try {
    const callRes = await fetch(`${HF_URL}/gradio_api/call/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        data: [{ url: dataUri, orig_name: "fasad_gedung.jpg", mime_type: "image/jpeg", meta: { _type: "gradio.FileData" } }],
      }),
    });

    if (!callRes.ok) {
      console.log(`Endpoint status error: ${callRes.status}`);
      return;
    }

    const callJson = await callRes.json();
    console.log("Event ID diterima:", callJson.event_id);

    if (callJson.event_id) {
      console.log("2. Mengambil hasil prediksi dari SSE stream...");
      const sseRes = await fetch(`${HF_URL}/gradio_api/call/predict/${callJson.event_id}`, {
        headers: authHeaders,
      });
      const sseText = await sseRes.text();
      console.log("Hasil SSE:");
      console.log(sseText);
    }
  } catch (err) {
    console.log("Gagal memanggil API:", err.message);
  }
}

testApi();
