import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT || 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  const resolved = path.resolve(root, `.${pathname}`);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  let file = resolved;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (error, data) => {
    if (error) {
      const message = error.code === 'ENOENT' ? 'Not found' : 'Could not read the requested file';
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {'Content-Type': 'text/plain; charset=utf-8'}).end(message);
      return;
    }
    response.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }).end(data);
  });
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set PORT to a free port and try again.`);
    process.exit(1);
  }
  throw error;
});
server.listen(port, '127.0.0.1', () => console.log(`USWDS Futures Lab at http://127.0.0.1:${port}/`));
