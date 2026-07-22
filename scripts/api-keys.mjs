/**
 * API KEY ROTATOR — Manages multiple API keys with automatic rotation
 * When one key hits rate limit, switches to the next one
 * Run: node scripts/api-keys.mjs (to test)
 */

// ─── Key Storage ───
// Keys are loaded from environment variables:
// GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3, ...
// GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3, ...

const KEY_PREFIXES = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY'
};

// Track which keys are rate limited and when they reset
const keyStatus = {};

function loadKeys(provider) {
  const prefix = KEY_PREFIXES[provider];
  const keys = [];
  
  // Load primary key
  const primary = process.env[prefix] || '';
  if (primary) keys.push({ id: 'primary', key: primary });
  
  // Load numbered keys (1-10)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`${prefix}_${i}`] || '';
    if (key) keys.push({ id: `${prefix}_${i}`, key });
  }
  
  console.log(`  [api-keys] ${provider}: ${keys.length} key(s) loaded`);
  return keys;
}

function getAvailableKey(provider) {
  const keys = loadKeys(provider);
  const now = Date.now();
  
  // Find first non-rate-limited key
  for (const k of keys) {
    const status = keyStatus[k.id];
    if (!status || !status.rateLimited || now > status.resetAt) {
      return k;
    }
  }
  
  // All keys rate limited — return the one that resets soonest
  let soonest = null;
  let soonestTime = Infinity;
  for (const k of keys) {
    const status = keyStatus[k.id];
    if (status && status.resetAt < soonestTime) {
      soonest = k;
      soonestTime = status.resetAt;
    }
  }
  
  return soonest || keys[0] || null;
}

function markRateLimited(keyId, retryAfterMs) {
  keyStatus[keyId] = {
    rateLimited: true,
    resetAt: Date.now() + retryAfterMs,
    markedAt: Date.now()
  };
}

function markSuccess(keyId) {
  delete keyStatus[keyId];
}

function parseRetryMs(errorText) {
  // Parse "Please try again in Xm Ys" or "Please try again in Xs"
  const match = errorText.match(/try again in (\d+)m(\d+\.?\d*)s/);
  if (match) return (parseInt(match[1]) * 60 + parseFloat(match[2])) * 1000;
  const match2 = errorText.match(/try again in (\d+\.?\d*)s/);
  if (match2) return parseFloat(match2[1]) * 1000;
  // Default: 60 seconds
  return 60000;
}

// ─── Public API ───
export function getGroqKey() {
  return getAvailableKey('groq');
}

export function getGeminiKey() {
  return getAvailableKey('gemini');
}

export function markGroqRateLimited(keyId, errorText) {
  markRateLimited(keyId, parseRetryMs(errorText));
}

export function markGeminiRateLimited(keyId, errorText) {
  markRateLimited(keyId, parseRetryMs(errorText));
}

export function markGroqSuccess(keyId) {
  markSuccess(keyId);
}

export function markGeminiSuccess(keyId) {
  markSuccess(keyId);
}

export function getKeyStatus() {
  const groqKeys = loadKeys('groq');
  const geminiKeys = loadKeys('gemini');
  
  return {
    groq: {
      total: groqKeys.length,
      available: groqKeys.filter(k => !keyStatus[k.id]?.rateLimited || Date.now() > keyStatus[k.id]?.resetAt).length,
      keys: groqKeys.map(k => ({
        id: k.id,
        available: !keyStatus[k.id]?.rateLimited || Date.now() > keyStatus[k.id]?.resetAt,
        resetAt: keyStatus[k.id]?.resetAt || null
      }))
    },
    gemini: {
      total: geminiKeys.length,
      available: geminiKeys.filter(k => !keyStatus[k.id]?.rateLimited || Date.now() > keyStatus[k.id]?.resetAt).length,
      keys: geminiKeys.map(k => ({
        id: k.id,
        available: !keyStatus[k.id]?.rateLimited || Date.now() > keyStatus[k.id]?.resetAt,
        resetAt: keyStatus[k.id]?.resetAt || null
      }))
    }
  };
}

// Run standalone to test
if (process.argv[1]?.endsWith('api-keys.mjs')) {
  console.log('=== API Key Status ===');
  const status = getKeyStatus();
  console.log(`\nGroq: ${status.groq.available}/${status.groq.total} available`);
  status.groq.keys.forEach(k => {
    const s = k.available ? '✅' : `❌ (resets: ${new Date(k.resetAt).toISOString()})`;
    console.log(`  ${k.id}: ${s}`);
  });
  console.log(`\nGemini: ${status.gemini.available}/${status.gemini.total} available`);
  status.gemini.keys.forEach(k => {
    const s = k.available ? '✅' : `❌ (resets: ${new Date(k.resetAt).toISOString()})`;
    console.log(`  ${k.id}: ${s}`);
  });
}
