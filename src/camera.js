import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { MODEL_URL, WASM_URL } from "./config.js";

async function createLandmarker(delegate) {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });
}

export async function createHandLandmarker() {
  const forceCpu = new URLSearchParams(window.location.search).get("delegate") === "cpu";
  if (forceCpu) return createLandmarker("CPU");

  try {
    return await createLandmarker("GPU");
  } catch {
    return createLandmarker("CPU");
  }
}

export async function startHandTracking(video, onResults, onError) {
  const landmarker = await createHandLandmarker();
  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    landmarker.close?.();
    throw error;
  }

  let rafId = 0;
  let stopped = false;

  const controller = {
    start() {
      if (stopped || rafId) return;
      rafId = window.requestAnimationFrame(detect);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      landmarker.close?.();
    },
  };

  function detect() {
    if (stopped) return;

    try {
      const result = landmarker.detectForVideo(video, performance.now());
      onResults(result.landmarks ?? []);
    } catch (error) {
      controller.stop();
      onError?.(error);
      return;
    }

    rafId = window.requestAnimationFrame(detect);
  }

  return controller;
}

export function describeCameraError(error) {
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
