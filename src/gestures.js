import { HOLD_MS } from "./config.js";

const TIP_IDS = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP_IDS = { thumb: 2, index: 6, middle: 10, ring: 14, pinky: 18 };

export function isFingerExtended(landmarks, fingerName) {
  if (fingerName === "thumb") {
    return Math.abs(landmarks[4].x - landmarks[2].x) > 0.05;
  }
  return landmarks[TIP_IDS[fingerName]].y < landmarks[PIP_IDS[fingerName]].y;
}

export function detectGesture(landmarks) {
  const index = isFingerExtended(landmarks, "index");
  const middle = isFingerExtended(landmarks, "middle");
  const ring = isFingerExtended(landmarks, "ring");
  const pinky = isFingerExtended(landmarks, "pinky");

  if (!index && !middle && !ring && !pinky) return "saturn";
  if (index && middle && !ring && !pinky) return "text";
  if (index && !middle && !ring && pinky) return "heart";
  if (index && middle && ring && pinky) return "chaos";
  return "unknown";
}

export function createGestureTracker({ onCommit, onIndicator }) {
  let activeGesture = "chaos";
  let pendingGesture = null;
  let pendingSince = 0;

  function process(landmarks) {
    if (!landmarks) {
      pendingGesture = null;
      onIndicator("none");
      return;
    }

    const detectedGesture = detectGesture(landmarks);

    if (detectedGesture === "unknown") {
      pendingGesture = null;
      return;
    }

    if (detectedGesture === activeGesture) {
      pendingGesture = null;
      onIndicator(activeGesture);
      return;
    }

    if (detectedGesture !== pendingGesture) {
      pendingGesture = detectedGesture;
      pendingSince = performance.now();
      return;
    }

    if (performance.now() - pendingSince >= HOLD_MS) {
      pendingGesture = null;
      activeGesture = detectedGesture;
      onIndicator(detectedGesture);
      onCommit(detectedGesture);
    }
  }

  function reset() {
    pendingGesture = null;
    pendingSince = 0;
  }

  return { process, reset };
}
