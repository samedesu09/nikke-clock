// NIKKE Clock 動画中継 (Cloudflare Worker)
// GitHub Releases の動画を video/mp4 + inline で返し直し、Safariでも再生できるようにする。
// 使い方: https://<worker>.workers.dev/<タグ名>/<ファイル名>
// samedesu09/nikke-clock のリリースだけを中継します。

const REPO = 'samedesu09/nikke-clock';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: CORS });

    const m = new URL(req.url).pathname.match(/^\/([A-Za-z0-9._-]+)\/([^/]+)$/);
    if (!m) return new Response('NIKKE Clock video proxy: OK', { headers: CORS });

    const target = 'https://github.com/' + REPO + '/releases/download/' + m[1] + '/' + m[2];
    const h = new Headers();
    const range = req.headers.get('Range');
    if (range) h.set('Range', range);

    const up = await fetch(target, { method: req.method, headers: h, redirect: 'follow' });
    if (up.status >= 400) return new Response('Not found', { status: up.status, headers: CORS });

    const out = new Headers(CORS);
    for (const k of ['content-length', 'content-range', 'etag', 'last-modified']) {
      const v = up.headers.get(k);
      if (v) out.set(k, v);
    }
    out.set('Accept-Ranges', 'bytes');
    out.set('Content-Type', 'video/mp4');
    out.set('Content-Disposition', 'inline');
    out.set('Cache-Control', 'public, max-age=86400');
    return new Response(up.body, { status: up.status, headers: out });
  },
};
