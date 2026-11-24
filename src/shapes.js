import { SHAPE_COLORS } from "./config.js";

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");
textCanvas.width = 400;
textCanvas.height = 200;

export function calculateTarget(shape, count) {
  const positions = [];

  if (shape === "saturn") {
    const sphereCount = Math.floor(count * 0.7);
    const ringCount = count - sphereCount;

    for (let i = 0; i < sphereCount; i++) {
      const r = 8 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push(
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
      positions.push(x, y, z);
    }
  } else if (shape === "chaos") {
    for (let i = 0; i < count; i++) {
      positions.push((Math.random() - 0.5) * 80);
      positions.push((Math.random() - 0.5) * 80);
      positions.push((Math.random() - 0.5) * 80);
    }
  } else if (shape === "heart") {
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(Math.random());

      const xBase = 16 * Math.pow(Math.sin(t), 3);
      const yBase =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);

      const x = xBase * s;
      const y = yBase * s;
      const z = (Math.random() - 0.5) * 10 * s;

      positions.push(x, y, z);
    }
  } else if (shape === "text") {
    textCtx.clearRect(0, 0, 400, 200);
    textCtx.fillStyle = "black";
    textCtx.fillRect(0, 0, 400, 200);
    textCtx.fillStyle = "white";
    textCtx.font = "bold 55px Verdana";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText("I LOVE YOU", 200, 100);

    const data = textCtx.getImageData(0, 0, 400, 200).data;
    const textCoords = [];

    for (let y = 0; y < 200; y += 2) {
      for (let x = 0; x < 400; x += 2) {
        if (data[(y * 400 + x) * 4] > 128) {
          textCoords.push({ x: (x - 200) / 4, y: -(y - 100) / 4 });
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const coord = textCoords[i % textCoords.length];
      positions.push(coord.x, coord.y, (Math.random() - 0.5) * 2);
    }
  }

  return { positions, color: SHAPE_COLORS[shape] ?? SHAPE_COLORS.chaos };
}
