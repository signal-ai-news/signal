/**
 * VIDEO SCRIPT — Generates YouTube Shorts script using Groq/Gemini
 * Run: node scripts/video-script.mjs
 */
import fetch from 'node-fetch';
import { USE_MODEL } from './config.mjs';
import { getGroqKey, getGeminiKey, markGroqRateLimited, markGeminiRateLimited, markGroqSuccess, markGeminiSuccess } from './api-keys.mjs';

const SYSTEM_PROMPT = `You are a viral YouTube Shorts scriptwriter for an AI tech channel called "SIGNAL".

Write SHORT, PUNCHY scripts (30-45 seconds spoken, ~100-130 words).

RULES:
1. Start with a HOOK in the first 3 seconds (question, shocking stat, or bold claim)
2. Give 3 key points, each in 1-2 sentences
3. End with a CTA: "Follow SIGNAL for daily AI updates"
4. Tone: confident, slightly opinionated, like a smart friend explaining tech
5. NO filler words, NO "in today's video", NO "let's dive in"
6. Use contractions naturally
7. Output ONLY valid JSON — no markdown, no code fences.`;

function buildPrompt(videoInput) {
  return `Write a viral YouTube Shorts script about:

Title: ${videoInput.title}
Summary: ${videoInput.summary}
Category: ${videoInput.category}
Source: ${videoInput.sourceName}

Output JSON with these exact fields:
{
  "hook": "opening line that grabs attention (first 3 seconds)",
  "points": ["point 1 (1-2 sentences)", "point 2 (1-2 sentences)", "point 3 (1-2 sentences)"],
  "cta": "closing call to action",
  "full_script": "complete script as natural spoken text, ready for TTS",
  "on_screen_text": ["text overlay 1 (short, 3-5 words)", "text overlay 2", "text overlay 3", "text overlay 4"],
  "estimated_seconds": 35
}`;
}

async function callGroq(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const keyObj = getGroqKey();
    if (!keyObj || !keyObj.key) throw new Error('No Groq API keys available');
    
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyObj.key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (res.ok) {
      const data = await res.json();
      markGroqSuccess(keyObj.id);
      return JSON.parse(data.choices[0].message.content);
    }

    const errText = await res.text();
    if (res.status === 429) {
      markGroqRateLimited(keyObj.id, errText);
      const nextKey = getGroqKey();
      if (nextKey && nextKey.id !== keyObj.id) {
        console.log(`  ⚠ Groq key rate limited, switching to next key`);
        continue;
      }
      if (i < retries - 1) {
        const wait = (i + 1) * 30;
        console.log(`  ⚠ All Groq keys rate limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
    }
    throw new Error(`Groq ${res.status}: ${errText}`);
  }
}

async function callGemini(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const keyObj = getGeminiKey();
    if (!keyObj || !keyObj.key) throw new Error('No Gemini API keys available');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyObj.key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        },
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      })
    });

    if (res.ok) {
      const data = await res.json();
      markGeminiSuccess(keyObj.id);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    }

    const errText = await res.text();
    if (res.status === 429) {
      markGeminiRateLimited(keyObj.id, errText);
      const nextKey = getGeminiKey();
      if (nextKey && nextKey.id !== keyObj.id) {
        console.log(`  ⚠ Gemini key rate limited, switching to next key`);
        continue;
      }
      if (i < retries - 1) {
        const wait = (i + 1) * 20;
        console.log(`  ⚠ All Gemini keys rate limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
    }
    throw new Error(`Gemini ${res.status}: ${errText}`);
  }
}

export async function generateVideoScript(videoInput) {
  const prompt = buildPrompt(videoInput);
  console.log(`  ⏳ Generating script: "${videoInput.title.substring(0, 50)}..."`);

  let script;
  try {
    script = USE_MODEL === 'groq'
      ? await callGroq(prompt)
      : await callGemini(prompt);
  } catch (err) {
    // Fallback to Gemini if Groq fails
    if (USE_MODEL === 'groq') {
      console.log(`  ⚠ Groq failed (${err.message}), falling back to Gemini...`);
      script = await callGemini(prompt);
    } else {
      throw err;
    }
  }

  // Enrich
  script.wordCount = script.full_script.split(/\s+/).length;
  script.estimated_seconds = script.estimated_seconds || Math.round(script.wordCount / 3);

  console.log(`  ✅ Script: ${script.wordCount} words, ~${script.estimated_seconds}s`);
  return script;
}

// Run standalone
if (process.argv[1]?.endsWith('video-script.mjs')) {
  const testInput = {
    title: 'OpenAI releases GPT-5 mini',
    summary: 'A smaller, faster version of GPT-5 for developers with 3x speed improvement.',
    category: 'LLM',
    sourceName: 'OpenAI Blog'
  };
  generateVideoScript(testInput)
    .then(s => {
      console.log('\n📝 Script:');
      console.log(`  Hook: ${s.hook}`);
      s.points.forEach((p, i) => console.log(`  Point ${i+1}: ${p}`));
      console.log(`  CTA: ${s.cta}`);
      console.log(`\n  Full: ${s.full_script}`);
    })
    .catch(console.error);
}
