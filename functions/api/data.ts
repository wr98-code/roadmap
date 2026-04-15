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
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
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
