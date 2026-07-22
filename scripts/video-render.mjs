/**
 * VIDEO RENDER — Renders YouTube Shorts video using FFmpeg
 * Creates 1080x1920 (9:16) video with animated text, cover image, and voice
 * Run: node scripts/video-render.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FRAMES_DIR = path.join(ROOT, 'content', 'frames');
const VIDEO_DIR = path.join(ROOT, 'content', 'videos');

// ─── Generate animated frames using Playwright ───
async function generateFrames(script, coverImagePath, slug) {
  const { chromium } = await import('playwright-core');
  await fs.mkdir(FRAMES_DIR, { recursive: true });
  const frameDir = path.join(FRAMES_DIR, slug);
  await fs.mkdir(frameDir, { recursive: true });

  // Build timeline
  const segments = [];
  const totalSeconds = script.estimated_seconds || 35;
  const pointDuration = Math.floor((totalSeconds - 5) / 3); // 5s for hook+cta

  segments.push({ text: script.hook, duration: 4, type: 'hook' });
  script.points.forEach((p, i) => {
    segments.push({ text: p, duration: pointDuration, type: 'point', index: i + 1 });
  });
  segments.push({ text: script.cta, duration: 3, type: 'cta' });

  // Generate HTML template for each frame
  const fps = 30;
  let frameNum = 0;

  // Try known paths for Chromium
  const possiblePaths = [
    '/opt/ms-playwright/chromium-1223/chrome-linux64/chrome',
    '/opt/ms-playwright/chrome-linux64/chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  let execPath;
  for (const p of possiblePaths) {
    try { await fs.access(p); execPath = p; break; } catch {}
  }
  if (!execPath) {
    console.log('  ⚠ Chromium not found, falling back to FFmpeg text-only');
    return null; // Will be handled by caller
  }
  const browser = await chromium.launch({ headless: true, executablePath: execPath });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 }
  });

  for (const seg of segments) {
    const frameCount = seg.duration * fps;
    for (let f = 0; f < frameCount; f++) {
      const progress = f / frameCount;
      const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;
      const slideY = progress < 0.1 ? (1 - progress * 10) * 40 : 0;

      const html = buildFrameHTML(seg, opacity, slideY, coverImagePath, script.on_screen_text);
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(frameDir, `frame_${String(frameNum).padStart(5, '0')}.png`),
        type: 'png'
      });
      await page.close();
      frameNum++;
    }
  }

  await browser.close();
  console.log(`  🖼 Generated ${frameNum} frames`);
  return { frameDir, fps, totalFrames: frameNum };
}

function buildFrameHTML(segment, opacity, slideY, coverImage, onScreenTexts) {
  const bgColor = '#1c2b25';
  const accentColor = '#b8481e';
  const paperColor = '#efe9dc';

  let badgeHTML = '';
  if (segment.type === 'hook') {
    badgeHTML = `<div style="position:absolute;top:80px;left:50px;background:${accentColor};color:white;font-family:'JetBrains Mono',monospace;font-size:24px;padding:8px 20px;border-radius:4px;letter-spacing:2px">🔴 BREAKING</div>`;
  } else if (segment.type === 'point') {
    badgeHTML = `<div style="position:absolute;top:80px;left:50px;background:rgba(255,255,255,0.1);color:${paperColor};font-family:'JetBrains Mono',monospace;font-size:28px;padding:8px 20px;border-radius:4px">${segment.index}/3</div>`;
  } else if (segment.type === 'cta') {
    badgeHTML = `<div style="position:absolute;top:80px;left:50px;background:${accentColor};color:white;font-family:'JetBrains Mono',monospace;font-size:24px;padding:8px 20px;border-radius:4px;letter-spacing:2px">📡 SIGNAL</div>`;
  }

  const fontSize = segment.text.length > 100 ? 42 : segment.text.length > 60 ? 48 : 56;

  return `<!DOCTYPE html>
<html><head><style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${bgColor};overflow:hidden;position:relative}
</style></head><body>
<div style="width:1080px;height:1920px;background:${bgColor};display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px 50px;position:relative">

  ${badgeHTML}

  <div style="opacity:${opacity};transform:translateY(${slideY}px);text-align:center;max-width:900px">
    <p style="font-family:'Fraunces',serif;font-size:${fontSize}px;font-weight:600;color:${paperColor};line-height:1.3;text-align:left">${segment.text}</p>
  </div>

  <div style="position:absolute;bottom:120px;left:0;right:0;text-align:center">
    <p style="font-family:'JetBrains Mono',monospace;font-size:18px;color:rgba(239,233,220,0.4);letter-spacing:4px">SIGNAL · AI TOOLS INTELLIGENCE</p>
  </div>

  <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:linear-gradient(90deg,${accentColor},#2f6b4f)"></div>
</div>
</body></html>`;
}

// ─── Combine frames + audio into video ───
export async function renderVideo(script, audioPath, coverImagePath, slug) {
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  const outputPath = path.join(VIDEO_DIR, `${slug}.mp4`);

  console.log(`  🎬 Rendering video: ${slug}`);

  // Generate frames
  const frameResult = await generateFrames(script, coverImagePath, slug);

  if (!frameResult) {
    // Fallback: use FFmpeg text-only approach
    return await renderVideoFFmpeg(script, audioPath, slug);
  }

  const { frameDir, fps, totalFrames } = frameResult;

  // Get audio duration
  let audioDuration;
  try {
    const probe = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`, { encoding: 'utf-8' });
    audioDuration = parseFloat(probe.trim());
  } catch {
    audioDuration = script.estimated_seconds || 35;
  }

  // Combine with FFmpeg
  const ffmpegCmd = [
    'ffmpeg -y',
    `-framerate ${fps}`,
    `-i "${frameDir}/frame_%05d.png"`,
    `-i "${audioPath}"`,
    `-c:v libx264 -preset fast -crf 23`,
    `-c:a aac -b:a 128k`,
    `-pix_fmt yuv420p`,
    `-shortest`,
    `-movflags +faststart`,
    `"${outputPath}"`
  ].join(' ');

  console.log(`  ⏳ Encoding video (${totalFrames} frames, ~${audioDuration}s audio)...`);
  execSync(ffmpegCmd, { stdio: 'pipe', timeout: 300000 });

  const stat = await fs.stat(outputPath);
  console.log(`  ✅ Video: ${(stat.size / 1024 / 1024).toFixed(1)}MB → ${outputPath}`);

  // Cleanup frames
  await fs.rm(frameDir, { recursive: true, force: true });

  return outputPath;
}

// ─── FFmpeg Fallback (no browser needed) ───
async function renderVideoFFmpeg(script, audioPath, slug) {
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  const outputPath = path.join(VIDEO_DIR, `${slug}.mp4`);
  const tmpDir = path.join(ROOT, 'content', 'tmp-frames', slug);
  await fs.mkdir(tmpDir, { recursive: true });

  console.log(`  🎬 Rendering with FFmpeg fallback: ${slug}`);

  // Get audio duration
  let duration;
  try {
    const probe = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`, { encoding: 'utf-8' });
    duration = parseFloat(probe.trim());
  } catch {
    duration = script.estimated_seconds || 35;
  }

  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);

  // Build segments timeline
  const segments = [];
  const pointDuration = Math.floor((duration - 7) / 3);
  segments.push({ text: script.hook, start: 0, end: 4 });
  script.points.forEach((p, i) => {
    segments.push({ text: p, start: 4 + i * pointDuration, end: 4 + (i + 1) * pointDuration });
  });
  segments.push({ text: script.cta, start: duration - 3, end: duration });

  // Generate frames using FFmpeg drawtext
  // Build complex filter for text animation
  const bgColors = ['#1c2b25', '#2a1f1a', '#1a2a20', '#251c2b'];
  const accentColor = '#b8481e';

  // Create a video with colored background and animated text using FFmpeg
  const textFilters = segments.map((seg, i) => {
    const escaped = seg.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    const fadeIn = `enable='between(t,${seg.start},${seg.start + 0.5})':alpha='if(lt(t-${seg.start},0.5),(t-${seg.start})/0.5,1)'`;
    return `drawtext=text='${escaped}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:${fadeIn}:enable='between(t,${seg.start},${seg.end})'`;
  }).join(',');

  // Simple approach: dark background + text overlays + audio
  const ffmpegCmd = [
    'ffmpeg -y',
    `-f lavfi -i "color=c=#1c2b25:s=1080x1920:d=${duration}:r=${fps}"`,
    `-i "${audioPath}"`,
    `-vf "${textFilters}"`,
    '-c:v libx264 -preset fast -crf 23',
    '-c:a aac -b:a 128k',
    '-pix_fmt yuv420p',
    '-shortest',
    '-movflags +faststart',
    `"${outputPath}"`
  ].join(' ');

  execSync(ffmpegCmd, { stdio: 'pipe', timeout: 300000 });

  const stat = await fs.stat(outputPath);
  console.log(`  ✅ Video (FFmpeg): ${(stat.size / 1024 / 1024).toFixed(1)}MB → ${outputPath}`);
  return outputPath;
}

// Run standalone
if (process.argv[1]?.endsWith('video-render.mjs')) {
  console.log('Video render requires script + audio + cover image. Run via video-pipeline.mjs');
}
