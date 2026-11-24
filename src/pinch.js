import { PINCH, VIDEO_ASPECT } from "./config.js";
import { isFingerExtended } from "./gestures.js";

const IDLE = Object.freeze({ active: false, point: null });

function pinchRatio(landmarks) {
  const dx = landmarks[4].x - landmarks[8].x;
  const dy = (landmarks[4].y - landmarks[8].y) * VIDEO_ASPECT;
  const pinchDistance = Math.hypot(dx, dy);
  const palmDx = landmarks[0].x - landmarks[9].x;
  const palmDy = (landmarks[0].y - landmarks[9].y) * VIDEO_ASPECT;
  const palmLength = Math.hypot(palmDx, palmDy);
  return palmLength > 0 ? pinchDistance / palmLength : Infinity;
}

function pinchPoint(landmarks) {
  return {
    x: 1 - (landmarks[4].x + landmarks[8].x) / 2,
    y: (landmarks[4].y + landmarks[8].y) / 2,
  };
}

function allowsPinch(landmarks) {
  const extended = ["middle", "ring", "pinky"].filter((finger) =>
    isFingerExtended(landmarks, finger)
  ).length;
  return extended >= PINCH.minExtendedFingers;
}

export function createPinchTracker() {
  let active = false;
  let pendingSince = null;
  let point = null;

  function process(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      reset();
      return IDLE;
    }

    const hand = landmarks[0];
    if (!allowsPinch(hand)) {
      reset();
      return IDLE;
    }

    const ratio = pinchRatio(hand);

    if (!active) {
      if (ratio > PINCH.engageRatio) {
        pendingSince = null;
        point = null;
        return IDLE;
      }

      const now = performance.now();
      if (pendingSince === null) pendingSince = now;
      if (now - pendingSince < PINCH.holdMs) {
        point = null;
        return IDLE;
      }

      active = true;
      point = pinchPoint(hand);
      return { active, point };
    }

    if (ratio < PINCH.releaseRatio) {
      point = pinchPoint(hand);
      return { active, point };
    }

    reset();
    return IDLE;
  }

  function reset() {
    active = false;
    pendingSince = null;
    point = null;
  }

  return { process, reset };
}
