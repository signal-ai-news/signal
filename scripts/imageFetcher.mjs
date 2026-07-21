/**
 * IMAGE FETCHER — Generates article images via Pollinations.ai
 * Run: node scripts/imageFetcher.mjs "prompt text" output.jpg
 */
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { PUBLIC_DIR } from './config.mjs';

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt/';

export async function fetchImage(prompt, slug) {
  const encoded = encodeURIComponent(prompt + ', digital illustration, clean modern style, editorial, 16:9 aspect ratio');
  const url = `${POLLINATIONS_BASE}${encoded}?width=1200&height=630&nologo=true&seed=${Date.now() % 10000}`;

  console.log(`  🎨 Fetching image for: ${slug}`);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(60000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SignalBot/1.0)' }
  });

  if (!res.ok) throw new Error(`Pollinations ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const imagesDir = path.join(PUBLIC_DIR, 'images');
  await fs.mkdir(imagesDir, { recursive: true });

  const filename = `${slug}.jpg`;
  const filepath = path.join(imagesDir, filename);
  await fs.writeFile(filepath, buffer);

  console.log(`  ✓ Image saved: images/${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return `/images/${filename}`;
}

// Run standalone
if (process.argv[1]?.endsWith('imageFetcher.mjs')) {
  const prompt = process.argv[2] || 'futuristic AI robot reading a newspaper, digital illustration';
  const slug = process.argv[3] || 'test';
  fetchImage(prompt, slug)
    .then(p => console.log(`✅ Image: ${p}`))
    .catch(console.error);
}
