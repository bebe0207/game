const http = require('http');
const fs   = require('fs');
const path = require('path');

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

const server = http.createServer((req, res) => {
  // 預設首頁
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  // 若 / 沒有 index.html，改用 tetris.html
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
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅  伺服器已啟動！`);
  console.log(`👉  請在瀏覽器開啟：http://localhost:${PORT}\n`);
});
