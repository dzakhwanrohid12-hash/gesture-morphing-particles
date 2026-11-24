# AGENTS.md

## Toolchain
- Aplikasi browser Vite + JS modules (ESM). Dependency npm: `three` r187, `@mediapipe/tasks-vision` 1.2.3, dan `vite` 8.3.8.
- Tidak ada test, lint, atau typecheck. Verifikasi dengan `npm run build`, lalu `npm run preview` dan cek manual di browser + console.
- `index.html` memuat `<script type="module" src="/script.js">`. `script.js` hanya shim `import "./src/main.js"`; `style.css` di-import dari `src/main.js`. Jangan kembali ke `<script>` CDN global tanpa mengubah HTML dan seluruh modul.
- `vite.config.js` memakai `base: "/gesture-morphing-particles/"`. Dev: `http://localhost:5173/gesture-morphing-particles/`; preview: `http://localhost:4173/gesture-morphing-particles/`.
- `npm run dev` dan `npm run build` otomatis menjalankan `scripts/copy-mediapipe.mjs` untuk menyalin WASM ke `public/wasm/`. Folder itu di-ignore; `public/models/hand_landmarker.task` di-commit.
- Deploy GitHub Pages lewat `.github/workflows/deploy.yml` pada push ke `main`. Ubah `base` di `vite.config.js` jika path repo berganti.

## Wiring yang mudah rusak
- `initThree()` jalan saat load, tetapi kamera hanya dipanggil dari tombol `Mulai`/`Coba lagi` lewat `startExperience()` di `src/main.js`. Jangan kembalikan `getUserMedia` ke level atas.
- `startHandTracking()` menyiapkan `HandLandmarker` + stream, lalu `start()` dipanggil setelah `body[data-app-state]` menjadi `active`. `handleLandmarks()` juga punya guard state; jangan hapus.
- `body[data-app-state]` bernilai `intro`, `loading`, `active`, atau `error` dan mengontrol seluruh UI.
- Gestur baru hanya di-commit setelah stabil 300 ms (`HOLD_MS`). `pendingGesture`/`pendingSince` ada di `createGestureTracker()` dan `calculateTarget()` hanya dipanggil lewat `applyGesture()` saat commit. Jangan hapus mekanisme ini.
- `count` adaptif: 9000 desktop, 4000 untuk layar kecil/pointer coarse/`deviceMemory <= 4`. `facingMode: "user"` di `getUserMedia` harus tetap, berpasangan dengan mirror CSS.
- Uji kamera di perangkat fisik butuh HTTPS/tunnel; `http://<ip>:8000` bukan secure context. Device emulation di `localhost` cukup untuk uji layout.
- Video di-mirror via CSS `transform: scaleX(-1)`, dan `handCentroid.x` sengaja dibalik (`1 - lm[9].x`) di `handleLandmarks()`. Mengubah hanya salah satu akan membalik arah kontrol rotasi.
- Mode `text` mengambil piksel dari canvas offscreen `400x200`, sampling tiap 2 px, dan membalik sumbu Y agar tulisan terbaca; jangan hapus saat refactor.
- Gesture → bentuk: fist→`saturn`, peace→`text`, metal→`heart`, open→`chaos`. Daftar di `index.html`, `GESTURE_COPY`, dan `detectGesture()` harus sinkron.
- `toggleFullScreen()` dipanggil dari inline `onclick`, jadi harus tetap diekspos sebagai `window.toggleFullScreen` oleh `src/ui.js`.
- `createHandLandmarker()` mencoba delegate GPU lalu fallback CPU. Tambahkan `?delegate=cpu` ke URL untuk memaksa CPU saat debugging.
