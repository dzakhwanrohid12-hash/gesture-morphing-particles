# AGENTS.md

## Toolchain
- Aplikasi browser statis: hanya `index.html`, `style.css`, `script.js` di root. Tidak ada `package.json`, build, test, lint, atau typecheck; verifikasi manual di browser + console.
- Jalankan lewat localhost, mis. `python3 -m http.server 8000` lalu buka `http://localhost:8000`: kamera (`getUserMedia`) butuh origin aman dan izin browser.
- Dependency adalah `<script>` CDN global di `index.html`: Three.js r128 + MediaPipe `camera_utils`, `control_utils`, `drawing_utils`, `hands`. Font memakai `<link>` Google Fonts. `script.js` memakai global `THREE`, `Hands`, `Camera`; jangan ubah ke impor/module atau tambah bundler tanpa mengubah HTML.

## Wiring yang mudah rusak
- `script.js` dimuat di akhir `<body>` setelah CDN; `initThree()` tetap jalan saat load, tetapi `hands.initialize()` + `cameraUtils.start()` hanya dipanggil dari tombol `Mulai`/`Coba lagi` lewat `startExperience()`. Jangan kembalikan kamera ke level atas.
- `body[data-app-state]` bernilai `intro`, `loading`, `active`, atau `error` dan mengontrol seluruh UI; `onResults()` tidak boleh jalan sebelum state `active`.
- Gestur baru baru di-commit setelah stabil 300 ms (`HOLD_MS`); `calculateTarget()` hanya dipanggil saat commit. Jangan hapus `pendingGesture`/`pendingSince`.
- `count` adaptif: 9000 desktop, 4000 untuk layar kecil/pointer coarse/`deviceMemory <= 4`. `facingMode: "user"` di opsi `Camera` harus tetap, berpasangan dengan mirror CSS.
- Uji kamera di perangkat fisik butuh HTTPS/tunnel; `http://<ip>:8000` bukan secure context. Device emulation di `localhost` cukup untuk uji layout.
- Video di-mirror via CSS `transform: scaleX(-1)`, dan `handCentroid.x` sengaja dibalik (`1 - lm[9].x`) di `onResults()`. Mengubah hanya salah satu akan membalik arah kontrol rotasi.
- Mode `text` mengambil piksel dari canvas offscreen dan membalik sumbu Y agar tulisan terbaca; jangan hapus saat refactor.
- Gesture → bentuk: fist→`saturn`, peace→`text`, metal→`heart`, open→`chaos`. Daftar di `index.html` dan logika di `onResults()` harus sinkron.
- `toggleFullScreen()` dipanggil dari inline `onclick`, jadi harus tetap diekspos sebagai `window.toggleFullScreen`.
