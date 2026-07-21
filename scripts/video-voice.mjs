/**
 * VIDEO VOICE — Generates TTS audio from script
 * Supports: ElevenLabs, Edge TTS (free fallback)
 * Run: node scripts/video-voice.mjs
 */
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'content', 'audio');

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE || 'pNInz6obpgDQGcFmaJgB'; // Adam

// ─── ElevenLabs TTS ───
async function generateElevenLabs(text, outputPath) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      }
    })
  });

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
  return buffer.length;
}

// ─── Edge TTS (free, Microsoft) ───
async function generateEdgeTTS(text, outputPath) {
  // edge-tts Python package
  const voice = 'en-US-GuyNeural';
  const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');

  try {
    execSync(
      `edge-tts --voice "${voice}" --text "${escapedText}" --write-media "${outputPath}"`,
      { stdio: 'pipe', timeout: 30000 }
    );
    const stat = await fs.stat(outputPath);
    return stat.size;
  } catch (err) {
    throw new Error(`Edge TTS failed: ${err.message}`);
  }
}

export async function generateVoice(text, slug) {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const outputPath = path.join(AUDIO_DIR, `${slug}.mp3`);

  console.log(`  🔊 Generating voice: "${text.substring(0, 50)}..."`);

  let size = 0;

  // Try ElevenLabs first, fallback to Edge TTS
  if (ELEVENLABS_KEY) {
    try {
      size = await generateElevenLabs(text, outputPath);
      console.log(`  ✅ ElevenLabs: ${(size / 1024).toFixed(0)}KB`);
      return outputPath;
    } catch (err) {
      console.log(`  ⚠ ElevenLabs failed: ${err.message}, trying Edge TTS...`);
    }
  }

  // Fallback: Edge TTS
  size = await generateEdgeTTS(text, outputPath);
  console.log(`  ✅ Edge TTS: ${(size / 1024).toFixed(0)}KB`);
  return outputPath;
}

// Run standalone
if (process.argv[1]?.endsWith('video-voice.mjs')) {
  const testText = "OpenAI just dropped GPT-5 mini and it's three times faster than the full model. Developers are already building with it. Follow SIGNAL for daily AI updates.";
  generateVoice(testText, 'test-voice')
    .then(p => console.log(`\n✅ Audio saved: ${p}`))
    .catch(console.error);
}
