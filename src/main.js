import "../style.css";
import { createUI } from "./ui.js";
import { createScene } from "./scene.js";
import { createGestureTracker } from "./gestures.js";
import { startHandTracking } from "./camera.js";
import { NEUTRAL_HAND_CONTROL, readHandInteraction } from "./interaction.js";

const ui = createUI();
const scene = createScene(
  document.getElementById("canvas-container"),
  window.matchMedia("(prefers-reduced-motion: reduce)")
);
const tracker = createGestureTracker({
  onIndicator: (gesture) => ui.updateIndicator(gesture),
  onCommit: (gesture) => scene.applyGesture(gesture),
});

let tracking = null;
let starting = false;

function handleLandmarks(landmarks) {
  if (document.body.dataset.appState !== "active") return;

  if (landmarks.length === 0) {
    tracker.process(null);
    scene.setHandControl(NEUTRAL_HAND_CONTROL);
    return;
  }

  const lm = landmarks[0];
  const { scale, rotationZ } = readHandInteraction(landmarks);
  scene.setHandControl({
    centroid: { x: 1 - lm[9].x, y: lm[9].y },
    scale,
    rotationZ,
  });
  tracker.process(lm);
}

function handleTrackingError(error) {
  tracking?.stop();
  tracking = null;
  ui.showError(error);
  ui.focusRetry();
}

async function startExperience() {
  if (starting) return;
  starting = true;
  ui.setState("loading");
  tracking?.stop();
  tracking = null;
  tracker.reset();

  try {
    const nextTracking = await startHandTracking(ui.video, handleLandmarks, handleTrackingError);
    ui.setState("active");
    tracking = nextTracking;
    nextTracking.start();
  } catch (error) {
    ui.showError(error);
    ui.focusRetry();
  } finally {
    starting = false;
  }
}

ui.onStart(startExperience);
ui.onRetry(startExperience);
ui.exposeFullScreen();
window.addEventListener("resize", scene.resize);
