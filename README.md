# Gesture Morphing Particles

Aplikasi browser yang mengubah partikel mengikuti gestur tangan. Tiga.js merender partikel, MediaPipe Tasks Vision mendeteksi 21 landmark tangan dari kamera.

## Gestur

| Gestur | Bentuk |
| --- | --- |
| Open | Galaxy |
| Fist | Saturnus, ikuti tangan |
| Peace | I LOVE YOU |
| Metal | Hati, ikuti tangan |

Gestur baru hanya di-commit setelah stabil selama 300 ms.

## Kontrol dua tangan

Jarak antara kedua telapak mengatur ukuran bentuk, dari 0.6× sampai 1.8×. Kemiringan telapak tangan pertama memutar bentuk; posisi tangan tetap mengontrol Saturnus dan hati seperti sebelumnya. Gestur selalu diambil dari tangan pertama. Jika hanya satu tangan terdeteksi, ukuran kembali ke 1× dan kontrol satu tangan tetap berfungsi normal.

## Pengembangan

Butuh Node `^20.19.0` atau `>=22.12.0`.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173/gesture-morphing-particles/`, lalu klik **Mulai** dan izinkan kamera.

`predev` menyalin file WASM MediaPipe dari `node_modules` ke `public/wasm/`. Jalankan `npm run copy:mediapipe` jika perlu menyalin ulang tanpa menjalankan dev server.

## Build dan preview

```bash
npm run build
npm run preview
```

Buka `http://localhost:4173/gesture-morphing-particles/`.

## Kamera dan aset

- `public/models/hand_landmarker.task` sudah disimpan di repo.
- `public/wasm/` digenerate otomatis dan sengaja tidak di-commit.
- Kamera depan dipakai lewat `facingMode: "user"` dan tampilan video di-mirror dengan CSS.
- Pengujian di HP fisik membutuhkan HTTPS/tunnel; `localhost` adalah origin aman, tetapi `http://<ip>:8000` bukan.
- Untuk memaksa CPU delegate saat debugging, tambahkan `?delegate=cpu` ke URL, misalnya `http://localhost:5173/gesture-morphing-particles/?delegate=cpu`.

## Deploy

Push ke branch `main` menjalankan `.github/workflows/deploy.yml` dan men-deploy `dist/` ke GitHub Pages. `base` di `vite.config.js` harus sama dengan path repo, yaitu `/gesture-morphing-particles/`.

## Struktur

- `index.html`: kerangka UI dan state `intro`, `loading`, `active`, `error`.
- `script.js`: shim ESM ke `src/main.js`.
- `src/config.js`: konstanta, copy UI, path aset, dan jumlah partikel adaptif.
- `src/shapes.js`: matematika bentuk partikel.
- `src/scene.js`: scene, animasi, dan resize Three.js.
- `src/gestures.js`: deteksi dan stabilisasi gestur.
- `src/interaction.js`: jarak dua tangan, skala, dan kemiringan telapak.
- `src/camera.js`: Hand Landmarker, `getUserMedia`, dan pesan error kamera.
- `src/ui.js`: panel, indikator gestur, dan fullscreen.
- `src/main.js`: orkestrasi aplikasi.
