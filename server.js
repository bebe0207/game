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

// ── 一般對戰房間（俄羅斯方塊 / 貪吃蛇）─────────────
// rooms: Map<roomId, { players: [ws, ws?] }>
const rooms = new Map();

// ── 問答房間 ─────────────────────────────────────────
// quizRooms: Map<roomId, {
//   host: ws,
//   players: Map<ws, { name, score, answered }>,
//   state: 'lobby'|'question'|'result'|'ended',
//   currentQ: number,
//   questions: [...],
//   timeLimitSec: number,
//   timer: timeout
// }>
const quizRooms = new Map();

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function broadcast(quizRoom, obj, excludeWs = null) {
  if (quizRoom.host && quizRoom.host !== excludeWs) send(quizRoom.host, obj);
  for (const ws of quizRoom.players.keys()) {
    if (ws !== excludeWs) send(ws, obj);
  }
}

function getOpponent(roomId, ws) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.players.find(p => p !== ws) || null;
}

function makeRoomId(map) {
  let id;
  do { id = String(Math.floor(100000 + Math.random() * 900000)); }
  while (map.has(id) || rooms.has(id) || quizRooms.has(id));
  return id;
}

function getLeaderboard(quizRoom) {
  return [...quizRoom.players.entries()]
    .map(([, p]) => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

wss.on('connection', ws => {
  ws.roomId  = null;
  ws.isQuiz  = false;
  ws.isHost  = false;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ════════════════════════════════════════════════
    // 問答房間訊息
    // ════════════════════════════════════════════════
    if (msg.type.startsWith('quiz_')) {
      handleQuizMsg(ws, msg);
      return;
    }

    switch (msg.type) {

      // ── 建立對戰房間 ──────────────────────────────
      case 'create_room': {
        const roomId = makeRoomId(rooms);
        rooms.set(roomId, { players: [ws] });
        ws.roomId = roomId;
        send(ws, { type: 'room_joined', roomId, playerIndex: 0 });
        console.log(`[Room ${roomId}] 建立，等待第二位玩家`);
        break;
      }

      // ── 加入對戰房間 ──────────────────────────────
      case 'join_room': {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (!room) { send(ws, { type: 'room_error', reason: '房間不存在' }); return; }
        if (room.players.length >= 2) { send(ws, { type: 'room_error', reason: '房間已滿' }); return; }
        room.players.push(ws);
        ws.roomId = roomId;
        send(ws, { type: 'room_joined', roomId, playerIndex: 1 });
        send(room.players[0], { type: 'opponent_joined' });
        send(ws,              { type: 'opponent_joined' });
        console.log(`[Room ${roomId}] 雙方就位，對戰開始`);
        break;
      }

      case 'board_update': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'opponent_update', board: msg.board, score: msg.score, lines: msg.lines, level: msg.level });
        break;
      }
      case 'attack': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'incoming_attack', lines: msg.lines });
        break;
      }
      case 'snake_state': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'opponent_snake', snake: msg.snake, food: msg.food, score: msg.score });
        break;
      }
      case 'game_over': {
        const opp = getOpponent(ws.roomId, ws);
        if (opp) send(opp, { type: 'opponent_lost' });
        break;
      }
    }
  });

  ws.on('close', () => {
    // 一般對戰房間斷線
    if (ws.roomId && rooms.has(ws.roomId)) {
      const opp = getOpponent(ws.roomId, ws);
      if (opp) send(opp, { type: 'opponent_disconnected' });
      rooms.delete(ws.roomId);
    }
    // 問答房間斷線
    if (ws.roomId && quizRooms.has(ws.roomId)) {
      const qr = quizRooms.get(ws.roomId);
      if (ws.isHost) {
        broadcast(qr, { type: 'quiz_host_left' });
        clearTimeout(qr.timer);
        quizRooms.delete(ws.roomId);
        console.log(`[Quiz ${ws.roomId}] 主持人離開，房間關閉`);
      } else {
        const p = qr.players.get(ws);
        qr.players.delete(ws);
        if (p) {
          broadcast(qr, { type: 'quiz_player_left', name: p.name, count: qr.players.size });
          console.log(`[Quiz ${ws.roomId}] 玩家 ${p.name} 離開`);
        }
      }
    }
  });
});

// ════════════════════════════════════════════════════════
// 問答訊息處理
// ════════════════════════════════════════════════════════
function handleQuizMsg(ws, msg) {
  switch (msg.type) {

    // ── 主持人：建立問答房間 ──────────────────────────
    case 'quiz_create': {
      const roomId = makeRoomId(quizRooms);
      quizRooms.set(roomId, {
        host: ws, players: new Map(),
        state: 'lobby', currentQ: -1,
        questions: msg.questions || [],
        timeLimitSec: msg.timeLimitSec || 20,
        timer: null,
      });
      ws.roomId = roomId;
      ws.isQuiz = true;
      ws.isHost = true;
      send(ws, { type: 'quiz_room_created', roomId });
      console.log(`[Quiz ${roomId}] 主持人建立房間，共 ${msg.questions?.length || 0} 題`);
      break;
    }

    // ── 玩家：加入問答房間 ────────────────────────────
    case 'quiz_join': {
      const { roomId, name } = msg;
      const qr = quizRooms.get(roomId);
      if (!qr) { send(ws, { type: 'quiz_error', reason: '房間不存在，請確認房間碼' }); return; }
      if (qr.state !== 'lobby') { send(ws, { type: 'quiz_error', reason: '遊戲已開始，無法加入' }); return; }
      if (!name || name.trim().length === 0) { send(ws, { type: 'quiz_error', reason: '請輸入暱稱' }); return; }
      // 暱稱唯一性
      const names = [...qr.players.values()].map(p => p.name);
      if (names.includes(name.trim())) { send(ws, { type: 'quiz_error', reason: '暱稱已被使用' }); return; }

      qr.players.set(ws, { name: name.trim(), score: 0, answered: false, answerTime: 0 });
      ws.roomId = roomId;
      ws.isQuiz = true;
      ws.isHost = false;

      send(ws, { type: 'quiz_joined', name: name.trim(), roomId });
      // 通知主持人
      send(qr.host, { type: 'quiz_player_joined', name: name.trim(), count: qr.players.size });
      console.log(`[Quiz ${roomId}] ${name.trim()} 加入，共 ${qr.players.size} 人`);
      break;
    }

    // ── 主持人：開始遊戲（發第一題）──────────────────
    case 'quiz_start': {
      const qr = quizRooms.get(ws.roomId);
      if (!qr || !ws.isHost) return;
      if (qr.players.size === 0) { send(ws, { type: 'quiz_error', reason: '至少需要 1 位玩家才能開始' }); return; }
      qr.state = 'question';
      qr.currentQ = 0;
      sendQuestion(qr, ws.roomId);
      break;
    }

    // ── 主持人：下一題 ────────────────────────────────
    case 'quiz_next': {
      const qr = quizRooms.get(ws.roomId);
      if (!qr || !ws.isHost) return;
      clearTimeout(qr.timer);
      qr.currentQ++;
      if (qr.currentQ >= qr.questions.length) {
        endQuiz(qr, ws.roomId);
      } else {
        qr.state = 'question';
        sendQuestion(qr, ws.roomId);
      }
      break;
    }

    // ── 玩家：提交答案 ────────────────────────────────
    case 'quiz_answer': {
      const qr = quizRooms.get(ws.roomId);
      if (!qr || qr.state !== 'question') return;
      const player = qr.players.get(ws);
      if (!player || player.answered) return;

      player.answered = true;
      player.answerTime = Date.now();
      const q = qr.questions[qr.currentQ];
      const isCorrect = msg.answer === q.ans;

      // 計分：時間越快越高（最高 1000）
      const elapsed = (player.answerTime - qr.questionStartTime) / 1000;
      const pts = isCorrect ? Math.max(100, Math.round(1000 * (1 - elapsed / qr.timeLimitSec))) : 0;
      player.score += pts;
      player.lastPts = pts;
      player.lastCorrect = isCorrect;

      send(ws, { type: 'quiz_answer_ack', correct: isCorrect, pts });

      // 通知主持人目前答題人數
      const answeredCount = [...qr.players.values()].filter(p => p.answered).length;
      send(qr.host, { type: 'quiz_answer_count', count: answeredCount, total: qr.players.size });

      // 全員答完 → 提前結束倒數
      if (answeredCount === qr.players.size) {
        clearTimeout(qr.timer);
        revealAnswer(qr, ws.roomId);
      }
      break;
    }
  }
}

// ── 發送題目 ──────────────────────────────────────────
function sendQuestion(qr, roomId) {
  // 重置所有玩家答題狀態
  for (const p of qr.players.values()) { p.answered = false; p.lastPts = 0; p.lastCorrect = false; }
  qr.questionStartTime = Date.now();

  const q = qr.questions[qr.currentQ];
  const payload = {
    type: 'quiz_question',
    index: qr.currentQ,
    total: qr.questions.length,
    question: q.q,
    opts: q.opts,
    timeLimitSec: qr.timeLimitSec,
  };
  broadcast(qr, payload);
  console.log(`[Quiz ${roomId}] 第 ${qr.currentQ + 1} 題`);

  // 倒數結束自動公布答案
  qr.timer = setTimeout(() => revealAnswer(qr, roomId), qr.timeLimitSec * 1000);
}

// ── 公布答案與即時排行 ────────────────────────────────
function revealAnswer(qr, roomId) {
  qr.state = 'result';
  clearTimeout(qr.timer);
  const q = qr.questions[qr.currentQ];

  // 給未答玩家標記
  for (const p of qr.players.values()) { if (!p.answered) { p.lastCorrect = false; p.lastPts = 0; } }

  const leaderboard = getLeaderboard(qr);
  const payload = {
    type: 'quiz_reveal',
    correctAns: q.ans,
    correctText: q.opts['ABCD'.indexOf(q.ans)],
    leaderboard,
    isLast: qr.currentQ >= qr.questions.length - 1,
  };
  // 主持人收到完整排行
  send(qr.host, payload);
  // 每個玩家收到自己的結果 + 排行
  for (const [ws, p] of qr.players.entries()) {
    send(ws, { ...payload, myPts: p.lastPts, myCorrect: p.lastCorrect, myScore: p.score });
  }
  console.log(`[Quiz ${roomId}] 第 ${qr.currentQ + 1} 題揭曉，排行：${leaderboard.map(p=>`${p.name}(${p.score})`).join(', ')}`);
}

// ── 結束問答 ──────────────────────────────────────────
function endQuiz(qr, roomId) {
  qr.state = 'ended';
  const leaderboard = getLeaderboard(qr);
  broadcast(qr, { type: 'quiz_ended', leaderboard });
  console.log(`[Quiz ${roomId}] 問答結束，冠軍：${leaderboard[0]?.name}`);
}

server.listen(PORT, () => {
  console.log(`\n✅  伺服器已啟動！`);
  console.log(`👉  HTTP：http://localhost:${PORT}`);
  console.log(`👉  WebSocket：ws://localhost:${PORT}\n`);
});
