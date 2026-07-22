# SIGNAL — Complete Project Context
**Last Updated:** 2026-07-22

## 🔗 Links

| Platform | URL |
|---|---|
| Website | https://signal-ai-news-signal.vercel.app |
| GitHub | https://github.com/signal-ai-news/signal |
| Twitter/X | https://x.com/_signalainews |
| Telegram | https://t.me/signal_ai_news |
| Bot | @signalainews_bot |
| YouTube | @signal_ai_news |
| Branding | https://signal-ai-news-signal.vercel.app/branding.html |

## 📁 Project Structure

```
signal/
├── scripts/
│   ├── orchestrator.mjs      # Main pipeline: hunt→generate→image→quality→build→commit→notify→index
│   ├── hunter.mjs             # RSS feed scanner (22+ sources)
│   ├── generator.mjs          # Article generation (Groq/Gemini with key rotation)
│   ├── builder.mjs            # Static site generator (HTML pages)
│   ├── tgNotify.mjs           # Telegram notifications (owner + channel)
│   ├── indexing.mjs            # Auto-indexing (Google/Bing/Yandex ping)
│   ├── api-keys.mjs            # API key rotation system
│   ├── video-pipeline.mjs     # Video orchestrator: script→voice→render→upload
│   ├── video-script.mjs       # YouTube Shorts script generator
│   ├── video-voice.mjs        # TTS (ElevenLabs / Edge TTS fallback)
│   ├── video-render.mjs       # FFmpeg video renderer
│   ├── video-upload.mjs       # YouTube upload + Telegram notify
│   ├── video-input.mjs        # Extract video data from articles
│   ├── qualityGate.mjs        # Article quality checks
│   ├── affiliateMatcher.mjs   # Affiliate link injection
│   ├── imageFetcher.mjs       # Article image fetcher
│   ├── refreshArticles.mjs    # SEO refresh for old articles
│   ├── config.mjs             # Environment config
│   └── utils.mjs              # Shared utilities
├── data/
│   ├── articles.json          # All articles (published + drafts)
│   ├── signals.json           # Discovered signals from RSS
│   ├── video-queue.json       # Video generation queue
│   ├── sources.json           # RSS feed sources
│   └── affiliates.json        # Affiliate links
├── public/                    # Static site output (deployed to Vercel)
│   ├── index.html             # Homepage
│   ├── articles/              # Article pages
│   ├── category/              # Category pages
│   ├── about.html, privacy.html, terms.html, newsletter.html
│   ├── sitemap.xml, feed.xml, robots.txt, ads.txt
│   └── branding/              # Logo, favicon, OG images
├── content/
│   ├── audio/                 # Generated TTS audio
│   ├── frames/                # Video frames (temporary)
│   └── videos/                # Generated videos
└── .github/workflows/
    ├── pipeline.yml           # Main pipeline (every 30 min)
    └── video.yml              # Video pipeline (every 6 hours)
```

## 🔄 Auto Systems

| System | Schedule | What it does |
|---|---|---|
| Article Pipeline | `*/30 * * * *` (30 min) | Hunt RSS → Generate article → Quality check → Build site → Deploy → Notify → Index |
| Video Pipeline | `0 */6 * * *` (6 hours) | Generate script → TTS voice → Render video → Upload YouTube → Notify |
| Telegram Channel | After each article | Auto-posts to @signal_ai_news |
| Telegram Owner | After each article | Sends notification to user |
| Search Indexing | After each article | Pings Google, Bing, Yandex |
| Sitemap | After each article | Rebuilds sitemap.xml with new URLs |

## 🔑 GitHub Secrets (ALL SET)

```
GROQ_API_KEY          # Primary Groq key
GROQ_API_KEY_1        # Rotation key 1
GROQ_API_KEY_2        # Rotation key 2
GROQ_API_KEY_3        # Rotation key 3
GROQ_API_KEY_4        # Rotation key 4
GEMINI_API_KEY        # Primary Gemini key
GEMINI_API_KEY_1      # Rotation key 1
GEMINI_API_KEY_2      # Rotation key 2
GEMINI_API_KEY_3      # Rotation key 3
GEMINI_API_KEY_4      # Rotation key 4
ELEVENLABS_API_KEY    # TTS voice generation
TG_BOT_TOKEN          # Telegram bot token
TG_USER_ID            # Owner Telegram user ID
TG_CHANNEL_ID         # Telegram channel chat ID
VERCEL_ORG_ID         # Vercel deployment
VERCEL_PROJECT_ID     # Vercel deployment
VERCEL_TOKEN          # Vercel deployment
YOUTUBE_CLIENT_ID     # YouTube OAuth
YOUTUBE_CLIENT_SECRET # YouTube OAuth
YOUTUBE_REFRESH_TOKEN # YouTube OAuth
```

## 📊 Current Status

- **Published Articles:** 11
- **Draft Articles:** 4 (too short, <400 words)
- **Unprocessed Signals:** ~93
- **Videos Generated:** 0 (quota was exhausted, now fixed)
- **API Keys:** 5 Groq + 5 Gemini (rotation enabled)

## 🛠 How Key Rotation Works

```
scripts/api-keys.mjs
├── Loads keys: GROQ_API_KEY, GROQ_API_KEY_1, GROQ_API_KEY_2, ...
├── Tracks rate-limited keys with reset times
├── When key hits 429 → marks as limited → switches to next available
└── When all keys limited → waits for soonest reset
```

Integrated in:
- `generator.mjs` (article generation)
- `video-script.mjs` (video script generation)

## 📝 Video Pipeline Status

- **Render:** Uses FFmpeg (fast, reliable for CI)
- **Voice:** ElevenLabs → Edge TTS fallback
- **Script:** Groq → Gemini fallback
- **Upload:** YouTube Data API v3 (resumable upload)
- **Notify:** Telegram owner + channel

Known issue: ElevenLabs model upgraded from `eleven_monolingual_v1` (deprecated) to `eleven_multilingual_v2`.

## 🌐 SEO Status

| Element | Status |
|---|---|
| Title tags | ✅ All pages |
| Meta descriptions | ✅ All articles |
| Canonical URLs | ✅ All pages |
| Schema.org (NewsArticle) | ✅ JSON-LD |
| OG tags | ✅ All pages |
| Twitter Card | ✅ summary_large_image |
| Sitemap.xml | ✅ Auto-rebuilt |
| RSS Feed | ✅ feed.xml |
| robots.txt | ✅ GPTBot blocked |
| Google Verification | ✅ Meta tag |
| Auto-indexing | ✅ Google/Bing/Yandex ping |

**User must do once:** Google Search Console → Add property → Submit sitemap.xml

## 💰 AdSense Readiness

- ads.txt: ✅ Deployed (needs publisher ID after approval)
- Articles: 11 published (need 15-20 for approval)
- Newsletter: ✅ Formspree form active

## ⚠️ Known Issues / TODO

1. **Google Search Console** — User must submit sitemap manually (one-time)
2. **AdSense** — Need15-20 articles (currently11), then user applies
3. **ads.txt** — Needs real publisher ID after AdSense approval
4. **Draft articles** —4 drafts too short (<400 words), need regeneration
5. **Video queue** —9 videos pending, will process on next run with available quota

## 🚀 Commands

```bash
# Run pipeline locally
node scripts/orchestrator.mjs --limit 3

# Run video pipeline locally
node scripts/video-pipeline.mjs --limit 1

# Build site only
node scripts/builder.mjs

# Test indexing
node scripts/indexing.mjs

# Check API key status
node scripts/api-keys.mjs

# Test Telegram notification
node scripts/tgNotify.mjs "Test message"
```

## 🔧 Environment Variables (.env)

```
GROQ_API_KEY=
GROQ_API_KEY_1=
GROQ_API_KEY_2=
GROQ_API_KEY_3=
GROQ_API_KEY_4=
GEMINI_API_KEY=
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
ELEVENLABS_API_KEY=
TG_BOT_TOKEN=
TG_USER_ID=
TG_CHANNEL_ID=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
VERCEL_TOKEN=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
```

## 📱 Monitoring

- **GitHub Actions:** https://github.com/signal-ai-news/signal/actions
- **Vercel Dashboard:** https://vercel.com
- **Telegram Channel:** https://t.me/signal_ai_news
- **Website:** https://signal-ai-news-signal.vercel.app

---

**System runs 24/7 autonomously. Check every 1-2 weeks.**
