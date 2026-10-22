// Servidor do SENAI Esports: serve o hub, o Poeira Morta e a API de jogos,
// e protege o painel do admin. Uma única dependência (pg), usada só quando
// DATABASE_URL existe; sem ela, os jogos ficam em arquivos (veja README).
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename, unlink, stat } from 'node:fs/promises';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(HERE, '..');
const PORT = Number(process.env.PORT) || 8080;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || (ADMIN_PASSWORD ? sha256('senai-esports-session:' + ADMIN_PASSWORD) : '');
const SESSION_MS = 8 * 3600 * 1000;
const MAX_BODY = 4 * 1024 * 1024;
const MAX_COVER = 3.5 * 1024 * 1024; // caracteres do data URL (~2,6 MB de imagem)
const LOGIN_MAX_FAILS = 8, LOGIN_WINDOW_MS = 15 * 60 * 1000;

function sha256(s) { return createHash('sha256').update(s).digest('hex'); }

// ---------------------------------------------------------------------
// Armazenamento: Postgres (DATABASE_URL) ou arquivos (DATA_DIR / server/data)
// ---------------------------------------------------------------------
async function makeStore() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
    await pool.query('CREATE TABLE IF NOT EXISTS hub_store (key text PRIMARY KEY, value text NOT NULL, updated timestamptz NOT NULL DEFAULT now())');
    return {
      kind: 'postgres', persistent: true,
      async get(k) { const r = await pool.query('SELECT value FROM hub_store WHERE key = $1', [k]); return r.rows[0]?.value ?? null; },
      async set(k, v) { await pool.query('INSERT INTO hub_store (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated = now()', [k, v]); },
      async del(k) { await pool.query('DELETE FROM hub_store WHERE key = $1', [k]); },
    };
  }
  const dir = resolve(process.env.DATA_DIR || join(HERE, 'data'));
  await mkdir(dir, { recursive: true });
  const file = k => join(dir, encodeURIComponent(k) + '.txt');
  return {
    kind: 'arquivo', persistent: !!process.env.DATA_DIR,
    async get(k) { try { return await readFile(file(k), 'utf8'); } catch { return null; } },
    async set(k, v) { const f = file(k); await writeFile(f + '.tmp', v); await rename(f + '.tmp', f); },
    async del(k) { try { await unlink(file(k)); } catch {} },
  };
}

// ---------------------------------------------------------------------
// Jogos
// ---------------------------------------------------------------------
let store, games;
let queue = Promise.resolve();
const serial = fn => (queue = queue.then(fn, fn)); // uma alteração por vez

async function loadGames() {
  const raw = await store.get('games');
  if (raw) { games = JSON.parse(raw); return; }
  const seed = JSON.parse(await readFile(join(HERE, 'seed-games.json'), 'utf8'));
  games = seed.map(g => ({ ...g, hasCover: false, updated: Date.now() }));
  await saveGames();
}
const saveGames = () => store.set('games', JSON.stringify(games));

const publicGame = g => {
  const { hasCover, updated, ...rest } = g;
  return { ...rest, img: hasCover ? `/api/cover/${encodeURIComponent(g.id)}?v=${updated}` : g.img || '' };
};

class BadRequest extends Error {}
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const pairs = (v, maxN, maxA, maxB) => (Array.isArray(v) ? v : [])
  .filter(Array.isArray).slice(0, maxN)
  .map(p => [str(p[0], maxA), str(p[1], maxB)]).filter(p => p[0]);

function validUrl(u) {
  if (u.startsWith('/') && !u.startsWith('//')) return true;
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch { return false; }
}

// Confere e normaliza o que vem do painel. Nada passa sem limite de tamanho.
function cleanGame(input) {
  const g = {
    title: str(input.title, 60),
    genre: str(input.genre, 60),
    url: str(input.url, 500),
    accent: /^#[0-9a-f]{6}$/i.test(input.accent || '') ? input.accent.toLowerCase() : '#e30613',
    tags: pairs(input.tags, 6, 24, 8).map(([t, c]) => [t, ['green', 'red'].includes(c) ? c : '']),
    short: str(input.short, 160),
    desc: str(input.desc, 1500),
    features: (Array.isArray(input.features) ? input.features : []).map(f => str(f, 120)).filter(Boolean).slice(0, 10),
    stats: pairs(input.stats, 6, 24, 40),
    controls: pairs(input.controls, 16, 30, 60),
    warn: str(input.warn, 120),
  };
  if (!g.title) throw new BadRequest('Informe o nome do jogo.');
  if (!g.url || !validUrl(g.url)) throw new BadRequest('O link do jogo precisa começar com https:// (ou / para páginas deste site).');
  if (!g.short) throw new BadRequest('Escreva uma descrição curta.');
  return g;
}

function checkCover(c) {
  if (typeof c !== 'string' || c.length > MAX_COVER || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(c)) {
    throw new BadRequest('Capa inválida. Use uma imagem JPG, PNG ou WEBP.');
  }
}

function newId(title) {
  const base = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'jogo';
  return games.some(g => g.id === base) ? `${base}-${randomBytes(2).toString('hex')}` : base;
}

// body.cover: ausente = mantém; '' ou null = remove; data URL = troca.
async function applyCover(g, cover) {
  if (cover === undefined) return;
  if (!cover) { g.hasCover = false; g.img = ''; await store.del('cover:' + g.id); return; }
  checkCover(cover);
  await store.set('cover:' + g.id, cover);
  g.hasCover = true;
}

// ---------------------------------------------------------------------
// Sessão do admin (cookie assinado, HttpOnly, SameSite=Strict)
// ---------------------------------------------------------------------
const pwTag = () => sha256('tag:' + ADMIN_PASSWORD).slice(0, 16); // trocar a senha derruba as sessões

function signToken() {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS, pw: pwTag(), n: randomBytes(8).toString('hex') })).toString('base64url');
  return body + '.' + createHmac('sha256', SECRET).update(body).digest('base64url');
}
function validToken(t) {
  if (!SECRET || !ADMIN_PASSWORD || typeof t !== 'string') return false;
  const [body, sig] = t.split('.');
  if (!body || !sig) return false;
  const good = createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() && p.pw === pwTag(); } catch { return false; }
}
const safeEqual = (a, b) => timingSafeEqual(Buffer.from(sha256(String(a))), Buffer.from(sha256(String(b))));

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const isHttps = req => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;
const clientIp = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
function sessionCookie(req, value, maxAge) {
  return `adm=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}
const isAdmin = req => validToken(cookies(req).adm);

const fails = new Map(); // ip -> { n, until }
function tooManyFails(ip) {
  const f = fails.get(ip);
  if (!f || f.until < Date.now()) { fails.delete(ip); return false; }
  return f.n >= LOGIN_MAX_FAILS;
}
function addFail(ip) {
  const f = fails.get(ip);
  if (!f || f.until < Date.now()) fails.set(ip, { n: 1, until: Date.now() + LOGIN_WINDOW_MS });
  else f.n++;
  if (fails.size > 5000) fails.clear();
}

// ---------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const HUB_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

function baseHeaders(req, extra = {}) {
  const h = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...extra };
  if (isHttps(req)) h['Strict-Transport-Security'] = 'max-age=31536000';
  return h;
}
function send(req, res, status, body, headers = {}) {
  res.writeHead(status, baseHeaders(req, headers));
  res.end(body);
}
function json(req, res, status, data, headers = {}) {
  send(req, res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY * 4) { req.destroy(); return; } // abuso: corta a conexão
      if (size <= MAX_BODY) chunks.push(c); // acima do limite, só descarta até o fim para responder o erro
    });
    req.on('end', () => {
      if (size > MAX_BODY) return fail(new BadRequest('Envio grande demais. Use uma imagem menor.'));
      try { ok(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { fail(new BadRequest('JSON inválido.')); }
    });
    req.on('error', fail);
  });
}

// Pedidos que alteram dados: só JSON e só vindos deste próprio site.
function sameSite(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

async function api(req, res, path) {
  const method = req.method;

  if (path === '/api/games' && method === 'GET') {
    return json(req, res, 200, { games: games.map(publicGame) }, { 'Cache-Control': 'no-cache' });
  }

  const cover = path.match(/^\/api\/cover\/([^/]+)$/);
  if (cover && method === 'GET') {
    const id = decodeURIComponent(cover[1]);
    const g = games.find(x => x.id === id);
    const data = g && g.hasCover ? await store.get('cover:' + id) : null;
    if (!data) return json(req, res, 404, { error: 'Capa não encontrada.' });
    const [, mime, b64] = data.match(/^data:([^;]+);base64,(.*)$/);
    const etag = `"${g.updated}"`;
    if (req.headers['if-none-match'] === etag) return send(req, res, 304, '', { ETag: etag });
    return send(req, res, 200, Buffer.from(b64, 'base64'), { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400', ETag: etag });
  }

  if (!path.startsWith('/api/admin/')) return json(req, res, 404, { error: 'Não encontrado.' });
  if (method !== 'GET' && !sameSite(req)) return json(req, res, 403, { error: 'Pedido recusado.' });

  if (path === '/api/admin/login' && method === 'POST') {
    if (!ADMIN_PASSWORD) return json(req, res, 503, { error: 'O admin ainda não foi configurado no servidor (variável ADMIN_PASSWORD).' });
    const ip = clientIp(req);
    if (tooManyFails(ip)) return json(req, res, 429, { error: 'Muitas tentativas. Espere 15 minutos.' });
    const { user, pass } = await readBody(req);
    const ok = safeEqual(user || '', ADMIN_USER) & safeEqual(pass || '', ADMIN_PASSWORD);
    if (!ok) { addFail(ip); await new Promise(r => setTimeout(r, 400)); return json(req, res, 401, { error: 'Usuário ou senha incorretos.' }); }
    fails.delete(ip);
    return json(req, res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, signToken(), SESSION_MS / 1000) });
  }
  if (path === '/api/admin/logout' && method === 'POST') {
    return json(req, res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  }
  if (path === '/api/admin/me' && method === 'GET') {
    return json(req, res, 200, { admin: isAdmin(req), configured: !!ADMIN_PASSWORD, storage: store.kind, persistent: store.persistent });
  }

  if (!isAdmin(req)) return json(req, res, 401, { error: 'Sessão expirada. Entre de novo.' });

  if (path === '/api/admin/games' && method === 'POST') {
    const body = await readBody(req);
    return serial(async () => {
      const g = { id: newId(str(body.title, 60)), ...cleanGame(body), img: '', hasCover: false, updated: Date.now() };
      await applyCover(g, body.cover || undefined);
      games.push(g); await saveGames();
      return json(req, res, 201, { game: publicGame(g) });
    });
  }

  const one = path.match(/^\/api\/admin\/games\/([^/]+)$/);
  if (one && (method === 'PUT' || method === 'DELETE')) {
    const id = decodeURIComponent(one[1]);
    const body = method === 'PUT' ? await readBody(req) : null;
    return serial(async () => {
      const i = games.findIndex(x => x.id === id);
      if (i < 0) return json(req, res, 404, { error: 'Jogo não encontrado.' });
      if (method === 'DELETE') {
        games.splice(i, 1); await saveGames(); await store.del('cover:' + id);
        return json(req, res, 200, { ok: true });
      }
      const g = { ...games[i], ...cleanGame(body), updated: Date.now() };
      await applyCover(g, body.cover);
      games[i] = g; await saveGames();
      return json(req, res, 200, { game: publicGame(g) });
    });
  }

  if (path === '/api/admin/order' && method === 'POST') {
    const { ids } = await readBody(req);
    return serial(async () => {
      if (!Array.isArray(ids) || ids.length !== games.length || !games.every(g => ids.includes(g.id))) {
        throw new BadRequest('A lista mudou. Recarregue a página.');
      }
      games.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      await saveGames();
      return json(req, res, 200, { ok: true });
    });
  }

  return json(req, res, 404, { error: 'Não encontrado.' });
}

// Só estas pastas e arquivos são públicos; o resto do repositório (server/, .git...) não.
const PUBLIC_DIRS = { hub: resolve(ROOT, 'hub'), fonts: resolve(ROOT, 'fonts'), vendor: resolve(ROOT, 'vendor') };
const PUBLIC_FILES = { '/poeira-morta.html': resolve(ROOT, 'poeira-morta.html') };

async function serveStatic(req, res, path) {
  if (path === '/' || path === '/hub') return send(req, res, 302, '', { Location: '/hub/' });
  if (path === '/admin' || path === '/admin/') return send(req, res, 302, '', { Location: '/hub/admin.html' });
  let file = PUBLIC_FILES[path];
  if (!file) {
    const m = path.match(/^\/(hub|fonts|vendor)\/(.*)$/);
    if (!m) return send(req, res, 404, 'Não encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
    const rel = m[2] || 'index.html';
    if (rel.split('/').some(s => !s || s.startsWith('.'))) return send(req, res, 404, 'Não encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
    file = resolve(PUBLIC_DIRS[m[1]], rel);
    if (!file.startsWith(PUBLIC_DIRS[m[1]] + sep)) return send(req, res, 404, 'Não encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    const body = await readFile(file);
    const ext = extname(file).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    headers['Cache-Control'] = ext === '.html' ? 'no-cache' : 'public, max-age=86400';
    if (path.startsWith('/hub/') && ext === '.html') { headers['Content-Security-Policy'] = HUB_CSP; headers['X-Frame-Options'] = 'DENY'; }
    return send(req, res, 200, req.method === 'HEAD' ? '' : body, headers);
  } catch {
    return send(req, res, 404, 'Não encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

const server = createServer(async (req, res) => {
  try {
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return send(req, res, 400, 'Endereço inválido'); }
    if (path === '/health') return json(req, res, 200, { ok: true, storage: store.kind });
    if (path.startsWith('/api/')) return await api(req, res, path);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, '');
    return await serveStatic(req, res, path);
  } catch (err) {
    if (err instanceof BadRequest) return json(req, res, 400, { error: err.message });
    console.error(err);
    if (!res.headersSent) json(req, res, 500, { error: 'Erro no servidor.' });
  }
});

store = await makeStore();
await loadGames();
server.listen(PORT, () => {
  console.log(`SENAI Esports em http://localhost:${PORT} · armazenamento: ${store.kind}${store.persistent ? '' : ' (TEMPORÁRIO)'}`);
  if (!ADMIN_PASSWORD) console.warn('Aviso: ADMIN_PASSWORD não definida; o painel do admin fica desativado.');
  if (!store.persistent) console.warn('Aviso: sem DATABASE_URL (ou DATA_DIR), jogos adicionados pelo admin somem quando o servidor reinicia.');
});
