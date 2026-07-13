// Servidor estático com brotli/gzip on-the-fly — aproxima o Netlify (que serve
// text/* comprimido). Sem isto, o Lighthouse local penaliza CSS/JS ao dobro.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const ROOT = resolve(process.argv[2] || process.cwd());
const PORT = +(process.argv[3] || 8891);
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.webmanifest':'application/manifest+json', '.mp4':'video/mp4', '.ico':'image/x-icon' };
const COMPRESS = new Set(['.html','.js','.css','.json','.svg','.webmanifest']);

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const st = await stat(file).catch(() => null);
    if (!st || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    const ext = extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    if (COMPRESS.has(ext)) {
      const buf = await readFile(file);
      const ae = req.headers['accept-encoding'] || '';
      let body = buf, enc = null;
      if (/\bbr\b/.test(ae)) { body = brotliCompressSync(buf); enc = 'br'; }
      else if (/\bgzip\b/.test(ae)) { body = gzipSync(buf); enc = 'gzip'; }
      const h = { 'content-type': type, 'content-length': body.length };
      if (enc) h['content-encoding'] = enc;
      res.writeHead(200, h); res.end(body);
    } else {
      res.writeHead(200, { 'content-type': type, 'content-length': st.size });
      createReadStream(file).pipe(res);
    }
  } catch (e) { res.writeHead(500).end(String(e)); }
}).listen(PORT, () => console.log('gzserve on ' + PORT + ' root=' + ROOT));
