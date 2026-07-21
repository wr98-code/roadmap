// ─── ZERØ COMMAND — functions/api/data.ts ─────────────────────────────────────
// Cloudflare Pages Function: baca/tulis data ke KV
//
// SETUP (wajib):
//   1. Di Cloudflare dashboard → Workers & Pages → pilih project lu
//   2. Settings → Functions → KV namespace bindings
//   3. Tambah binding: Variable name = ZERO_DATA, pilih KV namespace lu
//   4. Kalau belum punya KV namespace: Workers & Pages → KV → Create namespace
//      kasih nama "zero-command-center"

const KV_KEY = "appdata-v1";

interface Env {
  ZERO_DATA: KVNamespace;
  SYNC_TOKEN?: string;
}

// ─── AUTH (fail-closed) ───────────────────────────────────────────────────────
// Data di endpoint ini SANGAT pribadi. Tanpa proteksi, siapa pun yang tahu URL
// bisa baca & timpa semuanya. Aturan:
//   - Request wajib bawa header  X-Sync-Token  yang sama dengan env SYNC_TOKEN.
//   - Kalau SYNC_TOKEN belum di-set di environment → SEMUA request ditolak
//     (fail-closed; lebih baik sync mati daripada data pribadi terbuka).
// SETUP: Cloudflare dashboard → Workers & Pages → project → Settings →
// Environment variables → tambah SYNC_TOKEN (string acak panjang, mis. hasil
// `openssl rand -hex 32`). Lalu isi token yang sama di app: Settings (ikon
// kunci) → Sync Token. Token user tersimpan di localStorage, bukan di bundle.
function authorized(request: Request, env: Env): boolean {
  if (!env.SYNC_TOKEN) return false;
  return request.headers.get("X-Sync-Token") === env.SYNC_TOKEN;
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!authorized(request, env)) return unauthorized();
  try {
    const raw = await env.ZERO_DATA.get(KV_KEY);
    if (!raw) return new Response(null, { status: 404 });
    return new Response(raw, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "KV read failed" }), { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authorized(request, env)) return unauthorized();
  try {
    const body = await request.text();
    // Basic validation — must be valid JSON
    JSON.parse(body);
    await env.ZERO_DATA.put(KV_KEY, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "KV write failed" }), { status: 500 });
  }
};
