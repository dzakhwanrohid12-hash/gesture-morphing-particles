import * as THREE from "three";
import { CONTROL_SMOOTHING, IS_LOW_POWER, PARTICLE_COUNT, PINCH } from "./config.js";
import { calculateTarget } from "./shapes.js";

export function createScene(container, reduceMotionQuery) {
  THREE.ColorManagement.enabled = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 40;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_LOW_POWER ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  const currentPositions = [];
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 50;
    currentPositions.push(positions[i]);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(currentPositions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.25,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });

  const particlesMesh = new THREE.Points(geometry, material);
  scene.add(particlesMesh);

  let targetPositions = [];
  let handCentroid = { x: 0.5, y: 0.5 };
  let targetScale = 1;
  let targetRotationZ = 0;
  let activeGesture = "chaos";
  let pinchPoint = null;
  let currentPull = 0;
  const pinchWorld = new THREE.Vector3();
  const pinchLocal = new THREE.Vector3();
  const inverseMatrix = new THREE.Matrix4();

  function applyGesture(gesture) {
    activeGesture = gesture;
    const target = calculateTarget(gesture, PARTICLE_COUNT);
    targetPositions = target.positions;
    particlesMesh.material.color.setHex(target.color);
  }

  function setHandControl({ centroid = handCentroid, scale = targetScale, rotationZ = targetRotationZ } = {}) {
    handCentroid = centroid;
    targetScale = scale;
    targetRotationZ = rotationZ;
  }

  function setPinch(point) {
    pinchPoint = point;
  }

  function updatePinchLocal() {
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;
    pinchWorld.set(
      (pinchPoint.x - 0.5) * visibleWidth,
      -(pinchPoint.y - 0.5) * visibleHeight,
      0
    );
    particlesMesh.updateWorldMatrix(true, false);
    inverseMatrix.copy(particlesMesh.matrixWorld).invert();
    pinchLocal.copy(pinchWorld).applyMatrix4(inverseMatrix);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    window.requestAnimationFrame(animate);

    particlesMesh.scale.x += (targetScale - particlesMesh.scale.x) * CONTROL_SMOOTHING;
    particlesMesh.scale.y = particlesMesh.scale.x;
    particlesMesh.scale.z = particlesMesh.scale.x;
    particlesMesh.rotation.z += (targetRotationZ - particlesMesh.rotation.z) * CONTROL_SMOOTHING;

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

    currentPull += ((pinchPoint ? PINCH.pull : 0) - currentPull) * PINCH.smoothing;
    if (pinchPoint) updatePinchLocal();

    const current = particlesMesh.geometry.attributes.position.array;
    const pull = currentPull;
    const px = pinchLocal.x;
    const py = pinchLocal.y;
    const pz = pinchLocal.z;

    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
      const baseX = targetPositions[i];
      const baseY = targetPositions[i + 1];
      const baseZ = targetPositions[i + 2];
      current[i] += (baseX + (px - baseX) * pull - current[i]) * 0.08;
      current[i + 1] += (baseY + (py - baseY) * pull - current[i + 1]) * 0.08;
      current[i + 2] += (baseZ + (pz - baseZ) * pull - current[i + 2]) * 0.08;
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  applyGesture("chaos");
  animate();

  return { applyGesture, setHandControl, setPinch, resize };
}
