// Vercel Cron Job — roda todo dia às 07:00 BRT (10:00 UTC)
// Revalida o cache da Edge Function /api/news

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Vercel envia o header x-vercel-cron nas chamadas de cron
  const isCron   = req.headers.get('x-vercel-cron') === '1';
  const authHeader = req.headers.get('authorization');
  const cronSecret = typeof CRON_SECRET !== 'undefined' ? CRON_SECRET : '';

  // Aceita: chamada de cron da Vercel OU autorização manual com secret
  if (!isCron && cronSecret && authHeader !== 'Bearer ' + cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Força revalidação chamando /api/news com cache bypass
    const base = req.url.replace('/api/cron-news', '');
    const res  = await fetch(base + '/api/news', {
      headers: { 'Cache-Control': 'no-cache', 'pragma': 'no-cache' },
      signal: AbortSignal.timeout(25000),
    });

    const data = await res.json();
    const count = data.feeds?.reduce((a, f) => a + (f.items?.length || 0), 0) || 0;

    return new Response(JSON.stringify({
      ok: true,
      message: 'Feed atualizado',
      articles: count,
      sources: data.feeds?.length || 0,
      ts: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
