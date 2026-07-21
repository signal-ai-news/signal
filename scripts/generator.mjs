/**
 * GENERATOR — Turns signals into articles using Gemini/Groq.
 * Run: node scripts/generator.mjs
 */
import fetch from 'node-fetch';
import { GEMINI_KEY, GROQ_KEY, USE_MODEL } from './config.mjs';
import { nowISO, slugify } from './utils.mjs';

const SYSTEM_PROMPT = `You are a senior tech journalist who covers AI tools for a general audience.
Write in a clear, direct, no-fluff style — like a knowledgeable friend explaining it over coffee.

RULES:
1. NEVER copy/paste from source material. Rewrite everything in your own words.
2. Article MUST be AT LEAST 450 words. AIM FOR 600+ WORDS. Write 4-5 detailed paragraphs with examples and context. Do NOT write short articles.
3. Use H2/H3 subheadings for structure (at least 3 subheadings).
4. Include a "What it means for you" section with practical implications.
5. Include a "The bigger picture" section for context.
6. End with a forward-looking sentence.
7. Tone: confident, slightly opinionated, helpful. Not corporate. Not hype-bro.
8. Do NOT use phrases like "In the ever-evolving landscape of..." or "It's worth noting that..." or "game-changer" or "revolutionary".
9. Use contractions naturally (don't, it's, you'll).
10. Add specific numbers, dates, and facts when available.
11. Output ONLY valid JSON — no markdown, no code fences.`;

function buildPrompt(signal) {
  return `Write an article about this AI tool/announcement:

Title: ${signal.title}
Description: ${signal.description}
Source: ${signal.source}
Category: ${signal.category}

Output JSON with these exact fields:
{
  "title": "article headline (punchy, under 70 chars)",
  "slug": "url-friendly-slug",
  "dek": "one-sentence hook for the homepage card",
  "metaTitle": "SEO title tag (under 60 chars)",
  "metaDesc": "SEO meta description (under 155 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "${signal.category}",
  "body": "full article HTML with <h2>, <p>, <ul> tags",
  "imagePrompt": "detailed prompt for a blog header illustration"
}`;
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      },
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: 'json_object' }
    })
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generate(signal) {
  const prompt = buildPrompt(signal);
  console.log(`  ⏳ Generating: "${signal.title.substring(0, 50)}..."`);

  const article = USE_MODEL === 'groq'
    ? await callGroq(prompt)
    : await callGemini(prompt);

  // Enrich with metadata
  article.sourceUrl   = signal.url;
  article.sourceName  = signal.source;
  article.signalCategory = signal.category;
  article.generated   = nowISO();
  article.status      = 'draft';
  article.wordCount   = article.body.replace(/<[^>]+>/g, '').split(/\s+/).length;
  article.slug        = article.slug || slugify(article.title);

  return article;
}

// Run standalone with test signal
if (process.argv[1]?.endsWith('generator.mjs')) {
  const testSignal = {
    title: 'Test: OpenAI releases GPT-5 mini',
    description: 'A smaller, faster version of GPT-5 for developers.',
    url: 'https://example.com/test',
    source: 'Test',
    category: 'llm'
  };
  generate(testSignal)
    .then(a => console.log(`✅ Generated: "${a.title}" (${a.wordCount} words)`))
    .catch(console.error);
}
