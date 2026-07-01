// 駅名標キャンバスの固定サイズを定義します。
const SIGN_WIDTH = 801;
const SIGN_HEIGHT = 258;

// フォームとプレビューで共有する初期表示データです。
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

// state と同じキーを使って、各入力欄のDOMをまとめて取得します。
const fields = Object.fromEntries(
  Object.keys(state).map((key) => [key, document.getElementById(key)]),
);
const colorCodeFields = {
  routeColor: document.getElementById("routeColorCode"),
  numberColor: document.getElementById("numberColorCode"),
};

// プレビュー描画とPNG出力に使う主要なDOMを取得します。
const previewCanvas = document.getElementById("previewCanvas");
const downloadButton = document.getElementById("downloadButton");

function normalizeColorCode(value) {
  // 先頭の # を任意にして、入力された16進カラーだけを取り出します。
  const trimmedValue = value.trim();
  const hexValue = trimmedValue.startsWith("#") ? trimmedValue.slice(1) : trimmedValue;

  // 3桁カラーはCanvasで扱いやすい6桁カラーへ展開します。
  if (/^[0-9a-fA-F]{3}$/.test(hexValue)) {
    return `#${hexValue
      .split("")
      .map((character) => character + character)
      .join("")
      .toLowerCase()}`;
  }

  // 6桁カラーは小文字にそろえて返します。
  if (/^[0-9a-fA-F]{6}$/.test(hexValue)) {
    return `#${hexValue.toLowerCase()}`;
  }

  return null;
}

function syncState() {
  // 通常の入力欄から現在値を読み取り、stateへ反映します。
  for (const [key, input] of Object.entries(fields)) {
    state[key] = input.value;
  }

  // カラーピッカーの値をテキスト入力欄にも同期します。
  for (const [key, input] of Object.entries(colorCodeFields)) {
    input.value = fields[key].value;
  }

  // 入力値の変更後、Canvasプレビューを描き直します。
  drawSign(previewCanvas);
}

function syncColorCode(key) {
  // テキスト欄のカラーコードを検証し、正規化した値を取得します。
  const input = colorCodeFields[key];
  const normalizedColor = normalizeColorCode(input.value);

  // 不正なカラーコードはブラウザ標準の入力エラーとして表示します。
  if (!normalizedColor) {
    input.setCustomValidity("カラーコードは #RGB または #RRGGBB で入力してください");
    return;
  }

  // 正しいカラーコードをカラーピッカーとテキスト欄の両方に反映します。
  input.setCustomValidity("");
  fields[key].value = normalizedColor;
  input.value = normalizedColor;
  syncState();
}

function setCanvasFont(ctx, size, weight = 700) {
  // Canvas上の文字をアプリ全体と同じ日本語フォントにそろえます。
  ctx.font = `${weight} ${size}px "Noto Sans JP", sans-serif`;
}

function fitCanvasText(ctx, text, maxWidth, maxSize, minSize, weight) {
  // 指定幅に収まるまで、最大サイズから1pxずつ小さくします。
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
  // 文字描画の共通オプションを展開し、既定値を補います。
  const {
    size,
    weight = 700,
    align = "left",
    baseline = "alphabetic",
    color = "#000000",
    maxWidth = null,
  } = options;

  // Canvasの文字配置と色を設定してから描画します。
  setCanvasFont(ctx, size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  // 最大幅が指定されている場合はCanvas側の幅制限も使います。
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
    return;
  }

  ctx.fillText(text, x, y);
}

function roundedRect(ctx, x, y, width, height, radius) {
  // 角丸四角のパスを作成し、塗りや線は呼び出し側で指定します。
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function numberMarkPath(ctx) {
  // 選択された形状に応じて、駅ナンバリング枠のパスを作ります。
  if (state.numberShape === "circle") {
    ctx.beginPath();
    ctx.arc(147.5, 87.5, 47.5, 0, Math.PI * 2);
    ctx.closePath();
    return;
  }

  roundedRect(ctx, 100, 40, 95, 95, 8);
}

function drawNumberMark(ctx) {
  // ナンバリング枠の白背景と色付きの外枠を描画します。
  numberMarkPath(ctx);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = state.numberColor;
  ctx.stroke();

  // 枠内だけに路線記号の帯を塗れるよう、パスでクリップします。
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
  const sidePadding = 16;
  const leftMaxWidth = (leftCenterX - sidePadding) * 2;
  const rightMaxWidth = (SIGN_WIDTH - rightCenterX - sidePadding) * 2;
  const nextJaBottomY = 237;
  const nextEnTopY = 235;

  drawText(ctx, state.leftJa, leftCenterX, nextJaBottomY, {
    size: fitCanvasText(ctx, state.leftJa, leftMaxWidth, 37, 18, 900),
    weight: 900,
    align: "center",
    baseline: "bottom",
    color: "#ffffff",
    maxWidth: leftMaxWidth,
  });
  drawText(ctx, state.leftEn, leftCenterX, nextEnTopY, {
    size: fitCanvasText(ctx, state.leftEn, leftMaxWidth, 20, 12, 700),
    weight: 700,
    align: "center",
    baseline: "top",
    color: "#ffffff",
    maxWidth: leftMaxWidth,
  });

  drawText(ctx, state.rightJa, rightCenterX, nextJaBottomY, {
    size: fitCanvasText(ctx, state.rightJa, rightMaxWidth, 37, 18, 900),
    weight: 900,
    align: "center",
    baseline: "bottom",
    color: "#ffffff",
    maxWidth: rightMaxWidth,
  });
  drawText(ctx, state.rightEn, rightCenterX, nextEnTopY, {
    size: fitCanvasText(ctx, state.rightEn, rightMaxWidth, 20, 12, 700),
    weight: 700,
    align: "center",
    baseline: "top",
    color: "#ffffff",
    maxWidth: rightMaxWidth,
  });
}

function drawSign(canvas) {
  // 対象Canvasの描画コンテキストを取得します。
  const ctx = canvas.getContext("2d");

  // 前回の描画を消し、駅名標全体の白い下地を塗ります。
  ctx.clearRect(0, 0, SIGN_WIDTH, SIGN_HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIGN_WIDTH, SIGN_HEIGHT);

  // ナンバリング、駅名、隣駅表示を順番に重ねます。
  drawNumberMark(ctx);
  drawUpperStationName(ctx);
  drawNextStations(ctx);
}

function downloadPng() {
  // 出力直前にフォーム値を反映し、最新状態のプレビューにします。
  syncState();

  // 一時的なリンクを作り、CanvasのPNGデータをダウンロードします。
  const link = document.createElement("a");
  link.download = `${state.stationEn || state.stationJa || "station-sign"}.png`;
  link.href = previewCanvas.toDataURL("image/png");
  link.click();
}

// 通常入力は変更のたびにstateとCanvasへ反映します。
for (const input of Object.values(fields)) {
  input.addEventListener("input", syncState);
}

// カラーコード入力は検証しながら、対応するカラーピッカーへ同期します。
for (const [key, input] of Object.entries(colorCodeFields)) {
  input.addEventListener("input", () => syncColorCode(key));
  input.addEventListener("blur", () => {
    // フォーカスが外れたら有効なカラー値へ戻し、エラー表示を解除します。
    input.value = fields[key].value;
    input.setCustomValidity("");
  });
}

// ボタン操作とフォント読み込み完了時の初期描画を設定します。
downloadButton.addEventListener("click", downloadPng);

document.fonts?.ready.then(syncState);
syncState();
