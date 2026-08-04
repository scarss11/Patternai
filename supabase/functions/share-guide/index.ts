// Supabase Edge Function: share-guide
// Deploy: supabase functions deploy share-guide --no-verify-jwt
// (--no-verify-jwt porque el enlace público NO requiere login)
//
// URL pública: https://TU-PROYECTO.supabase.co/functions/v1/share-guide/:token
//
// Usa SERVICE_ROLE para validar el token saltándose la RLS de forma controlada:
// solo entrega la guía si el link existe, no está revocado y no expiró.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { marked } from 'https://esm.sh/marked@12';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function page(title: string, body: string, code = 200): Response {
  const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  :root{--blue:#0A84FF;--purple:#7C6CF0;--text:#14181F;--muted:#6B7280;--bg:#EEF2F7;--border:#E6E9EE}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--text)}
  .wrap{max-width:760px;margin:0 auto;padding:32px 20px 80px}
  .brand{display:flex;align-items:center;gap:10px;margin-bottom:24px}
  .mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--blue),var(--purple));
        display:grid;place-items:center;color:#fff;font-weight:700}
  .card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:28px 30px}
  .card h1{margin:.2em 0 .1em;font-size:1.6rem}
  .cat{color:var(--muted);font-size:.9rem;margin-bottom:1.2rem}
  .card pre{background:#F5F6F8;padding:14px;border-radius:10px;overflow:auto}
  .card code{background:#F5F6F8;padding:2px 5px;border-radius:5px}
  .foot{color:var(--muted);font-size:.8rem;margin-top:22px;text-align:center}
</style></head>
<body><div class="wrap">
  <div class="brand"><div class="mark">P</div><b>PatternAI</b></div>
  <div class="card">${body}</div>
  <div class="foot">Enlace de solo lectura · PatternAI</div>
</div></body></html>`;
  return new Response(html, { status: code, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  const token = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  if (!token) return page('Enlace inválido', '<h1>Enlace inválido</h1>', 400);

  const { data: link } = await supabase
    .from('guide_share_links')
    .select('guide_id, revoked, expires_at')
    .eq('token', token).maybeSingle();

  if (!link || link.revoked) return page('No disponible', '<h1>Este enlace ya no está disponible.</h1>', 404);
  if (link.expires_at && new Date(link.expires_at) < new Date())
    return page('Enlace expirado', '<h1>Este enlace expiró.</h1>', 410);

  const { data: guide } = await supabase
    .from('guides').select('title, category, content_md')
    .eq('id', link.guide_id).maybeSingle();

  if (!guide) return page('No encontrada', '<h1>Guía no encontrada.</h1>', 404);

  const body = `<h1>${guide.title}</h1><div class="cat">${guide.category}</div>${marked.parse(guide.content_md)}`;
  return page(guide.title, body);
});
