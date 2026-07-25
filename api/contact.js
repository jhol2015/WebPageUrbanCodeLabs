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
  return (typeof process !== 'undefined' && process.env && process.env[name]) || '';
}

function esc(s) {
  return String(s).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; });
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

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
        subject: 'Contato pelo site — ' + nome,
        html: html,
      }),
    });
    if (!r.ok) return json({ ok: false, error: 'send' }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'send' }, 502);
  }
}
