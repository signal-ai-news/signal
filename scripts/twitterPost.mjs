/**
 * TWITTER POST — Auto-posts articles to Twitter/X
 * Uses Twitter API v2
 */
import crypto from 'crypto';
import fetch from 'node-fetch';

const API_KEY = process.env.TWITTER_API_KEY || '';
const API_SECRET = process.env.TWITTER_API_SECRET || '';
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || '';

function generateOAuthSignature(method, url, params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sorted)}`;
  const signingKey = `${encodeURIComponent(API_SECRET)}&${encodeURIComponent(ACCESS_SECRET)}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

export async function postToTwitter(title, url, tags = []) {
  if (!API_KEY || !ACCESS_TOKEN) {
    console.log('  ⚠ Twitter credentials not configured — skipping tweet');
    return null;
  }

  const hashtags = tags.slice(0, 3).map(t => '#' + t.replace(/\s+/g, '')).join(' ');
  const text = `🔥 ${title}\n\n${hashtags} #AI #AITools\n\n${url}`;

  const endpoint = 'https://api.twitter.com/2/tweets';
  const params = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: '1.0'
  };
  params.oauth_signature = generateOAuthSignature('POST', endpoint, params);

  const authHeader = 'OAuth ' + Object.keys(params).sort()
    .map(k => `${k}="${encodeURIComponent(params[k])}"`).join(', ');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  🐦 Tweeted: ${data.data?.id || 'ok'}`);
      return data.data?.id;
    }
    const err = await res.text();
    console.log(`  ⚠ Tweet failed: ${res.status} ${err}`);
    return null;
  } catch (err) {
    console.log(`  ⚠ Tweet error: ${err.message}`);
    return null;
  }
}
