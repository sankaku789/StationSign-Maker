const SIGN_WIDTH = 801;
const SIGN_HEIGHT = 258;

const state = {
  routeColor: "#f86b00",
  numberColor: "#f00046",
  numberShape: "square",
  lineCode: "B",
  stationNumber: "01",
  stationJa: "さつたば",
  stationKana: "さつたば",
  stationEn: "Satutaba",
  leftJa: "進急入野",
  leftEn: "Shinkyu-Hairino",
  rightJa: "5荾角",
  rightEn: "Goryokaku",
};

const fields = Object.fromEntries(
  Object.keys(state).map((key) => [key, document.getElementById(key)]),
);

const previewCanvas = document.getElementById("previewCanvas");
const downloadButton = document.getElementById("downloadButton");

function syncState() {
  for (const [key, input] of Object.entries(fields)) {
    state[key] = input.value;
  }

  drawSign(previewCanvas);
}

function setCanvasFont(ctx, size, weight = 700) {
  ctx.font = `${weight} ${size}px "Noto Sans JP", sans-serif`;
}

function fitCanvasText(ctx, text, maxWidth, maxSize, minSize, weight) {
  let size = maxSize;
  do {
    setCanvasFont(ctx, size, weight);
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) {
      return size;
    }
    size -= 1;
  } while (size >= minSize);
  return minSize;
}

function drawText(ctx, text, x, y, options) {
  const {
    size,
    weight = 700,
    align = "left",
    baseline = "alphabetic",
    color = "#000000",
  } = options;

  setCanvasFont(ctx, size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function numberMarkPath(ctx) {
  if (state.numberShape === "circle") {
    ctx.beginPath();
    ctx.arc(147.5, 87.5, 47.5, 0, Math.PI * 2);
    ctx.closePath();
    return;
  }

  roundedRect(ctx, 100, 40, 95, 95, 8);
}

function drawNumberMark(ctx) {
  numberMarkPath(ctx);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = state.numberColor;
  ctx.stroke();

  ctx.save();
  numberMarkPath(ctx);
  ctx.clip();
  ctx.fillStyle = state.numberColor;
  ctx.fillRect(100, 40, 95, 43);
  drawText(ctx, state.lineCode, 147.5, 61, {
    size: fitCanvasText(ctx, state.lineCode, 80, 43, 22, 800),
    weight: 800,
    align: "center",
    baseline: "middle",
    color: "#ffffff",
  });
  drawText(ctx, state.stationNumber, 147.5, 110, {
    size: fitCanvasText(ctx, state.stationNumber, 82, 47, 24, 800),
    weight: 800,
    align: "center",
    baseline: "middle",
  });
  ctx.restore();
}

function drawUpperStationName(ctx) {
  const centerX = 400.5;
  const maxWidth = 372;

  drawText(ctx, state.stationJa, centerX, 126, {
    size: fitCanvasText(ctx, state.stationJa, maxWidth, 92, 22, 900),
    weight: 900,
    align: "center",
    baseline: "bottom",
  });

  drawText(ctx, state.stationKana, centerX, 134, {
    size: fitCanvasText(ctx, state.stationKana, maxWidth, 24, 12, 700),
    weight: 700,
    align: "center",
    baseline: "top",
  });

  drawText(ctx, state.stationEn, centerX, 164, {
    size: fitCanvasText(ctx, state.stationEn, maxWidth, 28, 12, 500),
    weight: 500,
    align: "center",
    baseline: "top",
  });
}

function drawNextStations(ctx) {
  ctx.fillStyle = state.routeColor;
  ctx.fillRect(0, 196, SIGN_WIDTH, 62);

  const leftCenterX = 123;
  const rightCenterX = 689;
  const nextMaxWidth = 300;
  const nextJaBottomY = 237;
  const nextEnTopY = 235;

  drawText(ctx, state.leftJa, leftCenterX, nextJaBottomY, {
    size: fitCanvasText(ctx, state.leftJa, nextMaxWidth, 37, 18, 900),
    weight: 900,
    align: "center",
    baseline: "bottom",
    color: "#ffffff",
  });
  drawText(ctx, state.leftEn, leftCenterX, nextEnTopY, {
    size: fitCanvasText(ctx, state.leftEn, nextMaxWidth, 20, 12, 700),
    weight: 700,
    align: "center",
    baseline: "top",
    color: "#ffffff",
  });

  drawText(ctx, state.rightJa, rightCenterX, nextJaBottomY, {
    size: fitCanvasText(ctx, state.rightJa, nextMaxWidth, 37, 18, 900),
    weight: 900,
    align: "center",
    baseline: "bottom",
    color: "#ffffff",
  });
  drawText(ctx, state.rightEn, rightCenterX, nextEnTopY, {
    size: fitCanvasText(ctx, state.rightEn, nextMaxWidth, 20, 12, 700),
    weight: 700,
    align: "center",
    baseline: "top",
    color: "#ffffff",
  });
}

function drawSign(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIGN_WIDTH, SIGN_HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIGN_WIDTH, SIGN_HEIGHT);

  drawNumberMark(ctx);
  drawUpperStationName(ctx);
  drawNextStations(ctx);
}

function downloadPng() {
  syncState();

  const link = document.createElement("a");
  link.download = `${state.stationEn || state.stationJa || "station-sign"}.png`;
  link.href = previewCanvas.toDataURL("image/png");
  link.click();
}

for (const input of Object.values(fields)) {
  input.addEventListener("input", syncState);
}

downloadButton.addEventListener("click", downloadPng);

document.fonts?.ready.then(syncState);
syncState();
