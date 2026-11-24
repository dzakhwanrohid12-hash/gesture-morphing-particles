// --- VARIABEL GLOBAL ---
let scene, camera, renderer, particlesMesh;
let currentPositions = [];
let targetPositions = [];
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;
const lowMemory = navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4;
const lowPowerScreen = smallScreen || lowMemory || window.matchMedia("(pointer: coarse)").matches;
const count = lowPowerScreen ? 4000 : 9000;
const container = document.getElementById("canvas-container");
const gestureStatus = document.getElementById("gestureStatus");
const gestureLabel = document.getElementById("gestureLabel");
const gestureHint = document.getElementById("gestureHint");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const errorTitle = document.getElementById("errorTitle");
const errorMessage = document.getElementById("errorMessage");

const gestureCopy = {
  chaos: { name: "Open", hint: "Galaxy" },
  saturn: { name: "Fist", hint: "Saturnus, ikuti tangan" },
  text: { name: "Peace", hint: "I LOVE YOU" },
  heart: { name: "Metal", hint: "Hati, ikuti tangan" },
  none: { name: "Menunggu", hint: "Tunjukkan tangan" },
};

let handCentroid = { x: 0.5, y: 0.5 };
let activeGesture = "chaos";
let pendingGesture = null;
let pendingSince = 0;
let swapTimer = 0;
let starting = false;
const HOLD_MS = 300;

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPowerScreen ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

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
    const sphereCount = Math.floor(count * 0.7);
    const ringCount = count - sphereCount;

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
    for (let i = 0; i < ringCount; i++) {
      const r = 12 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = (Math.random() - 0.5) * 0.5;
      targetPositions.push(x, y, z);
    }
    particlesMesh.material.color.setHex(0xffaa00);
  } else if (shape === "chaos") {
    for (let i = 0; i < count; i++) {
      targetPositions.push((Math.random() - 0.5) * 80);
      targetPositions.push((Math.random() - 0.5) * 80);
      targetPositions.push((Math.random() - 0.5) * 80);
    }
    particlesMesh.material.color.setHex(0xffffff);
  } else if (shape === "heart") {
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(Math.random());

      let x_base = 16 * Math.pow(Math.sin(t), 3);
      let y_base =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);

      let x = x_base * s;
      let y = y_base * s;
      let z = (Math.random() - 0.5) * 10 * s;

      targetPositions.push(x, y, z);
    }
    particlesMesh.material.color.setHex(0xff00ff);
  } else if (shape === "text") {
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
          textCoords.push({ x: (x - 200) / 4, y: -(y - 100) / 4 });
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const coord = textCoords[i % textCoords.length];
      targetPositions.push(coord.x, coord.y, (Math.random() - 0.5) * 2);
    }
    particlesMesh.material.color.setHex(0x00ffff);
  }
}

// --- 3. ANIMASI LOOP (LOGIKA ROTASI DIPERBARUI) ---
function animate() {
  requestAnimationFrame(animate);
  const positions = particlesMesh.geometry.attributes.position.array;

  for (let i = 0; i < count * 3; i++) {
    positions[i] += (targetPositions[i] - positions[i]) * 0.08;
  }
  particlesMesh.geometry.attributes.position.needsUpdate = true;

  if (activeGesture === "saturn" || activeGesture === "heart") {
    const targetRotY = (handCentroid.x - 0.5) * 5;
    const targetRotX = (handCentroid.y - 0.5) * 5;

    particlesMesh.rotation.y += (targetRotY - particlesMesh.rotation.y) * 0.1;
    particlesMesh.rotation.x += (targetRotX - particlesMesh.rotation.x) * 0.1;
  } else {
    particlesMesh.rotation.x += (0 - particlesMesh.rotation.x) * 0.05;
    if (!reduceMotionQuery.matches) {
      particlesMesh.rotation.y += 0.001;
    }
  }

  renderer.render(scene, camera);
}

function updateIndicator(gesture, animateSwap = true) {
  if (gestureStatus.dataset.gesture === gesture) return;
  gestureStatus.dataset.gesture = gesture;
  gestureLabel.textContent = gestureCopy[gesture].name;
  gestureHint.textContent = gestureCopy[gesture].hint;

  if (!animateSwap) return;
  gestureStatus.classList.add("is-swapping");
  window.clearTimeout(swapTimer);
  swapTimer = window.setTimeout(() => gestureStatus.classList.remove("is-swapping"), 180);
}

function commitGesture(gesture) {
  activeGesture = gesture;
  updateIndicator(gesture);
  calculateTarget(gesture);
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

    handCentroid = { x: 1 - lm[9].x, y: lm[9].y };

    const index = isFingerExtended(lm, "index");
    const middle = isFingerExtended(lm, "middle");
    const ring = isFingerExtended(lm, "ring");
    const pinky = isFingerExtended(lm, "pinky");

    let detectedGesture = "unknown";

    if (!index && !middle && !ring && !pinky) {
      detectedGesture = "saturn";
    } else if (index && middle && !ring && !pinky) {
      detectedGesture = "text";
    } else if (index && !middle && !ring && pinky) {
      detectedGesture = "heart";
    } else if (index && middle && ring && pinky) {
      detectedGesture = "chaos";
    }

    if (detectedGesture === "unknown") {
      pendingGesture = null;
      return;
    }

    if (detectedGesture === activeGesture) {
      pendingGesture = null;
      updateIndicator(activeGesture);
      return;
    }

    if (detectedGesture !== pendingGesture) {
      pendingGesture = detectedGesture;
      pendingSince = performance.now();
      return;
    }

    if (performance.now() - pendingSince >= HOLD_MS) {
      pendingGesture = null;
      commitGesture(detectedGesture);
    }
  } else {
    pendingGesture = null;
    updateIndicator("none");
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
  facingMode: "user",
});

function describeCameraError(error) {
  const name = error && error.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      title: "Izin kamera ditolak",
      message: "Izinkan akses kamera di browser, lalu coba lagi.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      title: "Kamera tidak ditemukan",
      message: "Hubungkan kamera lalu coba lagi.",
    };
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return {
      title: "Kamera sedang dipakai",
      message: "Tutup aplikasi lain yang memakai kamera, lalu coba lagi.",
    };
  }
  if (name === "OverconstrainedError") {
    return {
      title: "Kamera tidak mendukung pengaturan ini",
      message: "Coba lagi dengan kamera depan yang tersedia.",
    };
  }
  return {
    title: "Belum bisa dimulai",
    message: "Model tangan atau kamera gagal dimuat. Periksa koneksi lalu coba lagi.",
  };
}

async function startExperience() {
  if (starting) return;
  starting = true;
  document.body.dataset.appState = "loading";

  try {
    await hands.initialize();
    await cameraUtils.start();
    document.body.dataset.appState = "active";
  } catch (error) {
    const copy = describeCameraError(error);
    errorTitle.textContent = copy.title;
    errorMessage.textContent = copy.message;
    document.body.dataset.appState = "error";
    retryButton.focus();
  } finally {
    starting = false;
  }
}

startButton.addEventListener("click", startExperience);
retryButton.addEventListener("click", startExperience);

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
