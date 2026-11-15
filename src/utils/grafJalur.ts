// PB10 — Graf jalur pejalan kaki kampus + pencarian rute terpendek (Dijkstra).
// Sumber graf: GeoJSON LineString (jalurOsm.json dari OSM + jalurManual.json tambalan tim).
// Simpul = setiap titik garis; dua garis tersambung kalau berbagi titik yang persis sama
// (seperti di OSM). Ujung garis manual yang tidak persis menempel akan di-"snap" ke
// jalur terdekat (≤ SNAP_M) supaya tim tidak perlu menggambar dengan presisi sempurna.

export type Titik = [number, number]; // [lng, lat]

export type FiturJalur = {
  type: "Feature";
  properties: {
    id: string;
    jenis: string;
    sumber: string;
    tervalidasi: boolean;
    teduh?: boolean;
    nama?: string;
    ditutup?: boolean;
  };
  geometry: { type: "LineString"; coordinates: number[][] };
};

export type KoleksiJalur = { type: "FeatureCollection"; features: FiturJalur[] };

type Sisi = { ke: number; panjangM: number; bobot: number; tervalidasi: boolean };

export type Graf = {
  titik: Titik[];
  xy: [number, number][]; // proyeksi meter lokal, untuk hitung jarak cepat
  adj: Sisi[][];
  komponen: number[]; // id komponen terhubung per simpul
  komponenUtama: number; // komponen terbesar — hanya ini yang dipakai untuk rute
  ukuranKomponen: Map<number, number>;
  /** Sambungan yang dibuat otomatis (ujung menggantung) — perlu dicek lapangan */
  sambunganOtomatis: [Titik, Titik][];
};

// Ujung garis manual ditempelkan ke jalur lain bila jaraknya ≤ ini
export const SNAP_M = 10;
// Ujung jalur yang "menggantung" (mis. footway berhenti di tepi jalan tanpa titik temu di OSM)
// disambung ke jalur terdekat bila jaraknya ≤ ini
export const SAMBUNG_UJUNG_M = 12;

// Faktor bobot: < 1 berarti lebih disukai. Jalur khusus pejalan kaki dan jalur teduh
// diutamakan daripada jalan kendaraan, tapi jalan tetap dipakai kalau jauh lebih pendek.
const BOBOT_JENIS: Record<string, number> = {
  footway: 0.9,
  pedestrian: 0.9,
  corridor: 0.85,
  path: 0.95,
  steps: 1.3,
  service: 1.0,
  living_street: 1.0,
  residential: 1.05,
  unclassified: 1.1,
  tertiary: 1.15,
  secondary: 1.2,
  track: 1.1,
};
const BOBOT_TEDUH = 0.8;

// Proyeksi equirectangular di sekitar ITB Jatinangor — galat < 0,1% dalam radius 2 km
const LAT0 = -6.929;
const M_PER_DERAJAT_LAT = 110_574;
const M_PER_DERAJAT_LNG = 111_320 * Math.cos((LAT0 * Math.PI) / 180);
export const keXY = ([lng, lat]: Titik): [number, number] => [lng * M_PER_DERAJAT_LNG, lat * M_PER_DERAJAT_LAT];
const dariXY = ([x, y]: [number, number]): Titik => [x / M_PER_DERAJAT_LNG, y / M_PER_DERAJAT_LAT];
const jarakXY = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Titik terdekat p pada segmen ab → parameter t∈[0,1] dan jarak
export function proyeksiSegmen(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  const q: [number, number] = [a[0] + t * dx, a[1] + t * dy];
  return { t, q, jarakM: jarakXY(p, q) };
}

const kunci = ([lng, lat]: number[]) => `${lng.toFixed(7)},${lat.toFixed(7)}`;

export function bangunGraf(...koleksi: KoleksiJalur[]): Graf {
  const titik: Titik[] = [];
  const xy: [number, number][] = [];
  const adj: Sisi[][] = [];
  const indeks = new Map<string, number>();

  const simpul = (c: number[]) => {
    const k = kunci(c);
    let i = indeks.get(k);
    if (i === undefined) {
      i = titik.length;
      indeks.set(k, i);
      titik.push([c[0], c[1]]);
      xy.push(keXY([c[0], c[1]]));
      adj.push([]);
    }
    return i;
  };

  const sambung = (a: number, b: number, faktor: number, tervalidasi: boolean) => {
    if (a === b) return;
    const panjangM = jarakXY(xy[a], xy[b]);
    adj[a].push({ ke: b, panjangM, bobot: panjangM * faktor, tervalidasi });
    adj[b].push({ ke: a, panjangM, bobot: panjangM * faktor, tervalidasi });
  };

  const putus = (a: number, b: number) => {
    const sisi = adj[a].find((s) => s.ke === b);
    adj[a] = adj[a].filter((s) => s.ke !== b);
    adj[b] = adj[b].filter((s) => s.ke !== a);
    return sisi;
  };

  // Belah segmen a–b di titik q (parameter t) → simpul baru di tengahnya
  const belah = (a: number, b: number, t: number, q: [number, number]): number => {
    if (t < 1e-6) return a;
    if (t > 1 - 1e-6) return b;
    const lama = putus(a, b)!;
    const faktor = lama.bobot / lama.panjangM;
    const m = simpul(dariXY(q));
    sambung(a, m, faktor, lama.tervalidasi);
    sambung(m, b, faktor, lama.tervalidasi);
    return m;
  };

  // Segmen terdekat ke p, mengecualikan segmen yang menyentuh simpul di `kecuali`
  const segmenTerdekat = (p: [number, number], kecuali: Set<number> = new Set()) => {
    let terbaik: { a: number; b: number; t: number; q: [number, number]; jarakM: number } | null = null;
    for (let a = 0; a < adj.length; a++) {
      if (kecuali.has(a)) continue;
      for (const s of adj[a]) {
        if (s.ke < a || kecuali.has(s.ke)) continue; // tiap segmen sekali
        const r = proyeksiSegmen(p, xy[a], xy[s.ke]);
        if (!terbaik || r.jarakM < terbaik.jarakM) terbaik = { a, b: s.ke, ...r };
      }
    }
    return terbaik;
  };

  // Snap: kalau c tidak persis di simpul yang ada, cari segmen terdekat dan belah segmennya
  const simpulSnap = (c: number[]): number => {
    const ada = indeks.get(kunci(c));
    if (ada !== undefined) return ada;
    const terbaik = segmenTerdekat(keXY([c[0], c[1]]));
    if (!terbaik || terbaik.jarakM > SNAP_M) return simpul(c); // dibiarkan lepas
    return belah(terbaik.a, terbaik.b, terbaik.t, terbaik.q);
  };

  const sisiManual: [number, number][] = [];

  koleksi.forEach((kol, urutan) => {
    for (const f of kol.features) {
      if (f.geometry?.type !== "LineString" || f.properties?.ditutup) continue;
      const cs = f.geometry.coordinates;
      if (cs.length < 2) continue;
      const faktor = (BOBOT_JENIS[f.properties.jenis] ?? 1.1) * (f.properties.teduh ? BOBOT_TEDUH : 1);
      const ids = cs.map((c, i) =>
        // koleksi pertama (OSM) sudah tersambung lewat titik bersama; koleksi berikutnya
        // (manual) ujungnya di-snap ke jalur yang sudah ada
        urutan > 0 && (i === 0 || i === cs.length - 1) ? simpulSnap(c) : simpul(c)
      );
      for (let i = 1; i < ids.length; i++) {
        sambung(ids[i - 1], ids[i], faktor, !!f.properties.tervalidasi);
        if (urutan > 0) sisiManual.push([ids[i - 1], ids[i]]);
      }
    }
  });

  // Garis manual yang memotong jalur lain → jadikan simpang (dibelah di titik potong)
  const antre = [...sisiManual];
  while (antre.length) {
    const [u, v] = antre.pop()!;
    if (!adj[u].some((s) => s.ke === v)) continue; // sudah dibelah
    const p = xy[u];
    const d1 = [xy[v][0] - p[0], xy[v][1] - p[1]];
    let potong: { a: number; b: number; t: number; w: number; q: [number, number] } | null = null;
    for (let a = 0; a < adj.length && !potong; a++) {
      if (a === u || a === v) continue;
      for (const s of adj[a]) {
        const b = s.ke;
        if (b < a || b === u || b === v) continue;
        const d2 = [xy[b][0] - xy[a][0], xy[b][1] - xy[a][1]];
        const den = d1[0] * d2[1] - d1[1] * d2[0];
        if (Math.abs(den) < 1e-9) continue;
        const w0 = [xy[a][0] - p[0], xy[a][1] - p[1]];
        const t = (w0[0] * d2[1] - w0[1] * d2[0]) / den;
        const w = (w0[0] * d1[1] - w0[1] * d1[0]) / den;
        if (t > 1e-6 && t < 1 - 1e-6 && w > 1e-6 && w < 1 - 1e-6) {
          potong = { a, b, t, w, q: [p[0] + t * d1[0], p[1] + t * d1[1]] };
          break;
        }
      }
    }
    if (!potong) continue;
    const m = belah(potong.a, potong.b, potong.w, potong.q);
    const lama = putus(u, v)!;
    const faktor = lama.bobot / lama.panjangM;
    sambung(u, m, faktor, lama.tervalidasi);
    sambung(m, v, faktor, lama.tervalidasi);
    antre.push([u, m], [m, v]);
  }

  // Ujung menggantung dekat jalur lain → sambung (gap mapping yang umum di OSM)
  const sambunganOtomatis: [Titik, Titik][] = [];
  const ujung = adj.flatMap((s, i) => (s.length === 1 ? [i] : []));
  for (const i of ujung) {
    if (adj[i].length !== 1) continue;
    const terbaik = segmenTerdekat(xy[i], new Set([i, adj[i][0].ke]));
    if (!terbaik || terbaik.jarakM > SAMBUNG_UJUNG_M || terbaik.jarakM < 0.3) continue;
    const m = belah(terbaik.a, terbaik.b, terbaik.t, terbaik.q);
    sambung(i, m, 1.0, false);
    sambunganOtomatis.push([titik[i], titik[m]]);
  }

  // Komponen terhubung (BFS)
  const komponen = new Array<number>(titik.length).fill(-1);
  const ukuranKomponen = new Map<number, number>();
  let komponenUtama = -1;
  for (let s = 0, id = 0; s < titik.length; s++) {
    if (komponen[s] !== -1) continue;
    const antre = [s];
    komponen[s] = id;
    let n = 0;
    while (antre.length) {
      const u = antre.pop()!;
      n++;
      for (const { ke } of adj[u]) {
        if (komponen[ke] === -1) {
          komponen[ke] = id;
          antre.push(ke);
        }
      }
    }
    ukuranKomponen.set(id, n);
    if (komponenUtama === -1 || n > ukuranKomponen.get(komponenUtama)!) komponenUtama = id;
    id++;
  }

  return { titik, xy, adj, komponen, komponenUtama, ukuranKomponen, sambunganOtomatis };
}

export type Proyeksi = { a: number; b: number; t: number; titik: Titik; xy: [number, number]; jarakM: number };

// Titik terdekat di jaringan jalur (hanya komponen utama, supaya tidak terjebak di potongan jalur terisolasi)
export function proyeksiKeGraf(g: Graf, p: Titik): Proyeksi | null {
  const pxy = keXY(p);
  let terbaik: Proyeksi | null = null;
  for (let a = 0; a < g.adj.length; a++) {
    if (g.komponen[a] !== g.komponenUtama) continue;
    for (const s of g.adj[a]) {
      if (s.ke < a) continue;
      const r = proyeksiSegmen(pxy, g.xy[a], g.xy[s.ke]);
      if (!terbaik || r.jarakM < terbaik.jarakM)
        terbaik = { a, b: s.ke, t: r.t, xy: r.q, titik: dariXY(r.q), jarakM: r.jarakM };
    }
  }
  return terbaik;
}

// Min-heap sederhana untuk Dijkstra
class Heap {
  private d: [number, number][] = [];
  get size() {
    return this.d.length;
  }
  push(prio: number, v: number) {
    const d = this.d;
    d.push([prio, v]);
    let i = d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (d[p][0] <= d[i][0]) break;
      [d[p], d[i]] = [d[i], d[p]];
      i = p;
    }
  }
  pop(): [number, number] {
    const d = this.d;
    const top = d[0];
    const last = d.pop()!;
    if (d.length) {
      d[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < d.length && d[l][0] < d[m][0]) m = l;
        if (r < d.length && d[r][0] < d[m][0]) m = r;
        if (m === i) break;
        [d[m], d[i]] = [d[i], d[m]];
        i = m;
      }
    }
    return top;
  }
}

export type HasilGraf = {
  koordinat: Titik[]; // dari titik proyeksi awal sampai titik proyeksi akhir, mengikuti jalur
  panjangM: number;
  awal: Proyeksi;
  akhir: Proyeksi;
  semuaTervalidasi: boolean;
};

// Potongan lurus di luar jalur (posisi/POI → titik masuk jalur) dibuat lebih "mahal" supaya
// rute lebih memilih masuk lewat jalur (mis. jalur teduh sampai pintu gedung) daripada
// memotong lurus ke jalan terdekat.
export const PENALTI_AKSES = 1.5;
// Kandidat titik masuk: semua segmen dalam (jarak terdekat + KANDIDAT_EKSTRA_M), minimal KANDIDAT_MIN_M
const KANDIDAT_EKSTRA_M = 15;
const KANDIDAT_MIN_M = 25;

function kandidatMasuk(g: Graf, p: Titik): Proyeksi[] {
  const pxy = keXY(p);
  const semua: Proyeksi[] = [];
  for (let a = 0; a < g.adj.length; a++) {
    if (g.komponen[a] !== g.komponenUtama) continue;
    for (const s of g.adj[a]) {
      if (s.ke < a) continue;
      const r = proyeksiSegmen(pxy, g.xy[a], g.xy[s.ke]);
      semua.push({ a, b: s.ke, t: r.t, xy: r.q, titik: dariXY(r.q), jarakM: r.jarakM });
    }
  }
  if (!semua.length) return [];
  const terdekat = Math.min(...semua.map((k) => k.jarakM));
  const batas = Math.max(terdekat + KANDIDAT_EKSTRA_M, KANDIDAT_MIN_M);
  return semua.filter((k) => k.jarakM <= batas);
}

// Rute terpendek di graf antara dua titik sembarang. Tiap ujung boleh masuk ke jalur di
// beberapa kandidat titik; Dijkstra memilih kombinasi dengan total bobot terkecil.
export function ruteGraf(g: Graf, dari: Titik, ke: Titik): HasilGraf | null {
  const kAwal = kandidatMasuk(g, dari);
  const kAkhir = kandidatMasuk(g, ke);
  if (!kAwal.length || !kAkhir.length) return null;

  // Simpul virtual: S = posisi awal, T = tujuan, lalu satu simpul per kandidat titik masuk
  const n = g.titik.length;
  const S = n;
  const T = n + 1;
  const titikVirtual = new Map<number, Proyeksi>();
  const ekstra = new Map<number, Sisi[]>();
  const tambah = (u: number, v: number, panjangM: number, faktor: number, tervalidasi: boolean) => {
    ekstra.set(u, [...(ekstra.get(u) ?? []), { ke: v, panjangM, bobot: panjangM * faktor, tervalidasi }]);
    ekstra.set(v, [...(ekstra.get(v) ?? []), { ke: u, panjangM, bobot: panjangM * faktor, tervalidasi }]);
  };
  let berikut = n + 2;
  const pasang = (ujung: number, k: Proyeksi) => {
    const id = berikut++;
    titikVirtual.set(id, k);
    const s = g.adj[k.a].find((x) => x.ke === k.b)!;
    const faktor = s.bobot / s.panjangM;
    tambah(ujung, id, k.jarakM, PENALTI_AKSES, false);
    tambah(id, k.a, s.panjangM * k.t, faktor, s.tervalidasi);
    tambah(id, k.b, s.panjangM * (1 - k.t), faktor, s.tervalidasi);
    return { id, faktor, tervalidasi: s.tervalidasi };
  };
  const vAwal = kAwal.map((k) => ({ k, ...pasang(S, k) }));
  const vAkhir = kAkhir.map((k) => ({ k, ...pasang(T, k) }));
  // Kandidat awal & akhir di segmen yang sama → bisa langsung tanpa lewat simpul graf
  for (const x of vAwal)
    for (const y of vAkhir)
      if ((x.k.a === y.k.a && x.k.b === y.k.b) || (x.k.a === y.k.b && x.k.b === y.k.a))
        tambah(x.id, y.id, jarakXY(x.k.xy, y.k.xy), x.faktor, x.tervalidasi);

  const tetangga = (u: number): Sisi[] => [...(u < n ? g.adj[u] : []), ...(ekstra.get(u) ?? [])];

  const jarak = new Map<number, number>([[S, 0]]);
  const sebelum = new Map<number, number>();
  const heap = new Heap();
  heap.push(0, S);
  while (heap.size) {
    const [du, u] = heap.pop();
    if (du > (jarak.get(u) ?? Infinity)) continue;
    if (u === T) break;
    for (const s of tetangga(u)) {
      const alt = du + s.bobot;
      if (alt < (jarak.get(s.ke) ?? Infinity)) {
        jarak.set(s.ke, alt);
        sebelum.set(s.ke, u);
        heap.push(alt, s.ke);
      }
    }
  }
  if (!jarak.has(T)) return null;

  const urutan = [T];
  while (urutan[0] !== S) urutan.unshift(sebelum.get(urutan[0])!);
  // urutan = S, kandidatAwal, …simpul graf…, kandidatAkhir, T → ambil bagian di jalur saja
  const diJalur = urutan.slice(1, -1);
  const awal = titikVirtual.get(diJalur[0])!;
  const akhir = titikVirtual.get(diJalur[diJalur.length - 1])!;
  const posisi = (v: number): [number, number] => titikVirtual.get(v)?.xy ?? g.xy[v];
  let panjangM = 0;
  let semuaTervalidasi = true;
  for (let i = 1; i < diJalur.length; i++) {
    const u = diJalur[i - 1];
    const s = tetangga(u).find((x) => x.ke === diJalur[i])!;
    panjangM += jarakXY(posisi(u), posisi(diJalur[i]));
    semuaTervalidasi &&= s.tervalidasi;
  }
  const koordinat = diJalur.map((v) => titikVirtual.get(v)?.titik ?? g.titik[v]);
  return { koordinat, panjangM, awal, akhir, semuaTervalidasi };
}
