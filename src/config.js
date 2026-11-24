const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;
const lowMemory = navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4;
const lowPowerScreen = smallScreen || lowMemory || window.matchMedia("(pointer: coarse)").matches;

export const IS_LOW_POWER = lowPowerScreen;
export const PARTICLE_COUNT = lowPowerScreen ? 4000 : 9000;
export const HOLD_MS = 300;
export const TWO_HAND_SCALE = {
  min: 0.6,
  max: 1.8,
  nearDistance: 0.2,
  farDistance: 0.7,
};
export const MAX_PALM_TILT = Math.PI / 3;
export const CONTROL_SMOOTHING = 0.12;
export const VIDEO_ASPECT = 480 / 640;
export const MODEL_URL = withBase("models/hand_landmarker.task");
export const WASM_URL = withBase("wasm");

export const GESTURE_COPY = {
  chaos: { name: "Open", hint: "Galaxy" },
  saturn: { name: "Fist", hint: "Saturnus, ikuti tangan" },
  text: { name: "Peace", hint: "I LOVE YOU" },
  heart: { name: "Metal", hint: "Hati, ikuti tangan" },
  none: { name: "Menunggu", hint: "Tunjukkan tangan" },
};

export const SHAPE_COLORS = {
  chaos: 0xffffff,
  saturn: 0xffaa00,
  text: 0x00ffff,
  heart: 0xff00ff,
};

export function withBase(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}
