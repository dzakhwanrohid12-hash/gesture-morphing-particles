import { GESTURE_COPY } from "./config.js";
import { describeCameraError } from "./camera.js";

export function createUI() {
  const video = document.querySelector(".input_video");
  const gestureStatus = document.getElementById("gestureStatus");
  const gestureLabel = document.getElementById("gestureLabel");
  const gestureHint = document.getElementById("gestureHint");
  const startButton = document.getElementById("startButton");
  const retryButton = document.getElementById("retryButton");
  const errorTitle = document.getElementById("errorTitle");
  const errorMessage = document.getElementById("errorMessage");
  let swapTimer = 0;

  function setState(state) {
    document.body.dataset.appState = state;
  }

  function updateIndicator(gesture, animateSwap = true) {
    if (gestureStatus.dataset.gesture === gesture) return;
    gestureStatus.dataset.gesture = gesture;
    gestureLabel.textContent = GESTURE_COPY[gesture].name;
    gestureHint.textContent = GESTURE_COPY[gesture].hint;

    if (!animateSwap) return;
    gestureStatus.classList.add("is-swapping");
    window.clearTimeout(swapTimer);
    swapTimer = window.setTimeout(() => gestureStatus.classList.remove("is-swapping"), 180);
  }

  function showError(error) {
    const copy = describeCameraError(error);
    errorTitle.textContent = copy.title;
    errorMessage.textContent = copy.message;
    setState("error");
  }

  function onStart(handler) {
    startButton.addEventListener("click", handler);
  }

  function onRetry(handler) {
    retryButton.addEventListener("click", handler);
  }

  function focusRetry() {
    retryButton.focus();
  }

  function exposeFullScreen() {
    window.toggleFullScreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
    };
  }

  return {
    video,
    setState,
    updateIndicator,
    showError,
    onStart,
    onRetry,
    focusRetry,
    exposeFullScreen,
  };
}
