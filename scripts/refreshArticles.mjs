/**
 * REFRESH ARTICLES — Updates old articles to maintain SEO rankings
 * Strategy: Every 30 days, refresh articles with new intro, updated meta, and "Last Updated" date
 * This signals to Google that content is fresh and maintained
 */
import { generate } from './generator.mjs';
import { readJSON, writeJSON, nowISO } from './utils.mjs';
import { ARTICLES_FILE } from './config.mjs';

const REFRESH_DAYS = 30; // Refresh articles older than 30 days
const MAX_REFRESHES = 3; // Max 3 refreshes per article (at 30, 60, 90 days)

async function refreshOldArticles() {
  const articles = await readJSON(ARTICLES_FILE);
  const now = Date.now();
  let refreshed = 0;

  console.log('🔄 REFRESH — Checking for old articles...\n');

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (article.status !== 'published') continue;

    const generatedDate = new Date(article.generated || 0).getTime();
    const daysSincePublished = (now - generatedDate) / (1000 * 60 * 60 * 24);
    const lastRefresh = article.lastRefresh ? new Date(article.lastRefresh).getTime() : 0;
    const daysSinceRefresh = lastRefresh ? (now - lastRefresh) / (1000 * 60 * 60 * 24) : daysSincePublished;
    const refreshCount = article.refreshCount || 0;

    // Check if article needs refresh
    if (daysSinceRefresh >= REFRESH_DAYS && refreshCount < MAX_REFRESHES) {
      console.log(`  📝 Refreshing: "${article.title}" (${Math.floor(daysSincePublished)} days old, refresh #${refreshCount + 1})`);

      try {
        // Create a refresh signal with updated context
        const signal = {
          title: article.title,
          description: `${article.dek || article.metaDesc || article.title}. Update this article with fresh context and insights for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`,
          url: article.sourceUrl || 'https://signal-ai-news-signal.vercel.app',
          source: article.sourceName || 'SIGNAL',
          category: article.category || 'news'
        };

        const newArticle = await generate(signal);

        // Preserve original metadata but update content
        article.body = newArticle.body;
        article.wordCount = newArticle.wordCount;
        article.lastRefresh = nowISO();
        article.refreshCount = refreshCount + 1;

        // Update meta for SEO freshness signal
        article.metaDesc = newArticle.metaDesc || article.metaDesc;
        article.updatedDate = nowISO();

        refreshed++;
        console.log(`    ✅ Refreshed (${newArticle.wordCount} words)`);
      } catch (err) {
        console.error(`    ❌ Failed: ${err.message}`);
      }
    }
  }

  if (refreshed > 0) {
    await writeJSON(ARTICLES_FILE, articles);
    console.log(`\n✅ Refreshed ${refreshed} article(s)`);
  } else {
    console.log('\n✅ No articles need refresh yet');
  }

  return refreshed;
}

// Run standalone
if (process.argv[1]?.endsWith('refreshArticles.mjs')) {
  refreshOldArticles().catch(console.error);
}

export { refreshOldArticles };
