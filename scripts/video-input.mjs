/**
 * VIDEO INPUT — Extracts video-ready data from articles
 * Run: node scripts/video-input.mjs
 */
import { readJSON, writeJSON, nowISO } from './utils.mjs';
import { ARTICLES_FILE, SITE_URL } from './config.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const QUEUE_FILE = path.join(ROOT, 'data', 'video-queue.json');

export async function extractVideoInputs() {
  const articles = await readJSON(ARTICLES_FILE);
  const published = articles.filter(a => a.status === 'published');

  // Load existing queue to check what's already processed
  let queue = [];
  try {
    queue = await readJSON(QUEUE_FILE);
  } catch { queue = []; }

  const processedSlugs = new Set(queue.map(q => q.slug));
  const newArticles = published.filter(a => !processedSlugs.has(a.slug));

  if (!newArticles.length) {
    console.log('  ✅ No new articles for video generation.');
    return [];
  }

  const videoInputs = newArticles.map(article => ({
    slug: article.slug,
    title: article.title,
    summary: article.dek || article.metaDesc || article.title,
    category: (article.category || 'news').toUpperCase(),
    coverImage: article.image ? `${SITE_URL}${article.image}` : null,
    sourceUrl: `${SITE_URL}/articles/${article.slug}.html`,
    sourceName: article.sourceName || 'SIGNAL',
    wordCount: article.wordCount || 0,
    tags: article.tags || [],
    affiliateLink: article.affiliates?.[0]?.url || null,
    extractedAt: nowISO(),
    videoGenerated: false,
    videoUrl: null,
    youtubeId: null,
  }));

  // Add to queue
  queue.push(...videoInputs);
  await writeJSON(QUEUE_FILE, queue);

  console.log(`  📹 ${videoInputs.length} new article(s) queued for video generation.`);
  return videoInputs;
}

export async function getPendingVideos() {
  let queue = [];
  try {
    queue = await readJSON(QUEUE_FILE);
  } catch { return []; }
  return queue.filter(q => !q.videoGenerated);
}

export async function markVideoComplete(slug, youtubeId, videoUrl) {
  let queue = [];
  try {
    queue = await readJSON(QUEUE_FILE);
  } catch { return; }

  const item = queue.find(q => q.slug === slug);
  if (item) {
    item.videoGenerated = true;
    item.videoUrl = videoUrl;
    item.youtubeId = youtubeId;
    item.completedAt = nowISO();
    await writeJSON(QUEUE_FILE, queue);
  }
}

// Run standalone
if (process.argv[1]?.endsWith('video-input.mjs')) {
  extractVideoInputs()
    .then(inputs => {
      inputs.forEach(i => console.log(`  → ${i.title} (${i.category})`));
    })
    .catch(console.error);
}
