// Recebe o formulário de contato e envia o e-mail via Resend (server-side).
// A chave (RESEND_API_KEY) e o destino (CONTACT_TO) ficam em env vars da Vercel.
export const config = { runtime: 'edge' };

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function env(name) {
  try { if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name]; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name]; } catch (e) {}
  return '';
}

function esc(s) {
  return String(s).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; });
}

// só aceita envios originados do próprio site (apex/subdomínios + previews Vercel).
// reduz abuso automatizado/flood que ignora o formulário do navegador.
function fromSite(v) {
  return /^https:\/\/([a-z0-9-]+\.)*urbancodelabs\.com\.br$/i.test(v)
      || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(v);
}

// Rate-limit por IP + teto global diário via Upstash Redis (REST, server-side).
// Fail-open: se o Upstash não estiver configurado ou estiver fora do ar, libera.
// Não derrubamos o único canal de contato por causa de uma dependência externa.
const RL_IP_MAX = 5;         // no máximo 5 envios por IP...
const RL_IP_WINDOW = 3600;   // ...a cada 1 hora
const RL_DAY_MAX = 80;       // teto global por dia (protege a cota grátis do Resend)

async function rateLimit(ip) {
  const url = env('UPSTASH_REDIS_REST_URL');
  const token = env('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) return { ok: true }; // não configurado -> libera

  const ipKey = 'rl:contact:ip:' + ip;
  const dayKey = 'rl:contact:day';
  try {
    const r = await fetch(url.replace(/\/+$/, '') + '/pipeline', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', ipKey],
        ['EXPIRE', ipKey, String(RL_IP_WINDOW), 'NX'],
        ['INCR', dayKey],
        ['EXPIRE', dayKey, '86400', 'NX'],
      ]),
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) return { ok: true }; // Upstash indisponível -> libera
    const out = await r.json();
    const ipCount = (out && out[0] && typeof out[0].result === 'number') ? out[0].result : 0;
    const dayCount = (out && out[2] && typeof out[2].result === 'number') ? out[2].result : 0;
    if (ipCount > RL_IP_MAX) return { ok: false, scope: 'ip' };
    if (dayCount > RL_DAY_MAX) return { ok: false, scope: 'day' };
    return { ok: true };
  } catch (e) {
    return { ok: true }; // timeout/erro de rede -> libera
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  // um navegador real sempre envia Origin (POST fetch application/json) ou Referer.
  const origin = req.headers.get('origin') || '';
  let refOrigin = '';
  try { refOrigin = req.headers.get('referer') ? new URL(req.headers.get('referer')).origin : ''; } catch (e) {}
  if (origin) {
    if (!fromSite(origin)) return json({ ok: false, error: 'origin' }, 403);
  } else if (refOrigin) {
    if (!fromSite(refOrigin)) return json({ ok: false, error: 'origin' }, 403);
  } else {
    return json({ ok: false, error: 'origin' }, 403);
  }

  const apiKey = env('RESEND_API_KEY');
  const to = env('CONTACT_TO');
  const from = env('CONTACT_FROM') || 'Urban Code Labs <onboarding@resend.dev>';
  if (!apiKey || !to) return json({ ok: false, error: 'not_configured' }, 503);

  let data;
  try { data = await req.json(); } catch (e) { return json({ ok: false, error: 'invalid' }, 400); }

  // honeypot: campo oculto que só bot preenche -> descarta silenciosamente
  if (data && data.website) return json({ ok: true });

  const nome = String((data && data.nome) || '').trim().slice(0, 120);
  const email = String((data && data.email) || '').trim().slice(0, 160);
  const tipo = String((data && data.tipo) || '').trim().slice(0, 80);
  const mensagem = String((data && data.mensagem) || '').trim().slice(0, 4000);

  if (!nome || !email || !mensagem) return json({ ok: false, error: 'required' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'email' }, 400);

  // rate-limit só depois de validar (bots com payload inválido não gastam a cota)
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim() || 'unknown';
  const rl = await rateLimit(ip);
  if (!rl.ok) return json({ ok: false, error: 'rate' }, 429);

  const html =
    '<h2 style="margin:0 0 12px">Novo contato pelo site</h2>' +
    '<p><strong>Nome:</strong> ' + esc(nome) + '</p>' +
    '<p><strong>E-mail:</strong> ' + esc(email) + '</p>' +
    (tipo ? '<p><strong>Tipo de projeto:</strong> ' + esc(tipo) + '</p>' : '') +
    '<p><strong>Mensagem:</strong></p>' +
    '<p style="white-space:pre-wrap">' + esc(mensagem) + '</p>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: email,
        subject: 'Contato pelo site - ' + nome,
        html: html,
      }),
    });
    if (!r.ok) return json({ ok: false, error: 'send' }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'send' }, 502);
  }
}
