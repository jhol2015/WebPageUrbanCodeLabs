export const config = { runtime: 'edge' };

const FEEDS = [
  // BR
  { name: 'Tecnoblog',     color: '#00c97a', url: 'https://tecnoblog.net/feed/' },
  { name: 'Canaltech',     color: '#0099e6', url: 'https://canaltech.com.br/rss/' },
  { name: 'TechTudo',      color: '#e63946', url: 'https://www.techtudo.com.br/rss/feeds/news.xml' },
  { name: 'Olhar Digital', color: '#f4a522', url: 'https://olhardigital.com.br/feed/' },
  // Global
  { name: 'TechCrunch',      color: '#4f9ef8', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge',       color: '#7bb8ff', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Wired',           color: '#34d399', url: 'https://www.wired.com/feed/rss' },
  { name: 'MIT Tech Review', color: '#e8a320', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Ars Technica',    color: '#a78bfa', url: 'https://feeds.arstechnica.com/arstechnica/index' },
];

const PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

const HN_API = 'https://hacker-news.firebaseio.com/v0';

function decode(s) {
  return (s||'')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'")
    .replace(/<[^>]+>/g,'').trim();
}

function parseDate(s) {
  if (!s) return '';
  try { const d=new Date(s); return isNaN(d)?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return ''; }
}

function extractItems(xml, limit=5) {
  const items=[], re=/<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m=re.exec(xml))!==null && items.length<limit) {
    const b=m[1]||m[2];
    const title=decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(b)||[])[1]);
    const link=decode(
      (/<link[^>]*href="([^"]+)"/i.exec(b)||
       /<link[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i.exec(b)||
       /<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i.exec(b)||[])[1]
    );
    const desc=decode((/<description[^>]*>([\s\S]*?)<\/description>/i.exec(b)||/<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(b)||[])[1]).slice(0,140);
    const pubDate=parseDate((/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(b)||/<published[^>]*>([\s\S]*?)<\/published>/i.exec(b)||/<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(b)||[])[1]);
    if (title&&link) items.push({title,link,desc,pubDate});
  }
  return items;
}

async function fetchRSS(feed) {
  const hdrs={'User-Agent':'Mozilla/5.0 (compatible; UCLBot/1.0)','Accept':'application/rss+xml,application/xml,text/xml,*/*'};
  // tenta direto e proxies com timeout curto
  const attempts=[
    ()=>fetch(feed.url,{headers:hdrs,signal:AbortSignal.timeout(3500)}),
    ...PROXIES.map(p=>()=>fetch(p(feed.url),{headers:hdrs,signal:AbortSignal.timeout(4000)})),
  ];
  for (const attempt of attempts) {
    try {
      const res=await attempt();
      if (!res.ok) continue;
      const text=await res.text();
      if (!text||text.trim().startsWith('{')) continue;
      const items=extractItems(text,5);
      if (items.length) return {source:feed.name,color:feed.color,items};
    } catch { continue; }
  }
  return null; // retorna null — frontend oculta o filtro automaticamente
}

async function fetchHN() {
  try {
    const res=await fetch(`${HN_API}/topstories.json`,{signal:AbortSignal.timeout(3500)});
    const ids=(await res.json()).slice(0,8);
    const rows=await Promise.allSettled(
      ids.map(id=>fetch(`${HN_API}/item/${id}.json`,{signal:AbortSignal.timeout(3000)}).then(r=>r.json()))
    );
    const items=rows
      .filter(r=>r.status==='fulfilled'&&r.value?.url&&r.value?.title)
      .slice(0,5)
      .map(r=>({
        title:r.value.title,link:r.value.url,
        desc:`${r.value.score||0} pontos · ${r.value.descendants||0} comentários`,
        pubDate:parseDate(new Date(r.value.time*1000).toISOString()),
      }));
    if (items.length) return {source:'Hacker News',color:'#f87171',items};
  } catch {}
  return null;
}

export default async function handler() {
  // Tudo em paralelo — nenhum feed bloqueia outro
  const results = await Promise.allSettled([
    fetchHN(),
    ...FEEDS.map(fetchRSS),
  ]);

  const feeds = results
    .filter(r=>r.status==='fulfilled'&&r.value)
    .map(r=>r.value);

  // Lista de fontes que retornaram dados (para o frontend ocultar filtros vazios)
  const activeSources = feeds.map(f=>f.source);

  return new Response(JSON.stringify({ok:true, feeds, activeSources, ts:Date.now()}), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': 'same-origin',
    },
  });
}
