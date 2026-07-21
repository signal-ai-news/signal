/**
 * VIDEO UPLOAD — Uploads video to YouTube using Data API v3
 * Run: node scripts/video-upload.mjs
 */
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { SITE_URL, TG_BOT, TG_USER } from './config.mjs';

const YT_CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID || '';
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const YT_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN || '';

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      refresh_token: YT_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    })
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export async function uploadToYouTube(videoPath, videoInput, script) {
  if (!YT_CLIENT_ID || !YT_CLIENT_SECRET || !YT_REFRESH_TOKEN) {
    throw new Error('YouTube credentials not configured');
  }

  console.log(`  📤 Uploading to YouTube: "${videoInput.title}"`);

  const accessToken = await getAccessToken();
  const videoBuffer = await fs.readFile(videoPath);

  // Prepare metadata
  const title = `${videoInput.title} #AI #Shorts`.substring(0, 100);
  const description = [
    videoInput.summary,
    '',
    `🔗 Read full article: ${videoInput.sourceUrl}`,
    '',
    `📡 SIGNAL — AI Tools Intelligence`,
    `🌐 ${SITE_URL}`,
    '',
    `#${videoInput.category} #AITools #AINews #TechNews #Shorts`,
    ...(videoInput.tags || []).map(t => `#${t.replace(/\s+/g, '')}`),
  ].join('\n');

  const tags = [
    videoInput.category, 'AI tools', 'AI news', 'tech news',
    'artificial intelligence', 'machine learning', 'Shorts',
    'SIGNAL', ...(videoInput.tags || []),
  ];

  // Resumable upload
  const metadata = {
    snippet: { title, description, tags, categoryId: '28' },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  };

  // Step 1: Initiate resumable upload
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(videoBuffer.length),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) throw new Error(`Upload init failed: ${initRes.status} ${await initRes.text()}`);

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('No upload URL returned');

  // Step 2: Upload video binary
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(videoBuffer.length),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

  const result = await uploadRes.json();
  const youtubeId = result.id;
  const videoUrl = `https://youtube.com/shorts/${youtubeId}`;

  console.log(`  ✅ Uploaded: ${videoUrl}`);
  return { youtubeId, videoUrl };
}

export async function notifyVideoUpload(videoInput, videoUrl) {
  if (!TG_BOT || !TG_USER) return;

  const message = `🎬 <b>VIDEO UPLOADED</b>

<b>${videoInput.title}</b>

${videoInput.summary}

<a href="${videoUrl}">Watch on YouTube →</a>
<a href="${videoInput.sourceUrl}">Read Article →</a>`;

  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_USER,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      })
    });
    console.log('  📱 Telegram notification sent.');
  } catch (err) {
    console.error(`  ✗ Telegram error: ${err.message}`);
  }
}
