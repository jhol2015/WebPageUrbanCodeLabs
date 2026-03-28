export const config = { runtime: 'edge' };

const FEEDS = [
  { name: 'TechCrunch',      color: '#4f9ef8', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge',       color: '#7bb8ff', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Wired',           color: '#34d399', url: 'https://www.wired.com/feed/rss' },
  { name: 'MIT Tech Review', color: '#e8a320', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Hacker News',     color: '#f87171', url: 'https://hnrss.org/frontpage?count=10' },
];

const ALLORIGINS = 'https://api.allorigins.win/get?url=';

function decode(str) {
  return (str || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '').trim();
}

function parseDate(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function extractItems(xml, limit = 6) {
  const items = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const b = m[1] || m[2];
    const title = decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(b) || [])[1]);
    const link  = decode(
      (/<link[^>]*href="([^"]+)"/i.exec(b) ||
       /<link[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i.exec(b) ||
       /<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i.exec(b) || [])[1]
    );
    const desc = decode(
      (/<description[^>]*>([\s\S]*?)<\/description>/i.exec(b) ||
       /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(b) || [])[1]
    ).slice(0, 160);
    const pubDate = parseDate(
      (/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(b) ||
       /<published[^>]*>([\s\S]*?)<\/published>/i.exec(b) ||
       /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(b) || [])[1]
    );
    if (title && link) items.push({ title, link, desc, pubDate });
  }
  return items;
}

async function fetchFeed(feed) {
  const attempts = [
    // tentativa 1: direto
    () => fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCLBot/1.0; +https://urbancodelabs.com.br)' },
      signal: AbortSignal.timeout(6000),
    }),
    // tentativa 2: via allorigins proxy
    () => fetch(ALLORIGINS + encodeURIComponent(feed.url), {
      signal: AbortSignal.timeout(8000),
    }).then(async r => {
      const j = await r.json();
      return new Response(j.contents, { status: 200 });
    }),
  ];

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      if (!res.ok) continue;
      const xml = await res.text();
      const items = extractItems(xml, 6);
      if (items.length > 0) return { source: feed.name, color: feed.color, items };
    } catch { continue; }
  }
  return null;
}

export default async function handler() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const feeds = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  return new Response(JSON.stringify({ ok: true, feeds, ts: Date.now() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': 'same-origin',
    },
  });
}
