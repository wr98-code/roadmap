// ─── ZERØ COMMAND — functions/api/data-kv.ts ─────────────────────────────────
// Cloudflare Pages Function: per-key KV storage
// Binding: ZERO_DATA (sama seperti sebelumnya)

const PREFIX = 'zcc:'; // namespace prefix biar gak clash

interface Env {
  ZERO_DATA: KVNamespace;
  SYNC_TOKEN?: string;
}

// Auth fail-closed — lihat penjelasan & setup di functions/api/data.ts.
function authorized(request: Request, env: Env): boolean {
  if (!env.SYNC_TOKEN) return false;
  return request.headers.get('X-Sync-Token') === env.SYNC_TOKEN;
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!authorized(request, env)) return unauthorized();
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (!key) return new Response(JSON.stringify({ error: 'key required' }), { status: 400 });

    const raw = await env.ZERO_DATA.get(PREFIX + key);
    if (!raw) return new Response(JSON.stringify({ value: null }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

    return new Response(JSON.stringify({ value: JSON.parse(raw) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'KV read failed' }), { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authorized(request, env)) return unauthorized();
  try {
    const body = await request.json() as { key: string; value: unknown };
    if (!body.key) return new Response(JSON.stringify({ error: 'key required' }), { status: 400 });

    await env.ZERO_DATA.put(PREFIX + body.key, JSON.stringify(body.value));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'KV write failed' }), { status: 500 });
  }
};
