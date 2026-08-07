const http = require('http');
const fs   = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

// ── HTTP 靜態伺服器 ───────────────────────────────────
const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = path.join(ROOT, urlPath);

  if (!fs.existsSync(filePath)) {
    if (urlPath === '/index.html') {
      filePath = path.join(ROOT, 'tetris.html');
    } else {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(500); res.end('Server Error'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

// ── WebSocket 伺服器（同 port）────────────────────────
const wss = new WebSocket.Server({ server });

// rooms: Map<roomId, { players: [ws, ws?] }>
const rooms = new Map();

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function getOpponent(roomId, ws) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.players.find(p => p !== ws) || null;
}

function makeRoomId() {
  let id;
  do { id = String(Math.floor(1000 + Math.random() * 9000)); }
  while (rooms.has(id));
  return id;
}

wss.on('connection', ws => {
  ws.roomId = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      // ── 建立房間 ──────────────────────────────────
      case 'create_room': {
        const roomId = makeRoomId();
        rooms.set(roomId, { players: [ws] });
        ws.roomId = roomId;
        send(ws, { type: 'room_joined', roomId, playerIndex: 0 });
        console.log(`[Room ${roomId}] 建立，等待第二位玩家`);
        break;
      }

      // ── 加入房間 ──────────────────────────────────
      case 'join_room': {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (!room) {
          send(ws, { type: 'room_error', reason: '房間不存在' });
          return;
        }
        if (room.players.length >= 2) {
          send(ws, { type: 'room_error', reason: '房間已滿' });
          return;
        }
        room.players.push(ws);
        ws.roomId = roomId;
        send(ws, { type: 'room_joined', roomId, playerIndex: 1 });
        // 通知雙方對手已加入
        send(room.players[0], { type: 'opponent_joined' });
        send(ws,              { type: 'opponent_joined' });
        console.log(`[Room ${roomId}] 雙方就位，對戰開始`);
        break;
      }

      // ── 轉發棋盤更新（俄羅斯方塊）────────────────
      case 'board_update': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'opponent_update', board: msg.board, score: msg.score, lines: msg.lines, level: msg.level });
        break;
      }

      // ── 轉發攻擊（俄羅斯方塊）────────────────────
      case 'attack': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'incoming_attack', lines: msg.lines });
        break;
      }

      // ── 貪吃蛇狀態同步 ────────────────────────────
      // 傳送自己的蛇身、食物、分數，對手收到後渲染
      case 'snake_state': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'opponent_snake', snake: msg.snake, food: msg.food, score: msg.score });
        break;
      }

      // ── 宣告遊戲結束 ──────────────────────────────
      case 'game_over': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'opponent_lost' });
        console.log(`[Room ${ws.roomId}] 對戰結束`);
        break;
      }
    }
  });

  ws.on('close', () => {
    const { roomId } = ws;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const opp = getOpponent(roomId, ws);
    if (opp) send(opp, { type: 'opponent_disconnected' });
    rooms.delete(roomId);
    console.log(`[Room ${roomId}] 玩家斷線，房間已關閉`);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅  伺服器已啟動！`);
  console.log(`👉  HTTP：http://localhost:${PORT}`);
  console.log(`👉  WebSocket：ws://localhost:${PORT}\n`);
});
