import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const file = normalize(join(root, relative));
    if (!file.startsWith(root)) throw new Error('Invalid path');
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end('Not found');
  }
}).listen(port, '0.0.0.0', () => console.log(`PrivAI Pocket: http://localhost:${port}`));
