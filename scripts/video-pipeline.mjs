/**
 * VIDEO PIPELINE — Main orchestrator: extract → script → voice → render → upload → notify
 * Run: node scripts/video-pipeline.mjs [--dry-run] [--limit N]
 */
import { extractVideoInputs, getPendingVideos, markVideoComplete } from './video-input.mjs';
import { generateVideoScript } from './video-script.mjs';
import { generateVoice } from './video-voice.mjs';
import { renderVideo } from './video-render.mjs';
import { uploadToYouTube, notifyVideoUpload } from './video-upload.mjs';
import { readJSON } from './utils.mjs';
import { SITE_URL } from './config.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find((_, i, a) => a[i-1] === '--limit') || '2');

async function runVideoPipeline() {
  console.log('═══════════════════════════════════════════');
  console.log('  VIDEO Pipeline — ' + new Date().toISOString());
  console.log('═══════════════════════════════════════════\n');

  const startTime = Date.now();
  let processed = 0;

  // ─── Step 1: Extract new video inputs ───
  console.log('━━━ STEP 1: EXTRACT ━━━');
  await extractVideoInputs();

  // ─── Step 2: Get pending videos ───
  const pending = await getPendingVideos();
  const toProcess = pending.slice(0, LIMIT);

  if (!toProcess.length) {
    console.log('\n✅ No videos to generate. Pipeline complete.\n');
    return;
  }

  console.log(`\n━━━ PROCESS ${toProcess.length} video(s) ━━━\n`);

  for (const videoInput of toProcess) {
    console.log(`\n── Video: "${videoInput.title}" ──`);

    try {
      // ─── Step 3: Generate script ───
      const script = await generateVideoScript(videoInput);

      if (DRY_RUN) {
        console.log(`  [DRY] Would generate video for: ${videoInput.slug}`);
        console.log(`  Hook: ${script.hook}`);
        continue;
      }

      // ─── Step 4: Generate voice ───
      const audioPath = await generateVoice(script.full_script, videoInput.slug);

      // ─── Step 5: Render video ───
      const coverImagePath = videoInput.coverImage
        ? path.join(ROOT, 'public', 'images', path.basename(videoInput.coverImage))
        : null;
      const videoPath = await renderVideo(script, audioPath, coverImagePath, videoInput.slug);

      // ─── Step 6: Upload to YouTube ───
      let youtubeId = null;
      let videoUrl = null;
      try {
        const upload = await uploadToYouTube(videoPath, videoInput, script);
        youtubeId = upload.youtubeId;
        videoUrl = upload.videoUrl;
      } catch (err) {
        console.log(`  ⚠ YouTube upload skipped: ${err.message}`);
      }

      // ─── Step 7: Mark complete ───
      await markVideoComplete(videoInput.slug, youtubeId, videoUrl);

      // ─── Step 8: Notify ───
      if (videoUrl) {
        await notifyVideoUpload(videoInput, videoUrl);
      }

      processed++;
      console.log(`  ✅ Video complete: ${videoInput.slug}`);

    } catch (err) {
      console.error(`  ✗ Video failed: ${err.message}`);
    }
  }

  // ─── Summary ───
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n═══════════════════════════════════════════');
  console.log(`  ✅ Video Pipeline complete in ${elapsed}s`);
  console.log(`  📊 ${toProcess.length} processed → ${processed} videos generated`);
  console.log('═══════════════════════════════════════════\n');
}

runVideoPipeline().catch(console.error);
