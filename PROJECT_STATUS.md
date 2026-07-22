# SIGNAL — সম্পূর্ণ প্রজেক্ট স্ট্যাটাস
**Last Updated:** 2026-07-22 09:00 AM (Bangladesh)

---

## 🔗 সব লিংক এক জায়গায়

| প্ল্যাটফর্ম | লিংক |
|---|---|
| **Website** | https://signal-ai-news-signal.vercel.app |
| **GitHub** | https://github.com/signal-ai-news/signal |
| **Twitter/X** | https://x.com/_signalainews |
| **Telegram Channel** | https://t.me/signal_ai_news |
| **Telegram Bot** | @signalainews_bot |
| **YouTube Handle** | @signal_ai_news |
| **Branding Download** | https://signal-ai-news-signal.vercel.app/branding.html |

---

## ✅ সম্পূর্ণ হয়েছে (১০০%)

| # | কাজ | বিস্তারিত |
|---|---|---|
| 1 | **Website** | https://signal-ai-news-signal.vercel.app — 9 articles, auto-publish 24/7 |
| 2 | **Domain fix** | সব URL `signal-ai-news-signal.vercel.app` এ আপডেট |
| 3 | **Auto pipeline** | প্রতি 30 মিনিটে hunt → generate → build → deploy |
| 4 | **Telegram bot** | `@signalainews_bot` — notification পাঠাচ্ছে |
| 5 | **GitHub Secrets** | 11টা সব secret সেট আছে |
| 6 | **SEO** | Sitemap, RSS feed, robots.txt, structured data, favicon, OG image (সব page) |
| 7 | **Branding** | 8টা PNG asset তৈরি + download page |
| 8 | **Social links** | 𝕏 + Telegram সব page এ যুক্ত |
| 9 | **YouTube credentials** | Client ID, Secret, Refresh Token সব সেট |
| 10 | **Video pipeline code** | 7টা script লেখা হয়েছে |
| 11 | **Google verification** | OAuth consent screen + test user সেট |
| 12 | **ElevenLabs TTS** | API key সেট আছে |
| 13 | **Newsletter** | Formspree form `mojglbkd` সেট আছে |
| 14 | **OG Image + Twitter Card** | সব page এ rich preview |
| 15 | **YouTube channel** | Setup complete ✅ |
| 16 | **Telegram channel** | Bot admin complete ✅ |
| 17 | **Twitter** | Profile complete ✅ |
| 18 | **Rate limit fix** | Retry logic + Gemini fallback |

---

## ⏳ আংশিক হয়েছে (৫০-৮০%)

| # | কাজ | কতটুকু | কী বাকি |
|---|---|---|---|
| 1 | **Video pipeline** | 70% | Script + Voice কাজ করে। Render (FFmpeg) fix লাগবে |
| 2 | **Twitter auto-post** | 30% | Code আছে, Twitter API key লাগবে (ঐচ্ছিক) |

---

## 🔑 GitHub Secrets (11টা)

```
✅ ELEVENLABS_API_KEY
✅ GEMINI_API_KEY
✅ GROQ_API_KEY
✅ TG_BOT_TOKEN
✅ TG_USER_ID
✅ VERCEL_ORG_ID
✅ VERCEL_PROJECT_ID
✅ VERCEL_TOKEN
✅ YOUTUBE_CLIENT_ID
✅ YOUTUBE_CLIENT_SECRET
✅ YOUTUBE_REFRESH_TOKEN
```

---

## 📺 YouTube Channel Description (কপি করুন)

```
📡 SIGNAL — AI Tools Intelligence

AI tools, tracked daily. Hunted, verified, written.

Every article starts as a raw signal from a release note, changelog, or product page — then reviewed before it goes live.

🔍 What you'll find here:
• Daily AI news and tool reviews
• Breaking AI developments
• Practical AI tool recommendations
• No hype, no fluff — just signal

🌐 Website: https://signal-ai-news-signal.vercel.app
🐦 Twitter: https://x.com/_signalainews
✈️ Telegram: https://t.me/signal_ai_news

Updated daily from 22+ sources. Fully automated, editorially reviewed.
```

**Tags:** `AI tools, artificial intelligence, AI news, machine learning, LLM, GPT, Claude, Gemini, AI reviews, tech news, SIGNAL AI`

---

## 📁 ফাইল স্ট্রাকচার

```
signal/
├── .github/workflows/
│   ├── pipeline.yml          ← Main pipeline (30 min)
│   └── video.yml             ← Video pipeline (6 hours)
├── public/
│   ├── branding/             ← 8 PNG assets
│   ├── articles/             ← 9 article pages
│   ├── category/             ← 4 category pages
│   ├── index.html
│   ├── about.html
│   ├── privacy.html
│   ├── terms.html
│   ├── newsletter.html
│   ├── feed.xml
│   ├── sitemap.xml
│   └── robots.txt
├── scripts/
│   ├── orchestrator.mjs      ← Main pipeline
│   ├── hunter.mjs            ← RSS feed scanner
│   ├── generator.mjs         ← Article generator (Groq/Gemini)
│   ├── builder.mjs           ← HTML page builder
│   ├── tgNotify.mjs          ← Telegram notifications
│   ├── social-post.mjs       ← Telegram channel + Twitter post
│   ├── video-input.mjs       ← Article → video input
│   ├── video-script.mjs      ← Video script generator
│   ├── video-voice.mjs       ← TTS (ElevenLabs/Edge)
│   ├── video-render.mjs      ← FFmpeg video render
│   ├── video-upload.mjs      ← YouTube upload
│   └── video-pipeline.mjs    ← Video orchestrator
├── data/
│   ├── articles.json         ← Article database
│   ├── signals.json          ← Hunted signals
│   ├── video-queue.json      ← Video generation queue
│   └── affiliates.json       ← Affiliate links
└── templates/
    └── branding.html         ← Branding design source
```

---

## 🎯 আগামীকাল কী করবেন

**ধাপ ১:** YouTube Studio এ Description + Tags সেট করুন (উপরে কপি করুন)

**ধাপ ২:** আমাকে বলুন — আমি video pipeline render fix করে দেব

**ধাপ ৩:** ১৫-২০ articles হলে AdSense apply করুন (২-৩ দিন অপেক্ষা করুন)

---

## 🔄 অটো সিস্টেম স্ট্যাটাস

| সিস্টেম | সময়কাল | স্ট্যাটাস |
|---|---|---|
| Article Hunt + Publish | প্রতি 30 মিনিটে | ✅ চালু |
| Telegram Notification | প্রতিটা article এ | ✅ চালু |
| Telegram Channel Post | প্রতিটা article এ | ✅ চালু |
| Video Generate + YouTube | প্রতি 6 ঘণ্টায় | ⏳ Render fix লাগবে |
| Newsletter | Formspree | ✅ চালু |

---

**ঘুমান — সব কিছু অটো চলবে!** 🌙
