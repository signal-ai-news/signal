/**
 * QUALITY GATE — Validates articles before publishing.
 * Run: node scripts/qualityGate.mjs
 */
import { ARTICLES_FILE } from './config.mjs';
import { readJSON } from './utils.mjs';
import fetch from 'node-fetch';

const MIN_WORDS = 300;
const MAX_TITLE_LENGTH = 80;

export async function checkQuality(article, existingArticles = []) {
  const issues = [];
  const text = article.body.replace(/<[^>]+>/g, '');

  // 1. Word count check
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) {
    issues.push(`Word count ${wordCount} < minimum ${MIN_WORDS}`);
  }

  // 2. Duplicate title check
  const titleLower = article.title.toLowerCase();
  const dupes = existingArticles.filter(a =>
    a.title && a.title.toLowerCase() === titleLower
  );
  if (dupes.length) {
    issues.push(`Duplicate title found: "${article.title}"`);
  }

  // 3. Title length
  if (article.title.length > MAX_TITLE_LENGTH) {
    issues.push(`Title too long: ${article.title.length} chars (max ${MAX_TITLE_LENGTH})`);
  }

  // 4. Required fields
  const required = ['title', 'slug', 'body', 'metaTitle', 'metaDesc'];
  for (const field of required) {
    if (!article[field]) issues.push(`Missing field: ${field}`);
  }

  // 5. Meta description length
  if (article.metaDesc && article.metaDesc.length > 160) {
    issues.push(`Meta description too long: ${article.metaDesc.length} chars`);
  }

  // 6. Affiliate link check (non-blocking)
  if (article.body) {
    const linkRegex = /href="([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(article.body)) !== null) {
      const url = match[1];
      if (url.includes('ref=signal') || url.includes('ref=')) {
        try {
          const res = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
            redirect: 'follow'
          });
          if (!res.ok) {
            issues.push(`Affiliate link broken (${res.status}): ${url.substring(0, 50)}`);
          }
        } catch {
          issues.push(`Affiliate link unreachable: ${url.substring(0, 50)}`);
        }
      }
    }
  }

  // 7. Check for AI slop phrases
  const slopPhrases = [
    'in the ever-evolving', 'it\'s worth noting', 'delve into',
    'at the end of the day', 'game-changer', 'paradigm shift',
    'leverage the power', 'cutting-edge', 'revolutionize the way',
    'comprehensive guide', 'in conclusion', 'to summarize'
  ];
  for (const phrase of slopPhrases) {
    if (text.toLowerCase().includes(phrase)) {
      issues.push(`AI slop detected: "${phrase}"`);
    }
  }

  const passed = issues.length === 0;
  return { passed, issues, wordCount };
}

// Run standalone
if (process.argv[1]?.endsWith('qualityGate.mjs')) {
  (async () => {
    const articles = await readJSON(ARTICLES_FILE);
    const test = {
      title: 'Test Article',
      slug: 'test-article',
      body: '<p>' + 'word '.repeat(500) + '</p>',
      metaTitle: 'Test',
      metaDesc: 'A test article description.'
    };
    const result = await checkQuality(test, articles);
    console.log(result.passed ? '✅ PASSED' : '❌ FAILED');
    if (result.issues.length) console.log('Issues:', result.issues);
    console.log(`Word count: ${result.wordCount}`);
  })();
}
