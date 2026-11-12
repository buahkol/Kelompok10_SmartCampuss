// Format jarak & waktu tempuh untuk kartu gedung dan detail gedung
const LANGKAH_M_PER_MENIT = 80; // ± 4,8 km/jam jalan kaki

export function formatJarak(m: number): { angka: string; satuan: string } {
  if (m < 1000) return { angka: String(Math.round(m)), satuan: "m" };
  return { angka: (m / 1000).toFixed(1).replace(".", ","), satuan: "km" };
}

export const teksJarak = (m: number) => {
  const { angka, satuan } = formatJarak(m);
  return `${angka} ${satuan}`;
};

export const menitJalan = (m: number) => Math.max(1, Math.round(m / LANGKAH_M_PER_MENIT));

// "09.46" — perkiraan jam tiba bila berangkat sekarang
export function perkiraanTiba(m: number, sekarang = new Date()) {
  const t = new Date(sekarang.getTime() + menitJalan(m) * 60_000);
  const dua = (n: number) => String(n).padStart(2, "0");
  return `${dua(t.getHours())}.${dua(t.getMinutes())}`;
}
