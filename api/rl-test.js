// Endpoint TEMPORARIO de diagnostico do rate-limit (Upstash).
// Nao envia e-mail. Usa uma chave de teste isolada (rl:test:<ip>), limite 3 / 60s,
// para voce ver o bloqueio rapido sem gastar o orcamento real do formulario.
// APAGUE este arquivo depois de validar (ou peca para eu remover).
export const config = { runtime: 'edge' };

function json(body, status) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

function env(name) {
  try { if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name]; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name]; } catch (e) {}
  return '';
}

const TEST_MAX = 3;      // bloqueia a partir da 4a chamada
const TEST_WINDOW = 60;  // janela de 60s (zera sozinho)

export default async function handler(req) {
  const url = env('UPSTASH_REDIS_REST_URL');
  const token = env('UPSTASH_REDIS_REST_TOKEN');

  if (!url || !token) {
    return json({
      configured: false,
      message: 'UPSTASH_REDIS_REST_URL/TOKEN nao estao setados nesta implantacao. O formulario segue em modo fail-open (funciona, mas sem limite). Configure as env vars na Vercel e faca redeploy.',
    }, 200);
  }

  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim() || 'unknown';
  const key = 'rl:test:' + ip;

  try {
    const r = await fetch(url.replace(/\/+$/, '') + '/pipeline', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(TEST_WINDOW), 'NX'],
        ['TTL', key],
      ]),
      signal: AbortSignal.timeout(3000),
    });

    if (!r.ok) {
      return json({ configured: true, upstashOk: false, status: r.status, message: 'Upstash respondeu com erro. Confira a URL e o token nas env vars.' }, 502);
    }

    const out = await r.json();
    const count = (out && out[0] && typeof out[0].result === 'number') ? out[0].result : 0;
    const ttl   = (out && out[2] && typeof out[2].result === 'number') ? out[2].result : -1;
    const blocked = count > TEST_MAX;

    return json({
      configured: true,
      upstashOk: true,
      ip: ip,
      testKey: key,
      count: count,
      limit: TEST_MAX,
      windowSeconds: TEST_WINDOW,
      ttlSeconds: ttl,
      blocked: blocked,
      message: blocked
        ? 'BLOQUEADO: ' + count + ' chamadas passaram do limite de ' + TEST_MAX + '. O rate-limit esta funcionando. Zera em ~' + ttl + 's.'
        : 'OK: chamada ' + count + ' de ' + TEST_MAX + '. Recarregue para incrementar; a partir da ' + (TEST_MAX + 1) + 'a deve bloquear (HTTP 429).',
    }, blocked ? 429 : 200);
  } catch (e) {
    return json({ configured: true, upstashOk: false, message: 'Falha ao falar com o Upstash (timeout ou rede).' }, 502);
  }
}
