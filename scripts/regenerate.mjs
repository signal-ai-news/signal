/**
 * REGENERATE — Re-generate short articles to meet AdSense word count requirement
 */
import { generate } from './generator.mjs';
import { readJSON, writeJSON } from './utils.mjs';
import { ARTICLES_FILE } from './config.mjs';

const MIN_WORDS = 400;

async function regenerate() {
  const articles = await readJSON(ARTICLES_FILE);
  let regenerated = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const wordCount = article.body ? article.body.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length : 0;

    if (article.status === 'published' && wordCount < MIN_WORDS) {
      console.log(`\n🔄 Regenerating: "${article.title}" (${wordCount} words → target 500+)`);
      
      try {
        const signal = {
          title: article.title,
          description: article.dek || article.metaDesc || article.title,
          url: article.sourceUrl || 'https://signal-nnt4.vercel.app',
          source: article.sourceName || 'SIGNAL',
          category: article.category || 'news'
        };

        const newArticle = await generate(signal);
        
        // Preserve original metadata
        newArticle.slug = article.slug;
        newArticle.generated = article.generated;
        newArticle.status = 'published';
        
        articles[i] = newArticle;
        regenerated++;
        console.log(`  ✅ New: "${newArticle.title}" (${newArticle.wordCount} words)`);
      } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
      }
    }
  }

  if (regenerated > 0) {
    await writeJSON(ARTICLES_FILE, articles);
    console.log(`\n✅ Regenerated ${regenerated} articles`);
  } else {
    console.log('\n✅ All articles already meet minimum word count');
  }
}

regenerate().catch(console.error);
