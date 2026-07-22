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
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${article.metaTitle || article.title} — SIGNAL</title>
<meta name="description" content="${article.metaDesc || article.dek || ''}">
<meta property="og:title" content="${article.metaTitle || article.title}">
<meta property="og:description" content="${article.metaDesc || article.dek || ''}">
<meta property="og:image" content="${SITE_URL}${article.image || '/branding/og-image.png'}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE_URL}/articles/${article.slug}.html">
<link rel="canonical" href="${SITE_URL}/articles/${article.slug}.html">
<meta name="keywords" content="${(article.tags || []).join(', ')}, AI tools, artificial intelligence, ${article.category || 'tech'}">
<meta name="author" content="SIGNAL">
<meta name="robots" content="index, follow">
<meta property="og:site_name" content="SIGNAL">
<meta property="article:published_time" content="${article.generated || ''}">
<meta property="article:section" content="${article.category || 'AI'}">
<meta property="article:tag" content="${(article.tags || []).join(', ')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${article.metaTitle || article.title}">
<meta name="twitter:description" content="${article.metaDesc || article.dek || ''}">
<meta name="twitter:image" content="${SITE_URL}${article.image || '/branding/og-image.png'}">
<meta name="news_keywords" content="${(article.tags || []).join(', ')}, AI tools, artificial intelligence">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="SIGNAL">
<link rel="alternate" type="application/rss+xml" title="SIGNAL RSS" href="${SITE_URL}/feed.xml">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": article.title,
  "description": article.metaDesc || article.dek,
  "image": SITE_URL + (article.image || '/branding/og-image.png'),
  "datePublished": article.generated || article.published,
  "dateModified": article.lastRefresh || article.generated || article.published,
  "author": { "@type": "Organization", "name": "SIGNAL" },
  "publisher": { "@type": "Organization", "name": "SIGNAL" },
  "mainEntityOfPage": SITE_URL + '/articles/' + article.slug + '.html'
})}
</script>
${article.faq ? `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": ${JSON.stringify(article.faq.map(q => ({
    "@type": "Question",
    "name": q.question,
    "acceptedAnswer": {"@type": "Answer", "text": q.answer}
  })))}
}
</script>` : ''}
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
.share-section{margin-top:40px;padding-top:24px;border-top:1px solid var(--rule)}
.share-label{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-soft);letter-spacing:.06em;margin-bottom:12px}
.share-buttons{display:flex;gap:10px;flex-wrap:wrap}
.share-btn{display:inline-block;padding:8px 16px;font-family:'JetBrains Mono',monospace;font-size:12px;text-decoration:none;border:1px solid var(--rule);border-radius:3px;color:var(--ink);transition:all .2s}
.share-btn:hover{background:var(--ink);color:var(--paper)}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:100}
body.dark{--paper:#1a1a2e;--paper-dim:#16213e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
.reading-progress{position:fixed;top:0;left:0;width:0;height:3px;background:var(--signal);z-index:999;transition:width .1s}
.card{opacity:0;transform:translateY(16px);animation:cardIn .6s ease forwards}
.card:nth-child(1){animation-delay:.05s}.card:nth-child(2){animation-delay:.1s}.card:nth-child(3){animation-delay:.15s}
@keyframes cardIn{to{opacity:1;transform:translateY(0)}}
.card{transition:transform .25s ease,box-shadow .25s ease}
.card:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,0,0,.08)}
.badge-new{display:inline-block;background:var(--signal);color:#fff;font-family:'JetBrains Mono',monospace;font-size:9px;padding:2px 6px;border-radius:2px;letter-spacing:.06em;vertical-align:middle;margin-left:6px}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:44px;height:44px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;z-index:100;transition:all .2s}
.dark-toggle:hover{transform:scale(1.1);border-color:var(--signal)}
.search-box{margin:16px 0;padding:10px 16px;border:1px solid var(--rule);border-radius:4px;background:var(--paper);font-family:'JetBrains Mono',monospace;font-size:13px;width:100%;color:var(--ink)}
.search-box:focus{outline:none;border-color:var(--signal)}
.tag-filter{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.tag-btn{padding:4px 12px;border:1px solid var(--rule);border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;background:transparent;color:var(--ink-soft);transition:all .2s}
.tag-btn:hover,.tag-btn.active{background:var(--signal);color:#fff;border-color:var(--signal)}


/* === 3D LOGO === */
.logo-3d{
  font-family:'Fraunces',serif;font-size:48px;font-weight:700;
  background:linear-gradient(135deg,#b8481e,#e07040,#b8481e);
  background-size:200% 200%;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
  animation:logoShimmer 3s ease infinite, logoFloat 4s ease-in-out infinite;
  display:inline-block;transform-style:preserve-3d;perspective:500px;
}
@keyframes logoShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes logoFloat{0%,100%{transform:translateY(0) rotateX(0)}25%{transform:translateY(-4px) rotateX(2deg)}50%{transform:translateY(0)}75%{transform:translateY(-2px) rotateX(-1deg)}}

/* === SMOOTH TRANSITIONS === */
.page-enter{opacity:0;transform:translateY(20px)}
.page-visible{opacity:1;transform:translateY(0);transition:all .6s cubic-bezier(.4,0,.2,1)}
html{scroll-behavior:smooth}

/* === RIPPLE EFFECT === */
.ripple{position:relative;overflow:hidden}
.ripple::after{content:'';position:absolute;width:100%;height:100%;top:0;left:0;background:radial-gradient(circle,rgba(184,72,30,.3) 10%,transparent 10.01%);background-repeat:no-repeat;background-position:50%;transform:scale(10);opacity:0;transition:transform .5s,opacity .5s}
.ripple:active::after{transform:scale(0);opacity:1;transition:0s}

/* === CARD MODERN === */
.card{
  background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:20px;margin-bottom:16px;
  transition:all .3s cubic-bezier(.4,0,.2,1);transform:translateY(0);box-shadow:0 1px 3px rgba(0,0,0,0);
}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(28,43,37,.12);border-color:var(--signal)}

/* === GLASSMORPHISM NAV === */
nav{
  background:rgba(239,233,220,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid var(--rule);position:sticky;top:0;z-index:50;transition:all .3s;
}
nav.scrolled{box-shadow:0 2px 12px rgba(0,0,0,.08)}

/* === SMOOTH LINKS === */
a{transition:color .2s,border-color .2s}
a:hover{color:var(--signal)}

/* === ARTICLE ANIMATION === */
.article-body{animation:fadeUp .6s ease forwards}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* === TICKER === */
.ticker-wrap{overflow:hidden;padding:8px 0;background:linear-gradient(90deg,var(--ink),var(--ink-soft),var(--ink));color:var(--paper);font-family:'JetBrains Mono',monospace;font-size:11px}
.ticker-content{display:flex;gap:24px;white-space:nowrap;animation:scroll 30s linear infinite}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* === BUTTON === */
.btn{display:inline-block;padding:10px 24px;background:var(--signal);color:#fff;font-family:'JetBrains Mono',monospace;font-size:13px;border:none;border-radius:4px;cursor:pointer;transition:all .2s;transform:translateY(0)}
.btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(184,72,30,.3)}
.btn:active{transform:translateY(0)}

/* === SKELETON === */
.skeleton{background:linear-gradient(90deg,var(--card) 25%,var(--paper) 50%,var(--card) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px;height:20px;margin-bottom:8px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* === SCROLL INDICATOR === */
.scroll-indicator{width:100%;text-align:center;padding:16px;animation:bounce 2s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}

/* === FOOTER MODERN === */
footer{background:var(--ink);color:var(--paper);padding:48px 24px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:11px}
footer a{color:var(--signal);border-bottom:1px solid transparent}
footer a:hover{border-bottom-color:var(--signal)}

</head>
<body>
<div class="container">
<div class="breadcrumb"><a href="/">← SIGNAL</a> / <a href="/#feed">Articles</a> / ${article.category || 'AI'}</div>
${article.image ? `<img class="article-hero" src="${article.image}" alt="${article.title}">` : ''}
<h1>${article.title}</h1>
${article.dek ? `<p class="dek">${article.dek}</p>` : ''}
<div class="meta-line">
<span>${new Date(article.generated || Date.now()).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
${article.lastRefresh ? `<span>Updated: ${new Date(article.lastRefresh).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>` : ''}
<span>${article.wordCount || '—'} WORDS</span>
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
<div class="share-section">
<p class="share-label">SHARE THIS ARTICLE</p>
<div class="share-buttons">
<a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}" target="_blank" rel="noopener" class="share-btn twitter">Twitter</a>
<a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}" target="_blank" rel="noopener" class="share-btn linkedin">LinkedIn</a>
<a href="https://news.ycombinator.com/submitlink?u=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}&t=${encodeURIComponent(article.title)}" target="_blank" rel="noopener" class="share-btn hn">Hacker News</a>
<a href="https://www.reddit.com/submit?url=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}&title=${encodeURIComponent(article.title)}" target="_blank" rel="noopener" class="share-btn reddit">Reddit</a>
</div>
</div>
${article.faq ? `
<div style="margin:32px 0;padding:20px;background:var(--card);border:1px solid var(--rule);border-radius:4px;">
  <h3 style="font-family:'Fraunces',serif;font-size:18px;margin-bottom:16px;">Frequently Asked Questions</h3>
  ${article.faq.map(q => `
    <details style="margin-bottom:12px;">
      <summary style="font-weight:600;cursor:pointer;font-size:15px;">${q.question}</summary>
      <p style="margin:8px 0 0;color:var(--ink-soft);font-size:14px;">${q.answer}</p>
    </details>
  `).join('')}
</div>` : ''}
<div class="share-section">
  <div class="share-label">SHARE THIS</div>
  <div class="share-buttons">
    <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}" target="_blank">Twitter</a>
    <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}" target="_blank">LinkedIn</a>
    <a class="share-btn" href="https://news.ycombinator.com/submitlink?u=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}&t=${encodeURIComponent(article.title)}" target="_blank">HN</a>
    <a class="share-btn" href="https://www.reddit.com/submit?url=${encodeURIComponent(SITE_URL + '/articles/' + article.slug + '.html')}&title=${encodeURIComponent(article.title)}" target="_blank">Reddit</a>
  </div>
</div>
<a class="back-link" href="/">← Back to SIGNAL</a>
</div>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))" title="Toggle dark mode">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — AI tools, tracked daily. Hunted, verified, written.</footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>

<div class="reading-progress" id="readingProgress"></div>
<script>
// 3D Logo
document.querySelectorAll('h1').forEach(h=>{if(h.textContent.includes('SIGNAL'))h.classList.add('logo-3d')});

// Page enter animation
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.container > *').forEach((el,i)=>{
    el.classList.add('page-enter');
    setTimeout(()=>el.classList.add('page-visible'),i*50);
  });
});

// Sticky nav
window.addEventListener('scroll',()=>{const n=document.querySelector('nav');if(n)n.classList.toggle('scrolled',window.scrollY>10)});

// Ripple on cards
document.querySelectorAll('.card').forEach(c=>c.classList.add('ripple'));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});
});

// Reading progress
window.addEventListener('scroll',()=>{const b=document.getElementById('readingProgress');if(!b)return;const h=document.documentElement.scrollHeight-window.innerHeight;b.style.width=(window.scrollY/h*100)+'%'});

// Dark mode
const toggle=document.querySelector('.dark-toggle');
if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}

// Intersection Observer
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';x.target.classList.add('page-visible');obs.unobserve(x.target)}})},{threshold:.1});
document.querySelectorAll('.card,.article-body').forEach(el=>{el.style.animationPlayState='paused';obs.observe(el)});
</script>
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
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SIGNAL — AI Tools Intelligence</title>
<meta name="description" content="AI tools, tracked daily. Hunted, verified, written.">
<meta property="og:title" content="SIGNAL — AI Tools Intelligence">
<meta property="og:description" content="AI tools, tracked daily. Hunted, verified, written.">
<link rel="canonical" href="${SITE_URL}">
<link rel="alternate" type="application/rss+xml" title="SIGNAL RSS Feed" href="${SITE_URL}/feed.xml">
<meta name="keywords" content="AI tools, artificial intelligence, AI news, machine learning, LLM, GPT, Claude, Gemini, AI reviews">
<meta name="author" content="SIGNAL">
<meta name="robots" content="index, follow">
<meta property="og:site_name" content="SIGNAL">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE_URL}/branding/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SIGNAL — AI Tools Intelligence">
<meta name="twitter:description" content="AI tools, tracked daily. Hunted, verified, written.">
<meta name="twitter:image" content="${SITE_URL}/branding/og-image.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SIGNAL",
  "url": "${SITE_URL}",
  "description": "AI tools, tracked daily. Hunted, verified, written.",
  "publisher": {
    "@type": "Organization",
    "name": "SIGNAL"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "${SITE_URL}/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
${article.faq ? `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": ${JSON.stringify(article.faq.map(q => ({
    "@type": "Question",
    "name": q.question,
    "acceptedAnswer": {"@type": "Answer", "text": q.answer}
  })))}
}
</script>` : ''}
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
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:100}
body.dark{--paper:#1a1a2e;--paper-dim:#16213e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
.reading-progress{position:fixed;top:0;left:0;width:0;height:3px;background:var(--signal);z-index:999;transition:width .1s}
.card{opacity:0;transform:translateY(16px);animation:cardIn .6s ease forwards}
.card:nth-child(1){animation-delay:.05s}.card:nth-child(2){animation-delay:.1s}.card:nth-child(3){animation-delay:.15s}
@keyframes cardIn{to{opacity:1;transform:translateY(0)}}
.card{transition:transform .25s ease,box-shadow .25s ease}
.card:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,0,0,.08)}
.badge-new{display:inline-block;background:var(--signal);color:#fff;font-family:'JetBrains Mono',monospace;font-size:9px;padding:2px 6px;border-radius:2px;letter-spacing:.06em;vertical-align:middle;margin-left:6px}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:44px;height:44px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;z-index:100;transition:all .2s}
.dark-toggle:hover{transform:scale(1.1);border-color:var(--signal)}
.search-box{margin:16px 0;padding:10px 16px;border:1px solid var(--rule);border-radius:4px;background:var(--paper);font-family:'JetBrains Mono',monospace;font-size:13px;width:100%;color:var(--ink)}
.search-box:focus{outline:none;border-color:var(--signal)}
.tag-filter{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.tag-btn{padding:4px 12px;border:1px solid var(--rule);border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;background:transparent;color:var(--ink-soft);transition:all .2s}
.tag-btn:hover,.tag-btn.active{background:var(--signal);color:#fff;border-color:var(--signal)}

/* === 3D LOGO === */
.logo-3d{font-family:'Fraunces',serif;font-size:48px;font-weight:700;background:linear-gradient(135deg,#b8481e,#e07040,#b8481e);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:logoShimmer 3s ease infinite,logoFloat 4s ease-in-out infinite;display:inline-block}
@keyframes logoShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes logoFloat{0%,100%{transform:translateY(0)}25%{transform:translateY(-6px)}50%{transform:translateY(0)}75%{transform:translateY(-3px)}}
.reading-progress{position:fixed;top:0;left:0;width:0;height:3px;background:var(--signal);z-index:999;transition:width .1s}
html{scroll-behavior:smooth}
.card{transition:all .3s cubic-bezier(.4,0,.2,1)}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(28,43,37,.12)}
.ripple{position:relative;overflow:hidden}
.ripple:active::after{transform:scale(0);opacity:1;transition:0s}
nav{background:rgba(239,233,220,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--rule);position:sticky;top:0;z-index:50}
a{transition:color .2s}
a:hover{color:var(--signal)}
.page-enter{opacity:0;transform:translateY(20px)}
.page-visible{opacity:1;transform:translateY(0);transition:all .6s cubic-bezier(.4,0,.2,1)}

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
<a href="/about.html">About</a>
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
<div class="panel">
<h4>📡 Stay Updated</h4>
<p style="font-size:12px;color:var(--ink-soft);margin-bottom:10px">Get AI tools news delivered to your inbox.</p>
<form action="https://formspree.io/f/mojglbkd" method="POST" style="margin-bottom:12px">
<input type="email" name="email" placeholder="your@email.com" required style="width:100%;padding:8px 10px;border:1px solid var(--rule);border-radius:3px;font-family:'Inter',sans-serif;font-size:12px;background:var(--paper);margin-bottom:6px;box-sizing:border-box">
<button type="submit" style="width:100%;background:var(--signal);color:white;border:none;padding:8px;font-family:'JetBrains Mono',monospace;font-size:11px;border-radius:3px;cursor:pointer">Subscribe →</button>
</form>
<div style="display:flex;gap:6px;flex-wrap:wrap">
<a href="/feed.xml" style="display:inline-block;background:var(--ink);color:var(--paper);padding:6px 12px;font-family:'JetBrains Mono',monospace;font-size:10px;text-decoration:none;border-radius:3px">RSS</a>
<a href="https://x.com/_signalainews" target="_blank" rel="noopener" style="display:inline-block;background:var(--signal);color:white;padding:6px 12px;font-family:'JetBrains Mono',monospace;font-size:10px;text-decoration:none;border-radius:3px">𝕏 Twitter</a>
<a href="https://t.me/signal_ai_news" target="_blank" rel="noopener" style="display:inline-block;background:#0088cc;color:white;padding:6px 12px;font-family:'JetBrains Mono',monospace;font-size:10px;text-decoration:none;border-radius:3px">✈️ Telegram</a>
</div>
</div>
</aside>
</main>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))" title="Toggle dark mode">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — a self-hunting AI tools archive. Built and reviewed before publish.<br><a href="/privacy.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Privacy</a> · <a href="/terms.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Terms</a> · <a href="/about.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">About</a></footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>

<div class="reading-progress" id="readingProgress"></div>
<script>
// 3D Logo
document.querySelectorAll('h1').forEach(h=>{if(h.textContent.includes('SIGNAL'))h.classList.add('logo-3d')});
// Page enter animation
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.container > *, .card, .article-body').forEach((el,i)=>{
    el.classList.add('page-enter');
    setTimeout(()=>el.classList.add('page-visible'),i*80);
  });
});
// Sticky nav
window.addEventListener('scroll',()=>{const n=document.querySelector('nav');if(n)n.classList.toggle('scrolled',window.scrollY>10)});
// Ripple on cards
document.querySelectorAll('.card').forEach(c=>c.classList.add('ripple'));
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth',block:'start'})})});
// Reading progress
window.addEventListener('scroll',()=>{const b=document.getElementById('readingProgress');if(!b)return;const h=document.documentElement.scrollHeight-window.innerHeight;b.style.width=(window.scrollY/h*100)+'%'});
// Dark mode
const toggle=document.querySelector('.dark-toggle');
if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
// Search filter
const searchBox=document.querySelector('.search-box');
if(searchBox){searchBox.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.card').forEach(c=>{const t=c.textContent.toLowerCase();c.style.display=t.includes(q)?'':'none'})})}
// Tag filter
document.querySelectorAll('.tag-btn').forEach(btn=>{btn.addEventListener('click',()=>{const tag=btn.dataset.tag;btn.classList.toggle('active');document.querySelectorAll('.card').forEach(c=>{if(!tag||c.dataset.category===tag){c.style.display=''}else{c.style.display='none'}})})});
</script>


<div class="reading-progress" id="readingProgress"></div>
<script>
document.querySelectorAll('h1').forEach(function(h){if(h.textContent.includes('SIGNAL'))h.classList.add('logo-3d')});
document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.container > *, .card').forEach(function(el,i){el.classList.add('page-enter');setTimeout(function(){el.classList.add('page-visible')},i*80)})});
window.addEventListener('scroll',function(){var n=document.querySelector('nav');if(n)n.classList.toggle('scrolled',window.scrollY>10)});
document.querySelectorAll('.card').forEach(function(c){c.classList.add('ripple')});
window.addEventListener('scroll',function(){var b=document.getElementById('readingProgress');if(!b)return;var h=document.documentElement.scrollHeight-window.innerHeight;b.style.width=(window.scrollY/h*100)+'%'});
var toggle=document.querySelector('.dark-toggle');
if(toggle){toggle.addEventListener('click',function(){document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
</script>

</body>
</html>`;
}

// ─── About page ───
function aboutPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>About — SIGNAL</title>
<meta name="description" content="SIGNAL is a self-hunting AI tools archive that automatically discovers, writes, and publishes articles about AI tools.">
<link rel="canonical" href="${SITE_URL}/about.html">
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--card:#f6f2e7}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
.container{max-width:720px;margin:0 auto;padding:24px}
header.site{max-width:1080px;margin:0 auto;padding:36px 24px 22px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink)}
.wordmark{font-family:'Fraunces',serif;font-weight:700;font-size:34px;letter-spacing:-0.01em}
.wordmark span{color:var(--signal)}
nav.top{font-family:'JetBrains Mono',monospace;font-size:12px}
nav.top a{color:var(--ink);text-decoration:none;margin-left:18px;border-bottom:1px solid transparent}
nav.top a:hover{border-bottom:1px solid var(--signal)}
h1{font-family:'Fraunces',serif;font-size:36px;line-height:1.15;margin:32px 0 20px}
h2{font-family:'Fraunces',serif;font-size:24px;margin:32px 0 12px}
p{margin-bottom:16px;color:var(--ink-soft);font-size:16px}
.highlight{background:var(--card);border:1px solid var(--rule);padding:20px;border-radius:4px;margin:24px 0}
footer{text-align:center;padding:26px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule)}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:100}
body.dark{--paper:#1a1a2e;--paper-dim:#16213e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
.reading-progress{position:fixed;top:0;left:0;width:0;height:3px;background:var(--signal);z-index:999;transition:width .1s}
.card{opacity:0;transform:translateY(16px);animation:cardIn .6s ease forwards}
.card:nth-child(1){animation-delay:.05s}.card:nth-child(2){animation-delay:.1s}.card:nth-child(3){animation-delay:.15s}
@keyframes cardIn{to{opacity:1;transform:translateY(0)}}
.card{transition:transform .25s ease,box-shadow .25s ease}
.card:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,0,0,.08)}
.badge-new{display:inline-block;background:var(--signal);color:#fff;font-family:'JetBrains Mono',monospace;font-size:9px;padding:2px 6px;border-radius:2px;letter-spacing:.06em;vertical-align:middle;margin-left:6px}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:44px;height:44px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;z-index:100;transition:all .2s}
.dark-toggle:hover{transform:scale(1.1);border-color:var(--signal)}
.search-box{margin:16px 0;padding:10px 16px;border:1px solid var(--rule);border-radius:4px;background:var(--paper);font-family:'JetBrains Mono',monospace;font-size:13px;width:100%;color:var(--ink)}
.search-box:focus{outline:none;border-color:var(--signal)}
.tag-filter{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.tag-btn{padding:4px 12px;border:1px solid var(--rule);border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;background:transparent;color:var(--ink-soft);transition:all .2s}
.tag-btn:hover,.tag-btn.active{background:var(--signal);color:#fff;border-color:var(--signal)}
</style>
</head>
<body>
<header class="site">
<div><div class="wordmark">SIGNAL<span>.</span></div></div>
<nav class="top">
<a href="/">Home</a>
<a href="/about.html">About</a>
<a href="/sitemap.xml">Sitemap</a>
</nav>
</header>
<div class="container">
<h1>About SIGNAL</h1>
<p>SIGNAL is a self-hunting AI tools archive. It automatically discovers, writes, and publishes articles about AI tools — so you don't have to dig through dozens of blogs and changelogs.</p>

<h2>How it works</h2>
<div class="highlight">
<p><strong>RSS Sources → Hunter → Generator → Quality Gate → Builder → Publish</strong></p>
<p>Every 30 minutes, SIGNAL scans 22+ RSS feeds from top AI sources. When it finds something relevant, it generates an article, checks quality, and publishes it automatically.</p>
</div>

<h2>What makes it different</h2>
<p>Every article starts as a raw signal from a release note, changelog, or product page. SIGNAL doesn't just aggregate — it writes original articles with context and analysis.</p>

<h2>Technology</h2>
<p>SIGNAL runs on GitHub Actions with Groq for article generation and Vercel for hosting. The entire pipeline is automated — from discovery to publication.</p>

<h2>Contact</h2>
<p>Questions or feedback? Reach us at <a href="mailto:signalcompany.inc@gmail.com">signalcompany.inc@gmail.com</a> or open an issue on <a href="https://github.com/signal-ai-news/signal">GitHub</a>.</p>
</div>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))" title="Toggle dark mode">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — a self-hunting AI tools archive. Built and reviewed before publish.<br><a href="/privacy.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Privacy</a> · <a href="/terms.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Terms</a></footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>
</body>
</html>`;
}

// ─── Privacy Policy page ───
function privacyPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Privacy Policy — SIGNAL</title>
<meta name="description" content="Privacy Policy for SIGNAL AI Tools Intelligence.">
<link rel="canonical" href="${SITE_URL}/privacy.html">
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--card:#f6f2e7}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
.container{max-width:720px;margin:0 auto;padding:24px}
header.site{max-width:1080px;margin:0 auto;padding:36px 24px 22px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink)}
.wordmark{font-family:'Fraunces',serif;font-weight:700;font-size:34px}
.wordmark span{color:var(--signal)}
nav.top{font-family:'JetBrains Mono',monospace;font-size:12px}
nav.top a{color:var(--ink);text-decoration:none;margin-left:18px}
h1{font-family:'Fraunces',serif;font-size:36px;margin:32px 0 20px}
h2{font-family:'Fraunces',serif;font-size:24px;margin:32px 0 12px}
p{margin-bottom:16px;color:var(--ink-soft);font-size:16px}
footer{text-align:center;padding:26px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule)}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
body.dark{--paper:#1a1a2e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
</style>
</head>
<body>
<header class="site">
<div><div class="wordmark">SIGNAL<span>.</span></div></div>
<nav class="top"><a href="/">Home</a><a href="/about.html">About</a><a href="/privacy.html">Privacy</a></nav>
</header>
<div class="container">
<h1>Privacy Policy</h1>
<p>Last updated: July 2026</p>

<h2>Information We Collect</h2>
<p>SIGNAL automatically collects and publishes publicly available information about AI tools from RSS feeds, changelogs, and product pages. We do not collect personal information from visitors unless you voluntarily provide it (e.g., via email contact).</p>

<h2>Cookies and Analytics</h2>
<p>We may use cookies and analytics tools to understand how visitors use our site. You can control cookie settings through your browser preferences.</p>

<h2>Third-Party Services</h2>
<p>We use the following third-party services:</p>
<p>• <strong>Google AdSense</strong> — For displaying advertisements. Google may use cookies to serve ads based on your prior visits to our site or other sites.</p>
<p>• <strong>Vercel</strong> — For hosting our website.</p>
<p>• <strong>GitHub</strong> — For source code hosting and CI/CD.</p>

<h2>Advertising</h2>
<p>Google AdSense may use DART cookies to serve ads. You may opt out of the use of the DART cookie by visiting the <a href="https://www.google.com/policies/technologies/ads/">Google Ad and Content Network Privacy Policy</a>.</p>

<h2>Data Sharing</h2>
<p>We do not sell, trade, or otherwise transfer your personal information to outside parties.</p>

<h2>Contact</h2>
<p>For privacy-related inquiries, contact us at <a href="mailto:signalcompany.inc@gmail.com">signalcompany.inc@gmail.com</a>.</p>
</div>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — AI Tools Intelligence<br><a href="/privacy.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Privacy</a> · <a href="/terms.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Terms</a> · <a href="https://x.com/_signalainews" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">𝕏</a> · <a href="https://t.me/signal_ai_news" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Telegram</a></footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>
</body>
</html>`;
}

// ─── Terms of Service page ───
function termsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Terms of Service — SIGNAL</title>
<meta name="description" content="Terms of Service for SIGNAL AI Tools Intelligence.">
<link rel="canonical" href="${SITE_URL}/terms.html">
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--card:#f6f2e7}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
.container{max-width:720px;margin:0 auto;padding:24px}
header.site{max-width:1080px;margin:0 auto;padding:36px 24px 22px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink)}
.wordmark{font-family:'Fraunces',serif;font-weight:700;font-size:34px}
.wordmark span{color:var(--signal)}
nav.top{font-family:'JetBrains Mono',monospace;font-size:12px}
nav.top a{color:var(--ink);text-decoration:none;margin-left:18px}
h1{font-family:'Fraunces',serif;font-size:36px;margin:32px 0 20px}
h2{font-family:'Fraunces',serif;font-size:24px;margin:32px 0 12px}
p{margin-bottom:16px;color:var(--ink-soft);font-size:16px}
footer{text-align:center;padding:26px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule)}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
body.dark{--paper:#1a1a2e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
</style>
</head>
<body>
<header class="site">
<div><div class="wordmark">SIGNAL<span>.</span></div></div>
<nav class="top"><a href="/">Home</a><a href="/about.html">About</a><a href="/terms.html">Terms</a></nav>
</header>
<div class="container">
<h1>Terms of Service</h1>
<p>Last updated: July 2026</p>

<h2>Acceptance of Terms</h2>
<p>By accessing and using SIGNAL, you accept and agree to be bound by these Terms of Service.</p>

<h2>Content</h2>
<p>SIGNAL automatically generates articles about AI tools from publicly available sources. While we strive for accuracy, we make no warranties about the completeness, reliability, or accuracy of this information.</p>

<h2>Intellectual Property</h2>
<p>All content published on SIGNAL is original and generated by our AI pipeline. The content is provided for informational purposes only.</p>

<h2>Limitation of Liability</h2>
<p>SIGNAL shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>

<h2>Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.</p>

<h2>Contact</h2>
<p>For questions about these Terms, contact us at <a href="mailto:signalcompany.inc@gmail.com">signalcompany.inc@gmail.com</a>.</p>
</div>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — AI Tools Intelligence<br><a href="/privacy.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Privacy</a> · <a href="/terms.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Terms</a> · <a href="https://x.com/_signalainews" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">𝕏</a> · <a href="https://t.me/signal_ai_news" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Telegram</a></footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>
</body>
</html>`;
}

// ─── Category page generator ───
function categoryPage(category, articles) {
  const catArticles = articles.filter(a => a.status === 'published' && a.category === category)
    .sort((a, b) => new Date(b.generated || 0) - new Date(a.generated || 0));
  const catName = (category || 'ai').toUpperCase();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${catName} Articles — SIGNAL</title>
<meta name="description" content="Latest ${catName} AI tools news and articles. Stay updated with SIGNAL.">
<meta property="og:title" content="${catName} Articles — SIGNAL">
<meta property="og:description" content="Latest ${catName} AI tools news and articles.">
<link rel="canonical" href="${SITE_URL}/category/${category}.html">
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--card:#f6f2e7}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.container{max-width:1080px;margin:0 auto;padding:24px}
header.site{max-width:1080px;margin:0 auto;padding:36px 24px 22px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink)}
.wordmark{font-family:'Fraunces',serif;font-weight:700;font-size:34px}
.wordmark span{color:var(--signal)}
nav.top{font-family:'JetBrains Mono',monospace;font-size:12px}
nav.top a{color:var(--ink);text-decoration:none;margin-left:18px}
h1{font-family:'Fraunces',serif;font-size:36px;margin:32px 0 20px}
.feed{display:flex;flex-direction:column}
.card{display:grid;grid-template-columns:70px 1fr;gap:18px;padding:22px 0;border-top:1px solid var(--rule);text-decoration:none;color:var(--ink)}
.card:first-child{border-top:2px solid var(--ink)}
.card:hover{opacity:.85}
.card .idx{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-soft);padding-top:4px}
.card .tag{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;padding:2px 7px;border:1px solid var(--ink);border-radius:2px;margin-bottom:8px;color:var(--ink)}
.card h3{font-family:'Fraunces',serif;font-size:21px;font-weight:600;line-height:1.25;margin-bottom:6px}
.card p{color:var(--ink-soft);font-size:14px;line-height:1.55}
.card .meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--signal);margin-top:8px}
footer{text-align:center;padding:26px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule)}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
body.dark{--paper:#1a1a2e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
</style>
</head>
<body>
<header class="site">
<div><div class="wordmark">SIGNAL<span>.</span></div></div>
<nav class="top"><a href="/">Home</a><a href="/about.html">About</a><a href="/sitemap.xml">Sitemap</a></nav>
</header>
<div class="container">
<h1>${catName} Articles</h1>
<p style="color:var(--ink-soft);margin-bottom:32px">Latest ${catName} AI tools news and analysis from SIGNAL.</p>
<div class="feed">
${catArticles.map((a, i) => `
<a class="card" href="/articles/${a.slug}.html">
<div class="idx">${String(i + 1).padStart(2, '0')}</div>
<div>
<span class="tag">${(a.category || 'AI').toUpperCase()}</span>
<h3>${a.title}</h3>
<p>${a.dek || ''}</p>
<div class="meta">→ ${a.wordCount || '—'} words</div>
</div>
</a>
`).join('')}
</div>
</div>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — AI Tools Intelligence<br><a href="/privacy.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Privacy</a> · <a href="/terms.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Terms</a> · <a href="https://x.com/_signalainews" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">𝕏</a> · <a href="https://t.me/signal_ai_news" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Telegram</a></footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>
</body>
</html>`;
}

// ─── Newsletter page ───
function newsletterPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/png" href="/branding/favicon.png" sizes="32x32">
<meta name="google-site-verification" content="rHHtjtYXDcmaajYfu4xBB7VQN0Uio1FuC6mHogdmsjc" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Newsletter — SIGNAL</title>
<meta name="description" content="Subscribe to SIGNAL newsletter for daily AI tools intelligence.">
<link rel="canonical" href="${SITE_URL}/newsletter.html">
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
:root{--paper:#efe9dc;--ink:#1c2b25;--ink-soft:#5b6a5f;--rule:#c9bfa4;--signal:#b8481e;--card:#f6f2e7}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
.container{max-width:720px;margin:0 auto;padding:24px}
header.site{max-width:1080px;margin:0 auto;padding:36px 24px 22px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink)}
.wordmark{font-family:'Fraunces',serif;font-weight:700;font-size:34px}
.wordmark span{color:var(--signal)}
nav.top{font-family:'JetBrains Mono',monospace;font-size:12px}
nav.top a{color:var(--ink);text-decoration:none;margin-left:18px}
h1{font-family:'Fraunces',serif;font-size:36px;margin:32px 0 20px}
h2{font-family:'Fraunces',serif;font-size:24px;margin:32px 0 12px}
p{margin-bottom:16px;color:var(--ink-soft);font-size:16px}
.form-box{background:var(--card);border:1px solid var(--rule);padding:32px;border-radius:6px;margin:32px 0;text-align:center}
.form-box h2{margin-top:0}
.form-box input[type="email"]{width:100%;max-width:400px;padding:12px 16px;border:1px solid var(--rule);border-radius:4px;font-family:'Inter',sans-serif;font-size:16px;margin-bottom:16px;background:var(--paper)}
.form-box button{background:var(--signal);color:white;border:none;padding:12px 32px;font-family:'JetBrains Mono',monospace;font-size:14px;border-radius:4px;cursor:pointer;transition:background .2s}
.form-box button:hover{background:#9a3d19}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin:32px 0}
.feature{background:var(--card);border:1px solid var(--rule);padding:20px;border-radius:4px}
.feature h3{font-size:16px;margin-bottom:8px}
.feature p{font-size:14px;margin:0}
footer{text-align:center;padding:26px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-soft);border-top:1px solid var(--rule)}
.dark-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:var(--card);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
body.dark{--paper:#1a1a2e;--ink:#e0e0e0;--ink-soft:#a0a0b0;--rule:#2a2a4a;--signal:#e07040;--card:#1e1e3a}
</style>
</head>
<body>
<header class="site">
<div><div class="wordmark">SIGNAL<span>.</span></div></div>
<nav class="top"><a href="/">Home</a><a href="/newsletter.html">Newsletter</a><a href="/about.html">About</a></nav>
</header>
<div class="container">
<h1>📡 SIGNAL Newsletter</h1>
<p>Get the latest AI tools intelligence delivered to your inbox. No spam, just signal.</p>

<div class="form-box">
<h2>Subscribe for Free</h2>
<p>Join thousands of professionals staying ahead of the AI curve.</p>
<form action="https://formspree.io/f/mojglbkd" method="POST">
<input type="email" name="email" placeholder="your@email.com" required>r>
<button type="submit">Subscribe →</button>
</form>
<p style="font-size:12px;margin-top:12px;color:var(--ink-soft)">Free forever. Unsubscribe anytime.</p>
</div>

<h2>What You'll Get</h2>
<div class="features">
<div class="feature">
<h3>🔍 Daily Digest</h3>
<p>Curated AI tools news from 22+ sources, delivered daily.</p>
</div>
<div class="feature">
<h3>📊 Early Access</h3>
<p>Be the first to know about new AI tools and updates.</p>
</div>
<div class="feature">
<h3>🎯 No Noise</h3>
<p>Only verified, quality content. No hype, no fluff.</p>
</div>
</div>
</div>
<button class="dark-toggle" onclick="document.body.classList.toggle('dark');localStorage.setItem('dark',document.body.classList.contains('dark'))">🌙</button>
<script>if(localStorage.getItem('dark')==='true')document.body.classList.add('dark')</script>
<footer>SIGNAL — AI Tools Intelligence<br><a href="/privacy.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Privacy</a> · <a href="/terms.html" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Terms</a> · <a href="https://x.com/_signalainews" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">𝕏</a> · <a href="https://t.me/signal_ai_news" target="_blank" style="color:var(--ink-soft);margin:0 8px;font-size:11px">Telegram</a></footer>
<div class="reading-progress" id="readingProgress"></div>
<script>
window.addEventListener('scroll',()=>{const e=document.getElementById('readingProgress');if(!e)return;const h=document.documentElement.scrollHeight-window.innerHeight;e.style.width=(window.scrollY/h*100)+'%'});
const toggle=document.querySelector('.dark-toggle');if(toggle){toggle.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark')}
const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.animationPlayState='running';obs.unobserve(x.target)}})},{threshold:.1});document.querySelectorAll('.card').forEach(c=>{c.style.animationPlayState='paused';obs.observe(c)});
</script>
</body>
</html>`;
}

// ─── Sitemap generator ───
function generateSitemap(articles) {
  const published = articles.filter(a => a.status === 'published');
  const categories = [...new Set(published.map(a => a.category).filter(Boolean))];
  const urls = [
    { loc: SITE_URL, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/about.html`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/privacy.html`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/terms.html`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/feed.xml`, changefreq: 'daily', priority: '0.5' },
    { loc: `${SITE_URL}/newsletter.html`, changefreq: 'monthly', priority: '0.6' },
    ...categories.map(cat => ({
      loc: `${SITE_URL}/category/${cat}.html`,
      changefreq: 'weekly',
      priority: '0.6'
    })),
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

// ─── RSS Feed ───
function generateRSS(articles) {
  const published = articles
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.generated || 0) - new Date(a.generated || 0))
    .slice(0, 20);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>SIGNAL — AI Tools Intelligence</title>
  <link>${SITE_URL}</link>
  <description>AI tools, tracked daily. Hunted, verified, written.</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${published.map(a => `  <item>
    <title>${a.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    <link>${SITE_URL}/articles/${a.slug}.html</link>
    <guid isPermaLink="true">${SITE_URL}/articles/${a.slug}.html</guid>
    <description>${(a.dek || a.metaDesc || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>
    <pubDate>${new Date(a.generated || Date.now()).toUTCString()}</pubDate>
    <category>${(a.category || 'AI').toUpperCase()}</category>
  </item>`).join('\n')}
</channel>
</rss>`;
}

// ─── robots.txt ───
const ROBOTS = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/feed.xml

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

  // 3. About page
  await fs.writeFile(path.join(PUBLIC_DIR, 'about.html'), aboutPage());
  console.log('  ✓ about.html');

  // 4. Privacy Policy
  await fs.writeFile(path.join(PUBLIC_DIR, 'privacy.html'), privacyPage());
  console.log('  ✓ privacy.html');

  // 5. Terms of Service
  await fs.writeFile(path.join(PUBLIC_DIR, 'terms.html'), termsPage());
  console.log('  ✓ terms.html');

  // 6. Category pages
  await fs.mkdir(path.join(PUBLIC_DIR, 'category'), { recursive: true });
  const categories = [...new Set(published.map(a => a.category).filter(Boolean))];
  for (const cat of categories) {
    await fs.writeFile(path.join(PUBLIC_DIR, 'category', `${cat}.html`), categoryPage(cat, articles));
    console.log(`  ✓ category/${cat}.html`);
  }

  // 7. Sitemap
  await fs.writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), generateSitemap(articles));
  console.log('  ✓ sitemap.xml');

  // 8. Newsletter page
  await fs.writeFile(path.join(PUBLIC_DIR, 'newsletter.html'), newsletterPage());
  console.log('  ✓ newsletter.html');

  // 9. RSS Feed
  await fs.writeFile(path.join(PUBLIC_DIR, 'feed.xml'), generateRSS(articles));
  console.log('  ✓ feed.xml');

  // 9. robots.txt
  await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), ROBOTS);
  console.log('  ✓ robots.txt');

  console.log('\n✅ Build complete.\n');
}

// Run standalone
if (process.argv[1]?.endsWith('builder.mjs')) {
  build().catch(console.error);
}
