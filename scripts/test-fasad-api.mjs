// Skrip pengujian API Hugging Face Spaces (Cek Fasad Gedung)
import fs from "fs";
import path from "path";

const HF_URL = "https://hakimgans-model-bangunan-itb-jatinangor.hf.space";
const TEST_IMAGE = path.resolve("assets/images/poi/p05.jpg"); // Foto GKU 1

console.log("=== PENGUJIAN API CEK FASAD GEDUNG ===");
console.log("Target Server:", HF_URL);
console.log("File Sampel:", TEST_IMAGE);

async function testApi() {
  if (!fs.existsSync(TEST_IMAGE)) {
    console.error("File sampel tidak ditemukan:", TEST_IMAGE);
    return;
  }

  const base64Data = fs.readFileSync(TEST_IMAGE, { encoding: "base64" });
  const dataUri = `data:image/jpeg;base64,${base64Data}`;

  console.log("1. Mengirim permintaan synchronous ke /run/predict...");
  try {
    const res = await fetch(`${HF_URL}/run/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [dataUri] }),
    });

    if (res.ok) {
      const json = await res.json();
      console.log("Respons diterima dari /run/predict:");
      console.log(JSON.stringify(json, null, 2));
      return;
    } else {
      console.log(`Endpoint /run/predict menghasilkan status HTTP: ${res.status}`);
    }
  } catch (err) {
    console.log("Gagal memanggil /run/predict:", err.message);
  }

  console.log("2. Menguji alur /call/predict...");
  try {
    const callRes = await fetch(`${HF_URL}/call/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ url: dataUri }] }),
    });

    if (callRes.ok) {
      const callJson = await callRes.json();
      console.log("Event ID diperoleh:", callJson.event_id);

      if (callJson.event_id) {
        console.log("Mengambil hasil prediksi dari stream...");
        const sseRes = await fetch(`${HF_URL}/call/predict/${callJson.event_id}`);
        const sseText = await sseRes.text();
        console.log("Hasil SSE:");
        console.log(sseText);
      }
    } else {
      console.log(`Endpoint /call/predict status: ${callRes.status}`);
    }
  } catch (err) {
    console.log("Gagal memanggil /call/predict:", err.message);
  }
}

testApi();
