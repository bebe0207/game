/**
 * tetris-core.js
 * 俄羅斯方塊共用核心邏輯
 * 由 tetris.html 與 tetris-battle.html 共同引用
 *
 * 注意：本檔案依賴使用端提供以下全域變數：
 *   board, current, COLS, ROWS, CELL
 * 以及使用端各自實作的 lock()（因對戰版有額外的攻擊邏輯）
 */

// ── 盤面尺寸 ──────────────────────────────────────────
const COLS = 10, ROWS = 20, CELL = 30;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

// ── 七種 Tetromino（SRS 旋轉系統） ────────────────────
const SHAPES = {
  I: { color: '#00cfcf', rotations: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]]
  ]},
  O: { color: '#f5c518', rotations: [
    [[1,0],[2,0],[1,1],[2,1]]
  ]},
  T: { color: '#a855f7', rotations: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]]
  ]},
  S: { color: '#22c55e', rotations: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]]
  ]},
  Z: { color: '#ef4444', rotations: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]]
  ]},
  J: { color: '#3b82f6', rotations: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]]
  ]},
  L: { color: '#f97316', rotations: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]]
  ]}
};
const SHAPE_KEYS  = Object.keys(SHAPES);
const SCORE_TABLE = [0, 100, 300, 500, 800];

// ── DAS / ARR 常數 ────────────────────────────────────
const DAS = 170; // ms，按住多久後開始連續移動
const ARR = 50;  // ms，連續移動間隔

// ── 方塊工廠 ──────────────────────────────────────────
function makePiece(key) {
  const def = SHAPES[key];
  return {
    key,
    color: def.color,
    rotations: def.rotations,
    rot: 0,
    x: Math.floor((COLS - 4) / 2),
    y: 0,
    get cells() { return this.rotations[this.rot]; }
  };
}

function spawnPiece() {
  return makePiece(SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)]);
}

function levelInterval(lvl) {
  return Math.max(50, 800 - (lvl - 1) * 70);
}

// ── 座標計算 ──────────────────────────────────────────
function pieceBlocks(piece, dx = 0, dy = 0, rot = piece.rot) {
  return piece.rotations[rot].map(([c, r]) => [piece.x + c + dx, piece.y + r + dy]);
}

function isValid(piece, dx = 0, dy = 0, rot = piece.rot) {
  for (const [c, r] of pieceBlocks(piece, dx, dy, rot)) {
    if (c < 0 || c >= COLS || r >= ROWS) return false;
    if (r >= 0 && board[r][c]) return false;
  }
  return true;
}

// ── 移動 / 旋轉 ───────────────────────────────────────
function moveLeft()  { if (isValid(current, -1, 0)) current.x--; }
function moveRight() { if (isValid(current,  1, 0)) current.x++; }
function moveDown()  {
  if (isValid(current, 0, 1)) { current.y++; return true; }
  lock(); return false;
}

function rotate() {
  const newRot = (current.rot + 1) % current.rotations.length;
  for (const kick of [0, -1, 1, -2, 2]) {
    if (isValid(current, kick, 0, newRot)) {
      current.x += kick;
      current.rot = newRot;
      return;
    }
  }
}

function hardDrop() {
  while (isValid(current, 0, 1)) current.y++;
  lock();
}

// ── 保留方塊 ──────────────────────────────────────────
function holdPiece() {
  if (!canHold) return;
  canHold = false;
  if (hold === null) {
    hold    = current.key;
    current = next;
    next    = spawnPiece();
  } else {
    const tmp = hold;
    hold    = current.key;
    current = makePiece(tmp);
  }
  updateHUD();
}

// ── 消行（回傳消除行數） ──────────────────────────────
function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(c => c !== null)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++;
    }
  }
  if (cleared > 0) {
    lines += cleared;
    score += SCORE_TABLE[Math.min(cleared, 4)] * level;
    level  = Math.floor(lines / 10) + 1;
    dropInterval = levelInterval(level);
  }
  return cleared;
}

// ── Ghost piece ───────────────────────────────────────
function ghostY() {
  let dy = 0;
  while (isValid(current, 0, dy + 1)) dy++;
  return dy;
}

// ── 繪製單格（支援縮放 cell size） ───────────────────
// cs：cell 大小，預設使用全域 CELL
function drawCell(context, col, row, color, alpha = 1, ox = 0, oy = 0, cs = CELL) {
  const x = ox + col * cs;
  const y = oy + row * cs;
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, cs - 2, cs - 2);
  // 高光
  context.fillStyle = 'rgba(255,255,255,0.18)';
  context.fillRect(x + 1, y + 1, cs - 2, Math.max(1, Math.floor(cs * 0.18)));
  context.globalAlpha = 1;
}

// ── 繪製棋盤（使用全域 ctx, board, current） ─────────
function drawBoard() {
  ctx.clearRect(0, 0, BOARD_W, BOARD_H);

  // 格線
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke();
  }

  // 已落下的方塊
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) drawCell(ctx, c, r, board[r][c]);

  if (gameOver || paused) return;

  // Ghost
  const gy = ghostY();
  if (gy > 0)
    for (const [c, r] of pieceBlocks(current, 0, gy))
      if (r >= 0) drawCell(ctx, c, r, current.color, 0.2);

  // 當前方塊
  for (const [c, r] of pieceBlocks(current))
    if (r >= 0) drawCell(ctx, c, r, current.color);
}

// ── 繪製方塊預覽（next / hold） ───────────────────────
function drawPiecePreview(context, key, size = 100) {
  context.clearRect(0, 0, size, size);
  if (!key) return;
  const def  = SHAPES[key];
  const rots = def.rotations[0];
  const cs   = rots.map(([c]) => c);
  const rs   = rots.map(([, r]) => r);
  const minC = Math.min(...cs), maxC = Math.max(...cs);
  const minR = Math.min(...rs), maxR = Math.max(...rs);
  const w    = maxC - minC + 1;
  const h    = maxR - minR + 1;
  const cellSize = Math.floor(size / 5);
  const ox   = Math.floor((size - w * cellSize) / 2) - minC * cellSize;
  const oy   = Math.floor((size - h * cellSize) / 2) - minR * cellSize;
  for (const [c, r] of rots) drawCell(context, c, r, def.color, 1, ox, oy, cellSize);
}
