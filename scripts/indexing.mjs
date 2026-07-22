/**
 * INDEXING — Auto-submit new articles to search engines
 * Run: node scripts/indexing.mjs
 */
import fetch from 'node-fetch';
import { SITE_URL } from './config.mjs';

// ─── Google Sitemap Ping ───
async function pingGoogle() {
  try {
    const res = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(SITE_URL + '/sitemap.xml')}`,
      { signal: AbortSignal.timeout(10000) }
    );
    console.log(`  📡 Google ping: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.log(`  ⚠ Google ping failed: ${err.message}`);
    return false;
  }
}

// ─── Bing Sitemap Submit ───
async function pingBing() {
  try {
    const res = await fetch(
      `https://www.bing.com/indexnow?url=${encodeURIComponent(SITE_URL)}&sitemapUrl=${encodeURIComponent(SITE_URL + '/sitemap.xml')}`,
      { signal: AbortSignal.timeout(10000) }
    );
    console.log(`  📡 Bing ping: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.log(`  ⚠ Bing ping failed: ${err.message}`);
    return false;
  }
}

// ─── Yandex Sitemap Ping ───
async function pingYandex() {
  try {
    const res = await fetch(
      `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITE_URL + '/sitemap.xml')}`,
      { signal: AbortSignal.timeout(10000) }
    );
    console.log(`  📡 Yandex ping: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.log(`  ⚠ Yandex ping failed: ${err.message}`);
    return false;
  }
}

// ─── IndexNow (Bing/Yandex instant indexing) ───
async function submitIndexNow(urls, apiKey) {
  if (!apiKey) {
    console.log('  ⚠ IndexNow key not set, skipping.');
    return false;
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'signal-ai-news-signal.vercel.app',
        key: apiKey,
        urlList: urls
      }),
      signal: AbortSignal.timeout(10000)
    });
    console.log(`  📡 IndexNow: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.log(`  ⚠ IndexNow failed: ${err.message}`);
    return false;
  }
}

// ─── Main: Notify all search engines about new content ───
export async function notifySearchEngines(articleUrls = []) {
  console.log('\n🔍 INDEXING — Notifying search engines...\n');

  // 1. Ping Google
  await pingGoogle();

  // 2. Ping Bing
  await pingBing();

  // 3. Ping Yandex
  await pingYandex();

  // 4. IndexNow if key available
  const indexNowKey = process.env.INDEXNOW_KEY || '';
  if (articleUrls.length && indexNowKey) {
    await submitIndexNow(articleUrls, indexNowKey);
  }

  console.log('\n✅ Search engine notifications sent.\n');
}

// ─── Auto-index specific article URL via Google Indexing API ───
export async function submitToGoogleIndexingAPI(url) {
  const clientId = process.env.GOOGLE_INDEXING_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_INDEXING_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_INDEXING_REFRESH_TOKEN || '';

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('  ⚠ Google Indexing API not configured (optional).');
    return false;
  }

  try {
    // Get access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      })
    });

    if (!tokenRes.ok) {
      console.log(`  ⚠ Token refresh failed: ${tokenRes.status}`);
      return false;
    }

    const { access_token } = await tokenRes.json();

    // Submit URL for indexing
    const indexRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    if (indexRes.ok) {
      console.log(`  📡 Google Indexing API: ${url} submitted`);
      return true;
    } else {
      const err = await indexRes.text();
      console.log(`  ⚠ Indexing API error: ${err.substring(0, 100)}`);
      return false;
    }
  } catch (err) {
    console.log(`  ⚠ Indexing API failed: ${err.message}`);
    return false;
  }
}

// Run standalone
if (process.argv[1]?.endsWith('indexing.mjs')) {
  const url = process.argv[2];
  if (url) {
    submitToGoogleIndexingAPI(url).then(() => notifySearchEngines([url]));
  } else {
    notifySearchEngines().catch(console.error);
  }
}
