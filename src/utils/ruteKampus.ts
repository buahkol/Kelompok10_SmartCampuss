// PB10 — Rute pejalan kaki di dalam ITB Jatinangor (F06).
// Rute dihitung di graf jalur kampus (OSM + tambalan tim), BUKAN Mapbox Directions,
// karena Mapbox selalu memutar lewat jalan kendaraan saat jalur teduh/lorong antargedung
// tidak ada atau terputus di datanya. Mapbox walking hanya dipakai untuk potongan
// "menuju jalur terdekat" kalau pengguna masih jauh dari jaringan jalur.
import jalurManual from "../data/jalurManual.json";
import jalurOsm from "../data/jalurOsm.json";
import { bangunGraf, keXY, proyeksiSegmen, ruteGraf, type Graf, type KoleksiJalur, type Titik } from "./grafJalur";
import { dalamKampus } from "./kampus";

export type { Titik };
type Posisi = { lat: number; lng: number };

export const SIMPANG_M = 30; // menyimpang lebih dari ini → rute dihitung ulang
export const TIBA_M = 20; // dianggap tiba dalam radius ini
export const KECEPATAN_JALAN_MPS = 1.25; // ± 4,5 km/jam
export const AKSES_MAPBOX_M = 60; // jarak ke jalur terdekat di atas ini → potongan awal pakai Mapbox walking
export const ATRIBUSI_JALUR = "Data jalur © OpenStreetMap contributors";

export type Rute = {
  sumber: "kampus" | "kampus+mapbox" | "mapbox" | "lurus";
  /** Seluruh lintasan [lng, lat] dari posisi pengguna sampai tujuan (dipakai untuk deviasi & sisa jarak) */
  koordinat: Titik[];
  /** Bagian yang mengikuti jalur kampus — digambar sebagai garis rute utama */
  jalur: Titik[];
  /** Potongan pendek di luar jaringan jalur (posisi → jalur, jalur → pintu gedung), digambar putus-putus */
  akses: Titik[][];
  jarakM: number;
  durasiDetik: number;
  renderMs: number;
  /** true kalau seluruh segmen jalur sudah divalidasi lapangan (PB13) */
  tervalidasi: boolean;
  diLuarKampus: boolean;
  catatan: string;
};

let grafCache: Graf | null = null;
export function grafKampus(): Graf {
  grafCache ??= bangunGraf(jalurOsm as unknown as KoleksiJalur, jalurManual as unknown as KoleksiJalur);
  return grafCache;
}

/** GeoJSON seluruh jaringan jalur, untuk ditampilkan tipis di peta */
export const jaringanJalurGeoJSON = {
  type: "FeatureCollection" as const,
  features: [...(jalurOsm as unknown as KoleksiJalur).features, ...(jalurManual as unknown as KoleksiJalur).features].filter(
    (f) => !f.properties.ditutup
  ),
};

const jarakXY = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function panjangGaris(koord: Titik[]) {
  let total = 0;
  for (let i = 1; i < koord.length; i++) total += jarakXY(keXY(koord[i - 1]), keXY(koord[i]));
  return total;
}

function rapikan(koord: Titik[]): Titik[] {
  return koord.filter((c, i) => i === 0 || jarakXY(keXY(c), keXY(koord[i - 1])) > 0.5);
}

async function mapboxWalking(dari: Titik, ke: Titik, token: string): Promise<{ koordinat: Titik[]; jarakM: number } | null> {
  const ctrl = new AbortController();
  const batas = setTimeout(() => ctrl.abort(), 4000); // F06: rute harus tampil ≤ 5 detik
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/${dari[0]},${dari[1]};${ke[0]},${ke[1]}` +
      `?geometries=geojson&overview=full&access_token=${token}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.routes?.[0];
    if (!r) return null;
    return { koordinat: r.geometry.coordinates as Titik[], jarakM: r.distance };
  } catch {
    return null;
  } finally {
    clearTimeout(batas);
  }
}

/**
 * Versi sinkron, hanya graf kampus (tanpa Mapbox) — dipakai hook navigasi supaya rute
 * langsung tersedia dan bisa dihitung ulang tiap kali pengguna menyimpang.
 * Mengembalikan null kalau graf tidak menemukan rute.
 */
export function hitungRuteKampus(posisi: Posisi, tujuan: Posisi): Rute | null {
  const mulai = Date.now();
  const dari: Titik = [posisi.lng, posisi.lat];
  const ke: Titik = [tujuan.lng, tujuan.lat];
  const diLuarKampus = !dalamKampus(dari);
  const hasil = ruteGraf(grafKampus(), dari, ke);
  if (!hasil) return null;
  const akses: Titik[][] = [];
  const awal: Titik[] = !diLuarKampus && hasil.awal.jarakM > 1 ? [dari] : [];
  if (awal.length) akses.push([dari, hasil.awal.titik]);
  const akhir: Titik[] = hasil.akhir.jarakM > 1 ? [ke] : [];
  if (akhir.length) akses.push([hasil.akhir.titik, ke]);
  const koordinat = rapikan([...awal, ...hasil.koordinat, ...akhir]);
  const jarakM = panjangGaris(koordinat);
  return {
    sumber: "kampus",
    koordinat,
    jalur: rapikan(hasil.koordinat),
    akses,
    jarakM,
    durasiDetik: jarakM / KECEPATAN_JALAN_MPS,
    renderMs: Date.now() - mulai,
    tervalidasi: hasil.semuaTervalidasi,
    diLuarKampus,
    catatan: diLuarKampus
      ? "Kamu berada di luar kampus. Rute dimulai dari titik jalur kampus terdekat."
      : "Jalur pejalan kaki kampus",
  };
}

export async function hitungRute(posisi: Posisi, tujuan: Posisi, opsi: { token?: string } = {}): Promise<Rute> {
  const mulai = Date.now();
  const dari: Titik = [posisi.lng, posisi.lat];
  const ke: Titik = [tujuan.lng, tujuan.lat];
  const token = opsi.token ?? "";
  const diLuarKampus = !dalamKampus(dari);

  const selesai = (r: Omit<Rute, "jarakM" | "durasiDetik" | "renderMs" | "diLuarKampus">): Rute => {
    const koordinat = rapikan(r.koordinat);
    const jarakM = panjangGaris(koordinat);
    return { ...r, koordinat, jarakM, durasiDetik: jarakM / KECEPATAN_JALAN_MPS, renderMs: Date.now() - mulai, diLuarKampus };
  };

  const hasil = ruteGraf(grafKampus(), dari, ke);
  if (hasil) {
    const akses: Titik[][] = [];
    let awal: Titik[] = [];
    let sumber: Rute["sumber"] = "kampus";

    if (diLuarKampus) {
      // NG03: tidak memandu dari luar kampus — rute dimulai di titik jalur terdekat
    } else if (hasil.awal.jarakM > AKSES_MAPBOX_M && token) {
      const mb = await mapboxWalking(dari, hasil.awal.titik, token);
      if (mb) {
        awal = mb.koordinat;
        sumber = "kampus+mapbox";
      } else {
        awal = [dari];
      }
      akses.push([...awal, hasil.awal.titik]);
    } else if (hasil.awal.jarakM > 1) {
      awal = [dari];
      akses.push([dari, hasil.awal.titik]);
    }

    const akhir: Titik[] = hasil.akhir.jarakM > 1 ? [ke] : [];
    if (akhir.length) akses.push([hasil.akhir.titik, ke]);

    return selesai({
      sumber,
      koordinat: [...awal, ...hasil.koordinat, ...akhir],
      jalur: rapikan(hasil.koordinat),
      akses,
      tervalidasi: hasil.semuaTervalidasi,
      catatan: diLuarKampus
        ? "Kamu berada di luar kampus. Rute dimulai dari titik jalur kampus terdekat."
        : hasil.semuaTervalidasi
          ? "Jalur pejalan kaki kampus (tervalidasi)"
          : "Jalur pejalan kaki kampus (belum divalidasi lapangan)",
    });
  }

  // Graf gagal (seharusnya tidak terjadi di dalam kampus) → Mapbox walking, lalu garis lurus
  if (token) {
    const mb = await mapboxWalking(dari, ke, token);
    if (mb)
      return selesai({ sumber: "mapbox", koordinat: mb.koordinat, jalur: mb.koordinat, akses: [], tervalidasi: false, catatan: "Rute Mapbox walking (cadangan)" });
  }
  return selesai({ sumber: "lurus", koordinat: [dari, ke], jalur: [], akses: [[dari, ke]], tervalidasi: false, catatan: "Rute tidak ditemukan, ditampilkan arah lurus" });
}

// Posisi terdekat pada polyline: indeks segmen, parameter t, dan jarak
function proyeksiGaris(p: Posisi, koord: Titik[]) {
  const pxy = keXY([p.lng, p.lat]);
  let terbaik = { i: 0, t: 0, jarakM: Infinity };
  for (let i = 1; i < koord.length; i++) {
    const r = proyeksiSegmen(pxy, keXY(koord[i - 1]), keXY(koord[i]));
    if (r.jarakM < terbaik.jarakM) terbaik = { i, t: r.t, jarakM: r.jarakM };
  }
  return terbaik;
}

/** Jarak pengguna ke lintasan rute (m) — > SIMPANG_M berarti menyimpang */
export function jarakKeRute(p: Posisi, koord: Titik[]) {
  if (koord.length === 1) return jarakXY(keXY([p.lng, p.lat]), keXY(koord[0]));
  return proyeksiGaris(p, koord).jarakM;
}

/** Sisa jarak di sepanjang rute dari posisi pengguna sampai tujuan (m) */
export function sisaJarakM(p: Posisi, koord: Titik[]) {
  if (koord.length < 2) return 0;
  const { i, t } = proyeksiGaris(p, koord);
  const a = keXY(koord[i - 1]);
  const b = keXY(koord[i]);
  let sisa = jarakXY(a, b) * (1 - t);
  for (let k = i + 1; k < koord.length; k++) sisa += jarakXY(keXY(koord[k - 1]), keXY(koord[k]));
  return sisa;
}

/** Tiba bila dekat POI tujuan, atau sudah di ujung jalur (pintu gedung bisa > TIBA_M dari titik POI) */
export function sudahTiba(p: Posisi, tujuan: Posisi, rute: Rute) {
  const dTujuan = jarakXY(keXY([p.lng, p.lat]), keXY([tujuan.lng, tujuan.lat]));
  const ujung = rute.jalur[rute.jalur.length - 1];
  const dUjung = ujung ? jarakXY(keXY([p.lng, p.lat]), keXY(ujung)) : Infinity;
  return dTujuan <= TIBA_M || dUjung <= TIBA_M / 2;
}

// Douglas–Peucker: buang titik lengkung kecil supaya belokan yang terdeteksi hanya belokan nyata
function sederhanakan(koord: Titik[], toleransiM: number): number[] {
  const xy = koord.map(keXY);
  const simpan = new Array<boolean>(koord.length).fill(false);
  simpan[0] = simpan[koord.length - 1] = true;
  const tumpuk: [number, number][] = [[0, koord.length - 1]];
  while (tumpuk.length) {
    const [a, b] = tumpuk.pop()!;
    let maks = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = proyeksiSegmen(xy[i], xy[a], xy[b]).jarakM;
      if (d > maks) {
        maks = d;
        idx = i;
      }
    }
    if (idx !== -1 && maks > toleransiM) {
      simpan[idx] = true;
      tumpuk.push([a, idx], [idx, b]);
    }
  }
  return simpan.flatMap((s, i) => (s ? [i] : []));
}

export type Belokan = {
  indeks: number; // indeks di `koordinat`
  titik: Titik;
  dariAwalM: number;
  belokanDerajat: number; // + kanan, − kiri
  arah: "kanan" | "kiri" | "sedikit ke kanan" | "sedikit ke kiri" | "putar balik";
};

/** Titik-titik belokan untuk panduan suara (PB11) */
export function titikBelokan(koord: Titik[], minDerajat = 30): Belokan[] {
  if (koord.length < 3) return [];
  const idx = sederhanakan(koord, 3);
  const xy = koord.map(keXY);
  const kumulatif = [0];
  for (let i = 1; i < xy.length; i++) kumulatif.push(kumulatif[i - 1] + jarakXY(xy[i - 1], xy[i]));
  const arahKe = (a: [number, number], b: [number, number]) => (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;

  const hasil: Belokan[] = [];
  for (let k = 1; k < idx.length - 1; k++) {
    const [p, c, n] = [xy[idx[k - 1]], xy[idx[k]], xy[idx[k + 1]]];
    let sudut = arahKe(c, n) - arahKe(p, c);
    sudut = ((sudut + 540) % 360) - 180;
    if (Math.abs(sudut) < minDerajat) continue;
    const dariAwalM = kumulatif[idx[k]];
    const prev = hasil[hasil.length - 1];
    if (prev && dariAwalM - prev.dariAwalM < 8) {
      // dua belokan berdekatan (mis. zig-zag di tepi gedung) digabung jadi satu
      prev.belokanDerajat = Math.round(prev.belokanDerajat + sudut);
      prev.arah = namaArah(prev.belokanDerajat);
      continue;
    }
    hasil.push({ indeks: idx[k], titik: koord[idx[k]], dariAwalM, belokanDerajat: Math.round(sudut), arah: namaArah(sudut) });
  }
  return hasil.filter((b) => Math.abs(b.belokanDerajat) >= minDerajat);
}

function namaArah(sudut: number): Belokan["arah"] {
  const s = Math.abs(sudut);
  if (s >= 150) return "putar balik";
  if (s < 50) return sudut > 0 ? "sedikit ke kanan" : "sedikit ke kiri";
  return sudut > 0 ? "kanan" : "kiri";
}

export function formatJarak(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function formatDurasi(detik: number) {
  return detik < 60 ? "< 1 menit" : `${Math.round(detik / 60)} menit`;
}
