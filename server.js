const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 10000);
const ALLOWED_ORIGIN = 'https://yusif0427.github.io';
const cache = new Map();
const rate = new Map();

function send(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
}
async function getJson(url) {
  const r = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'VOID-Roblox-Profile/1.0' }, signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error('Upstream HTTP ' + r.status);
  return r.json();
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600'
    });
    return res.end();
  }
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') return send(res, 200, { ok: true, service: 'VOID Roblox API' }, origin);
  if (url.pathname !== '/api/roblox/user' || req.method !== 'GET') return send(res, 404, { error: 'Not found' }, origin);

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = rate.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > 60000) { bucket.start = now; bucket.count = 0; }
  bucket.count++; rate.set(ip, bucket);
  if (bucket.count > 40) return send(res, 429, { error: 'Çok fazla istek. Bir dakika sonra tekrar dene.' }, origin);

  const username = (url.searchParams.get('username') || '').trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return send(res, 400, { error: 'Geçerli bir Roblox kullanıcı adı gir (3–20 karakter).' }, origin);
  const cacheKey = username.toLowerCase();
  const saved = cache.get(cacheKey);
  if (saved && saved.expires > now) return send(res, 200, saved.data, origin);

  try {
    const searchRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'VOID-Roblox-Profile/1.0' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      signal: AbortSignal.timeout(9000)
    });
    if (!searchRes.ok) throw new Error('Roblox user search unavailable (HTTP ' + searchRes.status + ')');
    const search = await searchRes.json();
    const user = search.data && search.data[0];
    if (!user) return send(res, 404, { error: 'Bu kullanıcı adı bulunamadı.' }, origin);
    const id = user.id;
    const urls = {
      profile: 'https://users.roblox.com/v1/users/' + id,
      avatar: 'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + id + '&size=180x180&format=Png&isCircular=false',
      friends: 'https://friends.roblox.com/v1/users/' + id + '/friends/count',
      followers: 'https://friends.roblox.com/v1/users/' + id + '/followers/count',
      following: 'https://friends.roblox.com/v1/users/' + id + '/followings/count',
      favorites: 'https://games.roblox.com/v2/users/' + id + '/favorite/games?sortOrder=Desc&limit=10'
    };
    const entries = await Promise.all(Object.entries(urls).map(async ([key, target]) => {
      try { return [key, await getJson(target)]; } catch { return [key, null]; }
    }));
    const result = { user, data: Object.fromEntries(entries) };
    cache.set(cacheKey, { data: result, expires: Date.now() + 120000 });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return send(res, 200, result, origin);
  } catch (err) {
    return send(res, 502, { error: 'Roblox veri servisine şu an ulaşılamıyor. Biraz sonra tekrar dene.' }, origin);
  }
});
server.listen(PORT, '0.0.0.0', () => console.log('VOID Roblox API listening on ' + PORT));
