// Daftar ruangan per gedung dari Master Ruangan resmi Kampus ITB Jatinangor
// (jatinangor.itb.ac.id). Gedung yang tidak tercantum di master ruangan
// (Patung Transformer, Lab Terpadu, Asrama, Masjid Al-Jabbar) belum punya data.

export type Ruangan = {
  id: string;
  nomor: string;
  lantai: number;
  gedungId: string;
  keterangan: string;
  kapasitas: number;
};

// [nomor, lantai, kapasitas, keterangan tambahan]
type Baris = [string, number, number, string?];

const DATA: Record<string, Baris[]> = {
  // GSG: tercatat sebagai satu ruang
  P02: [["GSG 1-8", 1, 400, "Ruang serbaguna"]],
  // GKU 1: dikelola DKIJ
  P05: [
    ["K1.9675", 3, 100], ["K1.9676", 3, 100, "ber-AC"], ["K1.9677", 3, 100], ["K1.9678", 3, 100],
    ["K1.9679a", 5, 100], ["K1.9679b", 5, 100], ["K1.9680a", 5, 100], ["K1.9680b", 5, 100],
  ],
  // GKU 2
  P06: [
    ["K2.9653", 2, 100, "ber-AC"], ["K2.9654", 2, 100], ["K2.9655", 2, 100], ["K2.9656", 2, 100],
    ["K2.9657", 3, 500, "Auditorium"],
  ],
  // Gedung Rektorat (Gedung Utama)
  P07: [
    ["U 101", 1, 10, "Ruang Rapat Multimedia"], ["U 109", 1, 55], ["U 110", 1, 5, "Ruang Studio"], ["U 111", 1, 40],
    ["U 202", 2, 20],
    ["U 301", 3, 150, "Ruang Seminar"], ["U 304", 3, 70, "Lab. Komputer"], ["U 305", 3, 100], ["U 307", 3, 70], ["U 313", 3, 70], ["U 315", 3, 60], ["U 316", 3, 55],
  ],
  // KOICA: dikelola STEI
  P08: [
    ["Multipurpose", 1, 70, "Ruang serbaguna"],
    ["Lecture 1", 2, 40], ["Lecture 2", 2, 40], ["Lecture 3", 2, 50], ["Lecture 4", 2, 40],
  ],
  // GKU 3
  P09: [
    ["K3.101", 1, 140], ["K3.102", 1, 100],
    ["K3.201", 2, 100], ["K3.202", 2, 100], ["K3.203", 2, 100], ["K3.204", 2, 100],
    ["K3.301", 3, 100], ["K3.302", 3, 100], ["K3.303", 3, 100], ["K3.304", 3, 100],
  ],
};

export const RUANGAN: Ruangan[] = Object.entries(DATA).flatMap(([gedungId, baris]) =>
  baris.map(([nomor, lantai, kapasitas, tambahan]) => ({
    id: `${gedungId}-${nomor}`,
    nomor,
    lantai,
    gedungId,
    kapasitas,
    keterangan: `${tambahan ?? "Ruang kuliah"} · ${kapasitas} orang`,
  })),
);

// Pencocokan nomor tanpa peduli huruf besar/kecil, spasi, dan titik ("k3 201" cocok dengan "K3.201")
const normal = (s: string) => s.toLowerCase().replace(/[\s.]/g, "");
export const cocokRuangan = (r: Ruangan, kata: string) => normal(r.nomor).includes(normal(kata));
