import { MAX_PALM_TILT, TWO_HAND_SCALE, VIDEO_ASPECT } from "./config.js";

export const NEUTRAL_HAND_CONTROL = Object.freeze({ scale: 1, rotationZ: 0 });

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function palmDistance(first, second) {
  const dx = first[9].x - second[9].x;
  const dy = (first[9].y - second[9].y) * VIDEO_ASPECT;
  return Math.hypot(dx, dy);
}

function palmTilt(landmarks) {
  const wristX = 1 - landmarks[0].x;
  const knuckleX = 1 - landmarks[9].x;
  const dx = knuckleX - wristX;
  const dy = landmarks[9].y - landmarks[0].y;
  return clamp(Math.atan2(-dx, -dy), -MAX_PALM_TILT, MAX_PALM_TILT);
}

export function readHandInteraction(landmarks) {
  if (landmarks.length === 0) return NEUTRAL_HAND_CONTROL;

  if (landmarks.length < 2) {
    return { scale: 1, rotationZ: palmTilt(landmarks[0]) };
  }

  const { min, max, nearDistance, farDistance } = TWO_HAND_SCALE;
  const t = clamp(
    (palmDistance(landmarks[0], landmarks[1]) - nearDistance) / (farDistance - nearDistance),
    0,
    1
  );

  return {
    scale: min + (max - min) * t,
    rotationZ: palmTilt(landmarks[0]),
  };
}
