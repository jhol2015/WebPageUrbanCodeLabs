export const config = { runtime: 'edge' };

const FEEDS = [
  { name: 'TechCrunch',        url: 'https://techcrunch.com/feed/',                   color: '#4f9ef8' },
  { name: 'The Verge',         url: 'https://www.theverge.com/rss/index.xml',         color: '#7bb8ff' },
  { name: 'Wired',             url: 'https://www.wired.com/feed/rss',                 color: '#34d399' },
  { name: 'MIT Tech Review',   url: 'https://www.technologyreview.com/feed/',         color: '#e8a320' },
  { name: 'Hacker News',       url: 'https://hnrss.org/frontpage?count=10',           color: '#f87171' },
];

function decode(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseDate(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return str; }
}

function extractItems(xml, limit = 6) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1] || match[2];

    const title = decode(
      (/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(block) ||
       /<title[^>]*>([\s\S]*?)<\/title>/i.exec(block) || [])[1]
    );

    const link = decode(
      (/<link[^>]*href="([^"]+)"/i.exec(block) ||
       /<link[^>]*>(https?:\/\/[^\s<]+)<\/link>/i.exec(block) ||
       /<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/i.exec(block) || [])[1]
    );

    const desc = decode(
      (/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i.exec(block) ||
       /<description[^>]*>([\s\S]*?)<\/description>/i.exec(block) ||
       /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(block) || [])[1]
    ).slice(0, 140) + '...';

    const pubDate = parseDate(
      (/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(block) ||
       /<published[^>]*>([\s\S]*?)<\/published>/i.exec(block) ||
       /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(block) || [])[1]
    );

    if (title && link) items.push({ title, link, desc, pubDate });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCLNewsBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const items = extractItems(xml, 6);
    if (!items.length) return null;
    return { source: feed.name, color: feed.color, items };
  } catch { return null; }
}

export default async function handler() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const data = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  return new Response(JSON.stringify({ ok: true, feeds: data, ts: Date.now() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': 'same-origin',
    },
  });
}
