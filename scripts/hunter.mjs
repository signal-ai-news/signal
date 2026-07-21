/**
 * HUNTER — Scans RSS feeds for AI tool news signals.
 * Run: node scripts/hunter.mjs
 */
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import fs from 'fs/promises';
import { SOURCES_FILE, SIGNALS_FILE } from './config.mjs';
import { readJSON, writeJSON, deduplicate, nowISO, sleep } from './utils.mjs';

const MAX_AGE_HOURS = 48;
const USER_AGENT = 'Mozilla/5.0 (compatible; SignalBot/1.0)';

// AI-related keywords to filter noise
const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'llm', 'gpt', 'claude', 'gemini',
  'machine learning', 'deep learning', 'neural', 'model', 'chatbot',
  'diffusion', 'transformer', 'openai', 'anthropic', 'google ai',
  'midjourney', 'stable diffusion', 'copilot', 'agent', 'embedding',
  'fine-tun', 'rag', 'prompt', 'inference', 'training', 'multimodal',
  'generative', 'text-to-', 'image-to-', 'video-to-', 'speech-to-',
  'runway', 'elevenlabs', 'replicate', 'hugging face', 'perplexity',
  'suno', 'kling', 'pika', 'cursor', 'notion ai', 'figma ai'
];

function isAIRelated(title, description = '') {
  const text = (title + ' ' + description).toLowerCase();
  return AI_KEYWORDS.some(k => text.includes(k));
}

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const channel = parsed?.rss?.channel || parsed?.feed;
    if (!channel) return [];

    let items = channel.item || channel.entry || [];
    if (!Array.isArray(items)) items = [items];

    const cutoff = Date.now() - MAX_AGE_HOURS * 3600 * 1000;

    return items
      .filter(item => {
        const title = item.title?._ || item.title || '';
        const desc = item.description?._ || item.description ||
                     item.summary?._ || item.summary || '';
        const pubDate = item.pubDate || item.published || item.updated || '';
        const ts = pubDate ? new Date(pubDate).getTime() : 0;
        const fresh = ts === 0 || ts > cutoff;
        return fresh && isAIRelated(title, desc);
      })
      .map(item => {
        const title = item.title?._ || item.title || 'Untitled';
        const link = item.link?._ || item.link?.href || item.link || '';
        const desc = item.description?._ || item.description ||
                     item.summary?._ || item.summary || '';
        const pubDate = item.pubDate || item.published || item.updated || nowISO();

        return {
          url: typeof link === 'string' ? link : '',
          title: title.trim(),
          description: desc.replace(/<[^>]+>/g, '').substring(0, 300).trim(),
          source: source.name,
          category: source.category,
          discovered: nowISO(),
          published: pubDate
        };
      })
      .filter(s => s.url && s.title !== 'Untitled');
  } catch (err) {
    console.error(`  ✗ ${source.name}: ${err.message}`);
    return [];
  }
}

export async function hunt() {
  const sources = JSON.parse(await fs.readFile(SOURCES_FILE, 'utf-8'));
  const existing = await readJSON(SIGNALS_FILE);
  let allSignals = [];

  console.log(`\n🔍 HUNTER — Scanning ${sources.length} sources...\n`);

  for (const source of sources) {
    const signals = await fetchRSS(source);
    if (signals.length) {
      console.log(`  ✓ ${source.name}: ${signals.length} signal(s)`);
      allSignals.push(...signals);
    } else {
      console.log(`  – ${source.name}: nothing new`);
    }
    await sleep(500); // polite delay
  }

  const newSignals = deduplicate(existing, allSignals, 'url');
  if (newSignals.length) {
    await writeJSON(SIGNALS_FILE, [...existing, ...newSignals]);
    console.log(`\n✅ ${newSignals.length} new signal(s) saved.\n`);
  } else {
    console.log(`\n— No new signals found.\n`);
  }

  return newSignals;
}

// Run standalone
if (process.argv[1]?.endsWith('hunter.mjs')) {
  hunt().catch(console.error);
}
