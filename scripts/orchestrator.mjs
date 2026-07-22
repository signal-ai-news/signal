/**
 * ORCHESTRATOR — Main pipeline: hunt → generate → image → affiliate → quality → build → commit → notify
 * Run: node scripts/orchestrator.mjs [--dry-run] [--limit N]
 */
import { hunt } from './hunter.mjs';
import { generate } from './generator.mjs';
import { fetchImage } from './imageFetcher.mjs';
import { matchAffiliates } from './affiliateMatcher.mjs';
import { checkQuality } from './qualityGate.mjs';
import { build } from './builder.mjs';
import { refreshOldArticles } from './refreshArticles.mjs';
import { notify, buildPublishMessage, buildErrorMessage, buildHuntReport } from './tgNotify.mjs';
import { readJSON, writeJSON, nowISO } from './utils.mjs';
import { ARTICLES_FILE, SIGNALS_FILE, GH_TOKEN, REPO } from './config.mjs';
import { execSync } from 'child_process';

const DRY_RUN  = process.argv.includes('--dry-run');
const LIMIT    = parseInt(process.argv.find((_, i, a) => a[i-1] === '--limit') || '3');

async function gitCommit(message) {
  if (DRY_RUN) { console.log(`  [DRY] git commit: ${message}`); return; }
  try {
    execSync('git add -A', { stdio: 'pipe' });
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) { console.log('  – No changes to commit.'); return; }
    execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
    try {
      execSync('git pull --rebase origin main', { stdio: 'pipe' });
    } catch (e) {
      // Ignore pull errors, try push anyway
    }
    execSync('git push origin main', { stdio: 'pipe' });
    console.log(`  ✓ Committed & pushed: ${message}`);
  } catch (err) {
    console.error(`  ✗ Git error: ${err.message}`);
    await notify(buildErrorMessage('git-commit', err.message));
  }
}

async function runPipeline() {
  console.log('═══════════════════════════════════════════');
  console.log('  SIGNAL Pipeline — ' + new Date().toISOString());
  console.log('═══════════════════════════════════════════\n');

  const startTime = Date.now();
  let published = 0;

  // ─── Step 1: HUNT ───
  console.log('━━━ STEP 1: HUNT ━━━');
  let newSignals = [];
  try {
    newSignals = await hunt();
    if (newSignals.length) {
      await notify(buildHuntReport(newSignals));
    }
  } catch (err) {
    console.error('Hunt failed:', err.message);
    await notify(buildErrorMessage('hunt', err.message));
  }

  // ─── Get unprocessed signals ───
  const articles = await readJSON(ARTICLES_FILE);
  const signals  = await readJSON(SIGNALS_FILE);
  const unprocessed = signals.filter(s => !s.processed);

  if (!newSignals.length && !unprocessed.length) {
    console.log('\nNo signals to process. Pipeline complete.\n');
    return;
  }

  // Combine new signals with existing unprocessed ones
  const allPending = [...newSignals, ...unprocessed.filter(u => !newSignals.some(n => n.url === u.url))];
  const toProcess = allPending.slice(0, LIMIT);

  console.log(`\n━━━ STEP 2-5: PROCESS ${toProcess.length} signal(s) ━━━\n`);

  for (let idx = 0; idx < toProcess.length; idx++) {
    const signal = toProcess[idx];
    // Delay between articles to avoid rate limits
    if (idx > 0) {
      console.log('  ⏳ Waiting 15s before next article...');
      await new Promise(r => setTimeout(r, 15000));
    }
    console.log(`\n── Processing: "${signal.title}" ──`);

    try {
      // Generate article
      let article = await generate(signal);

      // Fetch image
      try {
        const imageUrl = await fetchImage(article.imagePrompt || article.title, article.slug);
        article.image = imageUrl;
      } catch (err) {
        console.log(`  ⚠ Image failed: ${err.message}`);
        article.image = null;
      }

      // Match affiliates
      article = await matchAffiliates(article);

      // Quality check
      const quality = await checkQuality(article, articles);
      if (!quality.passed) {
        console.log(`  ❌ Quality failed:`);
        quality.issues.forEach(i => console.log(`     • ${i}`));
        article.status = 'draft';
        article.qualityIssues = quality.issues;
      } else {
        console.log(`  ✅ Quality passed (${quality.wordCount} words)`);
        article.status = 'published';
        published++;
      }

      article.wordCount = quality.wordCount;
      articles.push(article);

      // Save draft to content folder
      if (DRY_RUN) {
        console.log(`  [DRY] Would save article: ${article.slug}`);
      }

    } catch (err) {
      console.error(`  ✗ Generation failed: ${err.message}`);
      await notify(buildErrorMessage('generate', `${signal.title}: ${err.message}`));
    }
  }

  // ─── Save articles ───
  await writeJSON(ARTICLES_FILE, articles);
  console.log(`\n  📁 ${articles.length} total articles in database.`);

  // ─── Mark processed signals ───
  const processedUrls = new Set(toProcess.map(s => s.url));
  const updatedSignals = signals.map(s =>
    processedUrls.has(s.url) ? { ...s, processed: true, processedAt: nowISO() } : s
  );
  await writeJSON(SIGNALS_FILE, updatedSignals);

  // ─── Step 5.5: REFRESH OLD ARTICLES ───
  console.log('\n━━━ STEP 5.5: REFRESH OLD ARTICLES ━━━');
  try {
    const refreshed = await refreshOldArticles();
    if (refreshed > 0) {
      console.log(`  ✅ ${refreshed} article(s) refreshed for SEO`);
    }
  } catch (err) {
    console.error('Refresh failed:', err.message);
  }

  // ─── Step 6: BUILD ───
  console.log('\n━━━ STEP 6: BUILD ━━━');
  try {
    await build();
  } catch (err) {
    console.error('Build failed:', err.message);
    await notify(buildErrorMessage('build', err.message));
  }

  // ─── Step 7: COMMIT ───
  if (!DRY_RUN) {
    console.log('\n━━━ STEP 7: COMMIT ━━━');
    await gitCommit(`SIGNAL: ${published} new article(s) — ${new Date().toISOString().slice(0, 10)}`);
  }

  // ─── Step 8: NOTIFY ───
  console.log('\n━━━ STEP 8: NOTIFY ━━━');
  const newArticles = articles.filter(a => a.status === 'published' && a.generated > new Date(Date.now() - 600000).toISOString());
  for (const article of newArticles.slice(-3)) {
    await notify(buildPublishMessage(article));
  }

  // ─── Summary ───
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n═══════════════════════════════════════════');
  console.log(`  ✅ Pipeline complete in ${elapsed}s`);
  console.log(`  📊 ${newSignals.length} signals → ${toProcess.length} processed → ${published} published`);
  console.log('═══════════════════════════════════════════\n');
}

runPipeline().catch(async (err) => {
  console.error('Pipeline crashed:', err);
  await notify(buildErrorMessage('pipeline', err.message));
  process.exit(1);
});
