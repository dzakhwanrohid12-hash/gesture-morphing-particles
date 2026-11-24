// --- VARIABEL GLOBAL ---
let scene, camera, renderer, particlesMesh;
let currentPositions = [];
let targetPositions = [];
const count = 9000;
const container = document.getElementById("canvas-container");
const gestureStatus = document.getElementById("gestureStatus");

// Variabel kontrol interaktif (Posisi Tangan)
let handCentroid = { x: 0.5, y: 0.5 };
let activeGesture = "chaos";

// Canvas untuk scan teks
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");
textCanvas.width = 400;
textCanvas.height = 200;

// --- 1. SETUP THREE.JS ---
function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 40;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  // Posisi awal random
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 50;
    currentPositions.push(positions[i]);
    targetPositions.push(positions[i]);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(currentPositions, 3)
  );

  const material = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.25,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });

  particlesMesh = new THREE.Points(geometry, material);
  scene.add(particlesMesh);

  calculateTarget("chaos");
  animate();
}

// --- 2. LOGIKA MATEMATIKA BENTUK ---
function calculateTarget(shape) {
  targetPositions = [];

  if (shape === "saturn") {
    // --- SATURNUS ---
    const sphereCount = Math.floor(count * 0.7);
    const ringCount = count - sphereCount;

    // Bola
    for (let i = 0; i < sphereCount; i++) {
      const r = 8 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      targetPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    // Cincin
    for (let i = 0; i < ringCount; i++) {
      const r = 12 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = (Math.random() - 0.5) * 0.5;
      targetPositions.push(x, y, z);
    }
    particlesMesh.material.color.setHex(0xffaa00); // Emas
  } else if (shape === "chaos") {
    // --- GALAXY ---
    for (let i = 0; i < count; i++) {
      targetPositions.push((Math.random() - 0.5) * 80);
      targetPositions.push((Math.random() - 0.5) * 80);
      targetPositions.push((Math.random() - 0.5) * 80);
    }
    particlesMesh.material.color.setHex(0xffffff); // Putih
  } else if (shape === "heart") {
    // --- HATI PADAT (SOLID HEART) ---
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      // Scale random (akar kuadrat) agar isi padat merata
      const s = Math.sqrt(Math.random());

      let x_base = 16 * Math.pow(Math.sin(t), 3);
      let y_base =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);

      let x = x_base * s;
      let y = y_base * s;
      let z = (Math.random() - 0.5) * 10 * s; // Ketebalan Z juga mengikuti scale

      targetPositions.push(x, y, z);
    }
    particlesMesh.material.color.setHex(0xff00ff); // Pink
  } else if (shape === "text") {
    // --- I LOVE YOU ---
    textCtx.clearRect(0, 0, 400, 200);
    textCtx.fillStyle = "black";
    textCtx.fillRect(0, 0, 400, 200);
    textCtx.fillStyle = "white";
    textCtx.font = "bold 55px Verdana";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText("I LOVE YOU", 200, 100);

    const imageData = textCtx.getImageData(0, 0, 400, 200);
    const data = imageData.data;
    let textCoords = [];

    for (let y = 0; y < 200; y += 2) {
      for (let x = 0; x < 400; x += 2) {
        if (data[(y * 400 + x) * 4] > 128) {
          // Koordinat dibalik (-) agar terbaca jelas
          textCoords.push({ x: (x - 200) / 4, y: -(y - 100) / 4 });
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const coord = textCoords[i % textCoords.length];
      targetPositions.push(coord.x, coord.y, (Math.random() - 0.5) * 2);
    }
    particlesMesh.material.color.setHex(0x00ffff); // Cyan
  }
}

// --- 3. ANIMASI LOOP (LOGIKA ROTASI DIPERBARUI) ---
function animate() {
  requestAnimationFrame(animate);
  const positions = particlesMesh.geometry.attributes.position.array;

  // Morphing
  for (let i = 0; i < count * 3; i++) {
    positions[i] += (targetPositions[i] - positions[i]) * 0.08;
  }
  particlesMesh.geometry.attributes.position.needsUpdate = true;

  // --- LOGIKA KONTROL ---
  // Sekarang SATURNUS dan HEART bisa digerakkan manual
  if (activeGesture === "saturn" || activeGesture === "heart") {
    // INTERAKTIF: Mengikuti Posisi Tangan
    // Range gerak diperluas sedikit (* 5) agar lebih responsif
    const targetRotY = (handCentroid.x - 0.5) * 5;
    const targetRotX = (handCentroid.y - 0.5) * 5;

    // Smooth movement (Lerp)
    particlesMesh.rotation.y += (targetRotY - particlesMesh.rotation.y) * 0.1;
    particlesMesh.rotation.x += (targetRotX - particlesMesh.rotation.x) * 0.1;
  } else {
    // --- MODE AUTO (TEXT & CHAOS) ---
    // Tulisan I LOVE YOU harus tegak, jadi reset X rotation ke 0
    particlesMesh.rotation.x += (0 - particlesMesh.rotation.x) * 0.05;

    // Putar Y sangat pelan agar terbaca
    particlesMesh.rotation.y += 0.001;
  }

  renderer.render(scene, camera);
}

// --- 4. DETEKSI GESTURE ---
function isFingerExtended(landmarks, fingerName) {
  const tipIds = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
  const pipIds = { thumb: 2, index: 6, middle: 10, ring: 14, pinky: 18 };
  if (fingerName === "thumb")
    return Math.abs(landmarks[4].x - landmarks[2].x) > 0.05;
  return landmarks[tipIds[fingerName]].y < landmarks[pipIds[fingerName]].y;
}

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const lm = results.multiHandLandmarks[0];

    // Ambil titik tengah tangan untuk kontrol rotasi
    handCentroid = { x: 1 - lm[9].x, y: lm[9].y };

    const index = isFingerExtended(lm, "index");
    const middle = isFingerExtended(lm, "middle");
    const ring = isFingerExtended(lm, "ring");
    const pinky = isFingerExtended(lm, "pinky");

    let detectedGesture = "unknown";

    // 1. Saturnus (Fist)
    if (!index && !middle && !ring && !pinky) {
      detectedGesture = "saturn";
    }
    // 2. I Love You (2 Jari)
    else if (index && middle && !ring && !pinky) {
      detectedGesture = "text";
    }
    // 3. Heart (Metal)
    else if (index && !middle && !ring && pinky) {
      detectedGesture = "heart";
    }
    // 4. Galaxy (Open)
    else if (index && middle && ring && pinky) {
      detectedGesture = "chaos";
    }

    if (detectedGesture !== "unknown" && detectedGesture !== activeGesture) {
      activeGesture = detectedGesture;

      // Update Teks Status UI
      if (activeGesture === "saturn") {
        gestureStatus.innerText = "FIST (Saturn Control)";
        calculateTarget("saturn");
      } else if (activeGesture === "text") {
        gestureStatus.innerText = "PEACE (Reading Mode)";
        calculateTarget("text");
      } else if (activeGesture === "heart") {
        gestureStatus.innerText = "METAL (Heart Control)"; // Status berubah jadi Control
        calculateTarget("heart");
      } else if (activeGesture === "chaos") {
        gestureStatus.innerText = "OPEN (Galaxy)";
        calculateTarget("chaos");
      }
    }
  } else {
    gestureStatus.innerText = "Show Hand";
  }
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});
hands.onResults(onResults);

const videoElement = document.getElementsByClassName("input_video")[0];
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
cameraUtils.start();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.toggleFullScreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else if (document.exitFullscreen) document.exitFullscreen();
};

initThree();
