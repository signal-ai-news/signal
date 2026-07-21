/**
 * AFFILIATE MATCHER — Injects relevant affiliate links into article HTML.
 * Run: node scripts/affiliateMatcher.mjs
 */
import { AFFILIATES_FILE } from './config.mjs';
import { readJSON } from './utils.mjs';

export async function matchAffiliates(article) {
  const affiliates = await readJSON(AFFILIATES_FILE);
  const bodyLower = (article.title + ' ' + article.body).toLowerCase();
  const matched = [];

  for (const aff of affiliates) {
    if (bodyLower.includes(aff.keyword.toLowerCase())) {
      matched.push(aff);
    }
  }

  if (!matched.length) return article;

  // Build CTA block
  const ctaHTML = matched.map(aff => `
    <a href="${aff.link}" target="_blank" rel="noopener sponsored"
       style="display:inline-block;background:#1c2b25;color:#efe9dc;
              padding:10px 20px;margin:4px 8px 4px 0;border-radius:3px;
              text-decoration:none;font-family:'JetBrains Mono',monospace;
              font-size:13px;letter-spacing:.04em;">
      ${aff.label} →
    </a>
  `).join('');

  // Insert CTA after the second </p> or before the last </p>
  const paragraphs = article.body.split('</p>');
  if (paragraphs.length > 3) {
    paragraphs.splice(2, 0,
      `\n<div style="margin:24px 0;padding:16px;background:#f6f2e7;border:1px solid #c9bfa4;border-radius:4px;">
        <p style="margin:0 0 10px;font-size:13px;color:#5b6a5f;font-family:'JetBrains Mono',monospace;letter-spacing:.04em;">
          TOOLS MENTIONED
        </p>
        ${ctaHTML}
      </div>`
    );
    article.body = paragraphs.join('</p>');
  }

  article.affiliates = matched.map(m => m.keyword);
  return article;
}

// Run standalone test
if (process.argv[1]?.endsWith('affiliateMatcher.mjs')) {
  (async () => {
    const test = {
      title: 'Runway releases new video model',
      body: '<p>Runway has released a new AI video model.</p><p>The model is faster.</p><p>It works well.</p><p>Try it out.</p>'
    };
    const result = await matchAffiliates(test);
    console.log('Matched affiliates:', result.affiliates);
    console.log(result.body.substring(0, 500));
  })();
}
