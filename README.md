# Kelompok10_SmartCampuss

Aplikasi mobile Smart Campus berbasis [Expo](https://expo.dev) dan React Native. Saat ini aplikasi menampilkan peta kampus interaktif menggunakan [Mapbox](https://www.mapbox.com).

## Tech Stack

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) + React Native 0.86
- [Expo Router](https://docs.expo.dev/router/introduction/) untuk navigasi berbasis file
- [@rnmapbox/maps](https://rnmapbox.github.io/) untuk peta
- [expo-location](https://docs.expo.dev/versions/v57.0.0/sdk/location/) untuk lokasi perangkat
- TypeScript
- [EAS Build](https://docs.expo.dev/build/introduction/) untuk build di cloud

## Prasyarat

- [Node.js](https://nodejs.org) versi LTS
- Akun [Expo](https://expo.dev) (untuk EAS Build)
- Access token [Mapbox](https://account.mapbox.com/access-tokens/)
- HP Android atau emulator Android

> **Catatan:** Aplikasi ini **tidak bisa dijalankan di Expo Go** karena `@rnmapbox/maps` memakai native code. Gunakan *development build* (lihat di bawah).

## Instalasi

1. Clone repository

   ```bash
   git clone https://github.com/buahkol/Kelompok10_SmartCampuss.git
   cd Kelompok10_SmartCampuss
   ```

2. Install dependency

   ```bash
   npm install
   ```

3. Buat file `.env` di root project, lalu isi dengan token Mapbox

   ```env
   EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxx
   ```

   File `.env` sudah masuk `.gitignore`, jadi jangan di-commit.

## Menjalankan Aplikasi

### 1. Buat development build

Build sekali saja, lalu install APK-nya ke HP. Build ulang hanya diperlukan kalau ada perubahan native (misalnya menambah library native atau mengubah `app.json`).

**Lewat EAS (cloud, tanpa Android Studio):**

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

**Atau build lokal (butuh Android Studio):**

```bash
npx expo run:android
```

### 2. Jalankan dev server

```bash
npx expo start
```

Buka aplikasi development build di HP, lalu scan QR code atau pilih server yang muncul.

## Script

| Perintah           | Fungsi                                  |
| ------------------ | --------------------------------------- |
| `npm start`        | Menjalankan dev server Expo             |
| `npm run android`  | Menjalankan dev server dan membuka Android |
| `npm run ios`      | Menjalankan dev server dan membuka iOS  |
| `npm run lint`     | Menjalankan linter                      |
| `npx tsc --noEmit` | Mengecek tipe TypeScript                |

## Build Profile (EAS)

Didefinisikan di [`eas.json`](./eas.json):

| Profile       | Kegunaan                                         |
| ------------- | ------------------------------------------------ |
| `development` | Development build dengan dev client, untuk ngoding |
| `preview`     | Build internal untuk testing / dibagikan ke tim  |
| `production`  | Build rilis, version code naik otomatis          |

```bash
npx eas-cli@latest build --profile <profile> --platform android
```

## Struktur Project

```
src/
└── app/              # Semua route (Expo Router), setiap file = satu layar
    ├── _layout.tsx   # Root layout (Stack navigator)
    └── index.tsx     # Halaman utama: peta kampus
assets/               # Icon, splash screen, dan gambar
app.json              # Konfigurasi Expo
eas.json              # Konfigurasi EAS Build
```

Komponen, hooks, dan utilitas yang bukan layar sebaiknya ditaruh di luar `src/app/` (misalnya `src/components/`, `src/hooks/`).

## Lisensi

[MIT](./LICENSE) © 2026 Illona Nasywa Hannum
