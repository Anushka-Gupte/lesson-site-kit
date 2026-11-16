const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

function createStaticServer(rootDir, port = 3105) {
  const server = http.createServer((req, res) => {
    try {
      let reqPath = decodeURI(req.url.split('?')[0].split('#')[0]);
      if (reqPath.endsWith('/')) {
        reqPath += 'index.html';
      }

      let filePath = path.join(rootDir, reqPath);

      // Security check: ensure path is within rootDir
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // Serve 404.html if available
          const notFoundPath = path.join(rootDir, '404.html');
          if (fs.existsSync(notFoundPath)) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(notFoundPath).pipe(res);
          } else {
            res.writeHead(404);
            res.end('Not Found');
          }
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stats.size,
          'Cache-Control': 'no-cache',
        });

        fs.createReadStream(filePath).pipe(res);
      });
    } catch (e) {
      res.writeHead(500);
      res.end('Server Error: ' + e.message);
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = { createStaticServer };

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  createStaticServer(root, 3105).then(() => {
    console.log('Static server listening on http://127.0.0.1:3105');
  });
}
