/**
 * BUILDER — Generates static HTML pages for the site.
 * Run: node scripts/builder.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { ARTICLES_FILE, PUBLIC_DIR, SITE_URL, TEMPLATE_FILE } from './config.mjs';
import { readJSON, today } from './utils.mjs';

// ─── Article page template ───
function articlePage(article, allArticles) {
  const related = allArticles
    .filter(a => a.slug !== article.slug && a.category === article.category)
    .slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${article.metaTitle || article.title} — SIGNAL</title>
<meta name="description" content="${article.metaDesc || article.dek || ''}">
<meta property="og:title" content="${article.metaTitle || article.title}">
<meta property="og:description" content="${article.metaDesc || article.dek || ''}">
<meta property="og:image" content="${SITE_URL}${article.image || '/images/default.jpg'}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE_URL}/articles/${article.slug}.html">
<link rel="canonical" href="${SITE_URL}/articles/${article.slug}.html">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": article.title,
  "description": article.metaDesc || article.dek,
  "image": SITE_URL + (article.image || '/images/default.jpg'),
  "datePublished": article.generated || article.published,
  "author": { "@type": "Organization", "name": "SIGNAL" },
  "publisher": { "@type": "Organization", "name": "SIGNAL" },
  "mainEntityOfPage": SITE_URL + '/articles/' + article.slug + '.html'
})}
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--card:#f6f2e7;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
.container{max-width:720px;margin:0 auto;padding:24px}
.breadcrumb{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-soft);margin-bottom:20px;letter-spacing:.04em}
.breadcrumb a{color:var(--ink-soft);text-decoration:none;border-bottom:1px solid transparent}
.breadcrumb a:hover{border-bottom-color:var(--signal)}
h1{font-family:'Fraunces',serif;font-size:36px;line-height:1.1;font-weight:600;margin:12px 0 16px}
.dek{font-size:18px;color:var(--ink-soft);margin-bottom:16px;line-height:1.5}
.meta-line{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--signal);margin-bottom:32px;display:flex;gap:16px;flex-wrap:wrap}
.article-hero{width:100%;aspect-ratio:16/9;object-fit:cover;border:1px solid var(--rule);margin-bottom:32px}
.article-body h2{font-family:'Fraunces',serif;font-size:24px;margin:32px 0 12px;font-weight:600}
.article-body h3{font-family:'Fraunces',serif;font-size:20px;margin:24px 0 10px;font-weight:600}
.article-body p{margin-bottom:16px;font-size:16px}
.article-body ul,.article-body ol{margin:0 0 16px 20px}
.article-body li{margin-bottom:6px;font-size:16px}
.article-body a{color:var(--signal);text-decoration:none;border-bottom:1px solid var(--signal)}
.related{margin-top:48px;padding-top:32px;border-top:2px solid var(--ink)}
.related h2{font-family:'Fraunces',serif;font-size:22px;margin-bottom:16px}
.related-list{display:flex;flex-direction:column;gap:16px}
.related-item a{color:var(--ink);text-decoration:none}
.related-item h3{font-family:'Fraunces',serif;font-size:17px;font-weight:600}
.related-item p{font-size:13px;color:var(--ink-soft)}
.back-link{display:inline-block;margin-top:32px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--signal);text-decoration:none;border-bottom:1px solid var(--signal)}
footer{text-align:center;padding:40px 24px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule);margin-top:48px}
</style>
</head>
<body>
<div class="container">
<div class="breadcrumb"><a href="/">← SIGNAL</a> / <a href="/#feed">Articles</a> / ${article.category || 'AI'}</div>
${article.image ? `<img class="article-hero" src="${article.image}" alt="${article.title}">` : ''}
<h1>${article.title}</h1>
${article.dek ? `<p class="dek">${article.dek}</p>` : ''}
<div class="meta-line">
<span>${new Date(article.generated || Date.now()).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
<span>${article.wordCount || '—'} WORDS</span>
<span>${(article.affiliates || []).length} TOOL LINKS</span>
<span>${article.sourceName || 'SIGNAL'}</span>
</div>
<div class="article-body">
${article.body}
</div>
${related.length ? `
<div class="related">
<h2>Related</h2>
<div class="related-list">
${related.map(r => `
<div class="related-item">
<a href="/articles/${r.slug}.html">
<h3>${r.title}</h3>
<p>${r.dek || ''}</p>
</a>
</div>
`).join('')}
</div>
</div>` : ''}
<a class="back-link" href="/">← Back to SIGNAL</a>
</div>
<footer>SIGNAL — AI tools, tracked daily. Hunted, verified, written.</footer>
</body>
</html>`;
}

// ─── Homepage template ───
function homepage(articles) {
  const published = articles
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.generated || 0) - new Date(a.generated || 0));

  const tickerItems = published.slice(0, 5).map(a =>
    `NEW: ${a.title.substring(0, 50)}`
  ).join(' <span>//</span> ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SIGNAL — AI Tools Intelligence</title>
<meta name="description" content="AI tools, tracked daily. Hunted, verified, written.">
<meta property="og:title" content="SIGNAL — AI Tools Intelligence">
<meta property="og:description" content="AI tools, tracked daily. Hunted, verified, written.">
<link rel="canonical" href="${SITE_URL}">
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--paper-dim:#e4dcc9;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--signal-dim:#d98f6c;--live:#2f6b4f;--card:#f6f2e7}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.ticker-wrap{background:var(--ink);color:var(--paper);overflow:hidden;white-space:nowrap;border-bottom:1px solid #000;position:relative}
.ticker-wrap::before{content:"● LIVE HUNT";position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;padding:0 14px;background:var(--live);color:#eef7ee;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;z-index:2}
.ticker-track{display:inline-block;padding-left:150px;animation:scroll 32s linear infinite;font-family:'JetBrains Mono',monospace;font-size:12.5px;padding-top:9px;padding-bottom:9px;letter-spacing:.02em}
.ticker-track span{color:var(--signal-dim);margin:0 10px}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
header.site{max-width:1080px;margin:0 auto;padding:36px 24px 22px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink)}
.wordmark{font-family:'Fraunces',serif;font-weight:700;font-size:34px;letter-spacing:-0.01em}
.wordmark span{color:var(--signal)}
.tagline{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-soft);letter-spacing:.06em;margin-top:4px}
nav.top{font-family:'JetBrains Mono',monospace;font-size:12px}
nav.top a{color:var(--ink);text-decoration:none;margin-left:18px;border-bottom:1px solid transparent}
nav.top a:hover{border-bottom:1px solid var(--signal)}
main{max-width:1080px;margin:0 auto;padding:40px 24px 80px;display:grid;grid-template-columns:1fr 300px;gap:48px}
.entry-num{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--signal);letter-spacing:.08em}
h1.hero{font-family:'Fraunces',serif;font-size:44px;line-height:1.05;font-weight:600;margin:10px 0 14px;max-width:9.5em}
.hero-dek{color:var(--ink-soft);font-size:16px;max-width:38em;line-height:1.55;margin-bottom:18px}
.hero-meta{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--ink-soft);display:flex;gap:16px;margin-bottom:30px}
.feed{display:flex;flex-direction:column}
.card{display:grid;grid-template-columns:70px 1fr;gap:18px;padding:22px 0;border-top:1px solid var(--rule);text-decoration:none;color:var(--ink)}
.card:first-child{border-top:2px solid var(--ink)}
.card:hover{opacity:.85}
.card .idx{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-soft);padding-top:4px}
.card .tag{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;padding:2px 7px;border:1px solid var(--ink);border-radius:2px;margin-bottom:8px;color:var(--ink)}
.card h3{font-family:'Fraunces',serif;font-size:21px;font-weight:600;line-height:1.25;margin-bottom:6px}
.card p{color:var(--ink-soft);font-size:14px;line-height:1.55;max-width:44em}
.card .meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--signal);margin-top:8px}
aside{font-family:'JetBrains Mono',monospace}
.panel{background:var(--card);border:1px solid var(--rule);padding:18px;margin-bottom:20px}
.panel h4{font-family:'Inter';font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);margin-bottom:12px;font-weight:600}
.stat-row{display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--rule)}
.stat-row:last-child{border-bottom:none}
.stat-row b{color:var(--ink)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--live);display:inline-block;margin-right:6px;animation:pulse 1.6s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
footer{text-align:center;padding:26px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule)}
@media(max-width:760px){main{grid-template-columns:1fr}h1.hero{font-size:32px}}
</style>
</head>
<body>
<div class="ticker-wrap"><div class="ticker-track">${tickerItems} <span>//</span> ${tickerItems} <span>//</span></div></div>
<header class="site">
<div>
<div class="wordmark">SIGNAL<span>.</span></div>
<div class="tagline">AI TOOLS, TRACKED DAILY — HUNTED, VERIFIED, WRITTEN</div>
</div>
<nav class="top">
<a href="/">Home</a>
<a href="#feed">Articles</a>
<a href="/sitemap.xml">Sitemap</a>
</nav>
</header>
<main>
<div>
<div class="entry-num">FIELD REPORT — ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }).toUpperCase()}</div>
<h1 class="hero">What launched in AI this week, sorted by what's actually worth your time.</h1>
<p class="hero-dek">Every entry below started as a raw signal picked up from a release note, a changelog, or a product page — then reviewed before it went live.</p>
<div class="hero-meta">
<span>${published.length} ARTICLES</span>
<span>UPDATED ${new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}</span>
</div>
<div class="feed" id="feed">
${published.slice(0, 20).map((a, i) => `
<a class="card" href="/articles/${a.slug}.html">
<div class="idx">${String(i + 1).padStart(2, '0')}</div>
<div>
<span class="tag">${(a.category || 'AI').toUpperCase()}</span>
<h3>${a.title}</h3>
<p>${a.dek || ''}</p>
<div class="meta">→ ${a.wordCount || '—'} words · ${(a.affiliates || []).length} tool links</div>
</div>
</a>
`).join('')}
</div>
</div>
<aside>
<div class="panel">
<h4>Archive Stats</h4>
<div class="stat-row"><span><span class="dot"></span>Status</span><b>Live</b></div>
<div class="stat-row"><span>Total articles</span><b>${published.length}</b></div>
<div class="stat-row"><span>Last published</span><b>${published[0] ? new Date(published[0].generated).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : '—'}</b></div>
<div class="stat-row"><span>Categories</span><b>${new Set(published.map(a => a.category)).size}</b></div>
</div>
<div class="panel">
<h4>Categories</h4>
${[...new Set(published.map(a => a.category))].map(cat => {
  const count = published.filter(a => a.category === cat).length;
  return `<div class="stat-row"><span>${(cat || 'other').toUpperCase()}</span><b>${count}</b></div>`;
}).join('')}
</div>
</aside>
</main>
<footer>SIGNAL — a self-hunting AI tools archive. Built and reviewed before publish.</footer>
</body>
</html>`;
}

// ─── Sitemap generator ───
function generateSitemap(articles) {
  const published = articles.filter(a => a.status === 'published');
  const urls = [
    { loc: SITE_URL, changefreq: 'daily', priority: '1.0' },
    ...published.map(a => ({
      loc: `${SITE_URL}/articles/${a.slug}.html`,
      lastmod: (a.generated || '').substring(0, 10),
      changefreq: 'monthly',
      priority: '0.7'
    }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

// ─── robots.txt ───
const ROBOTS = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml

User-agent: GPTBot
Disallow: /`;

// ─── Build all ───
export async function build() {
  const articles = await readJSON(ARTICLES_FILE);
  const published = articles.filter(a => a.status === 'published');

  console.log(`\n🏗  BUILD — ${published.length} published articles\n`);

  // Ensure directories
  await fs.mkdir(path.join(PUBLIC_DIR, 'articles'), { recursive: true });

  // 1. Homepage
  await fs.writeFile(path.join(PUBLIC_DIR, 'index.html'), homepage(articles));
  console.log('  ✓ index.html');

  // 2. Article pages
  for (const article of published) {
    const html = articlePage(article, published);
    await fs.writeFile(
      path.join(PUBLIC_DIR, 'articles', `${article.slug}.html`),
      html
    );
    console.log(`  ✓ articles/${article.slug}.html`);
  }

  // 3. Sitemap
  await fs.writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), generateSitemap(articles));
  console.log('  ✓ sitemap.xml');

  // 4. robots.txt
  await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), ROBOTS);
  console.log('  ✓ robots.txt');

  console.log('\n✅ Build complete.\n');
}

// Run standalone
if (process.argv[1]?.endsWith('builder.mjs')) {
  build().catch(console.error);
}
