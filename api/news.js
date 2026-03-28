export const config = { runtime: 'edge' };

// Proxies CORS testados em Vercel Edge — tentados em ordem
const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://cors.eu.org/${url}`,
];

const FEEDS = [
  { name: 'Hacker News',     color: '#f87171', url: 'https://news.ycombinator.com/rss' },
  { name: 'TechCrunch',      color: '#4f9ef8', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge',       color: '#7bb8ff', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Wired',           color: '#34d399', url: 'https://www.wired.com/feed/rss' },
  { name: 'MIT Tech Review', color: '#e8a320', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Ars Technica',    color: '#a78bfa', url: 'https://feeds.arstechnica.com/arstechnica/index' },
];

const HN_API = 'https://hacker-news.firebaseio.com/v0';

function decode(str) {
  return (str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, '').trim();
}

function parseDate(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
       /<guid[^>]*isPermaLink="true"[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i.exec(b) ||
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

// Hacker News via API oficial JSON (sem RSS, sem proxy)
async function fetchHN() {
  try {
    const topRes = await fetch(`${HN_API}/topstories.json`, { signal: AbortSignal.timeout(5000) });
    const ids = await topRes.json();
    const top10 = ids.slice(0, 10);
    const stories = await Promise.allSettled(
      top10.map(id =>
        fetch(`${HN_API}/item/${id}.json`, { signal: AbortSignal.timeout(4000) })
          .then(r => r.json())
      )
    );
    const items = stories
      .filter(r => r.status === 'fulfilled' && r.value?.url && r.value?.title)
      .slice(0, 6)
      .map(r => ({
        title: r.value.title,
        link: r.value.url,
        desc: `${r.value.score || 0} pontos · ${r.value.descendants || 0} comentários`,
        pubDate: parseDate(new Date(r.value.time * 1000).toISOString()),
      }));
    if (items.length) return { source: 'Hacker News', color: '#f87171', items };
  } catch {}
  return null;
}

async function fetchRSS(feed) {
  // Tenta direto primeiro
  const directHeaders = {
    'User-Agent': 'Mozilla/5.0 (compatible; UCLBot/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  };

  const attempts = [
    // 1. Direto
    () => fetch(feed.url, { headers: directHeaders, signal: AbortSignal.timeout(5000) }),
    // 2..N: proxies
    ...PROXIES.map(proxy => () =>
      fetch(proxy(feed.url), { headers: directHeaders, signal: AbortSignal.timeout(7000) })
    ),
  ];

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || text.trim().startsWith('{')) continue; // não é XML
      const items = extractItems(text, 6);
      if (items.length > 0) return { source: feed.name, color: feed.color, items };
    } catch { continue; }
  }
  return null;
}

export default async function handler() {
  // HN via API oficial, resto via RSS
  const rssFeeds = FEEDS.filter(f => f.name !== 'Hacker News');

  const [hnResult, ...rssResults] = await Promise.allSettled([
    fetchHN(),
    ...rssFeeds.map(fetchRSS),
  ]);

  const feeds = [hnResult, ...rssResults]
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  return new Response(JSON.stringify({ ok: true, feeds, ts: Date.now() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': 'same-origin',
    },
  });
}
