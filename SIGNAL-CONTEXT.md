# SIGNAL — Complete Project Context
**Last Updated:** 2026-07-23

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
│   ├── orchestrator.mjs      # Main pipeline: hunt→generate→image→affiliate→quality→build→commit→notify→twitter→index
│   ├── hunter.mjs             # RSS feed scanner (39 sources)
│   ├── generator.mjs          # Article generation (Groq/Gemini with key rotation + FAQ)
│   ├── builder.mjs            # Static site generator (HTML pages + FAQ schema + News sitemap)
│   ├── tgNotify.mjs           # Telegram notifications (owner + channel)
│   ├── indexing.mjs            # Auto-indexing (Google/Bing/Yandex ping)
│   ├── api-keys.mjs            # API key rotation system
│   ├── twitterPost.mjs        # Twitter/X auto-post (OAuth 1.0a)
│   ├── video-pipeline.mjs     # Video orchestrator: script→voice→render→upload
│   ├── video-script.mjs       # YouTube Shorts script generator
│   ├── video-voice.mjs        # TTS (ElevenLabs / Edge TTS fallback)
│   ├── video-render.mjs       # FFmpeg video renderer
│   ├── video-upload.mjs       # YouTube upload + Telegram notify
│   ├── video-input.mjs        # Extract video data from articles
│   ├── qualityGate.mjs        # Article quality checks (MIN_WORDS=350)
│   ├── affiliateMatcher.mjs   # Affiliate link injection (12 tools)
│   ├── imageFetcher.mjs       # Article image fetcher
│   ├── refreshArticles.mjs    # SEO refresh for old articles
│   ├── config.mjs             # Environment config
│   └── utils.mjs              # Shared utilities
├── data/
│   ├── articles.json          # All articles (published + drafts)
│   ├── signals.json           # Discovered signals from RSS
│   ├── video-queue.json       # Video generation queue
│   ├── sources.json           # RSS feed sources (39 total)
│   └── affiliates.json        # Affiliate links (12 tools)
├── public/                    # Static site output (deployed to Vercel)
│   ├── index.html             # Homepage
│   ├── articles/              # Article pages
│   ├── category/              # Category pages
│   ├── about.html, privacy.html, terms.html, newsletter.html
│   ├── sitemap.xml, news-sitemap.xml, feed.xml, robots.txt, ads.txt
│   └── branding/              # Logo, favicon, OG images
├── content/
│   ├── audio/                 # Generated TTS audio
│   ├── frames/                # Video frames (temporary)
│   └── videos/                # Generated videos
└── .github/workflows/
    ├── pipeline.yml           # Main pipeline (every 30 min, limit 5)
    └── video.yml              # Video pipeline (every 6 hours)
```

## 🔄 Auto Systems

| System | Schedule | What it does |
|---|---|---|
| Article Pipeline | `5,35 * * * *` (30 min) | Hunt RSS → Generate article → Quality check → Build site → Deploy → Notify → Twitter → Index |
| Video Pipeline | `0 */6 * * *` (6 hours) | Generate script → TTS voice → Render video → Upload YouTube → Notify |
| Telegram Channel | After each article | Auto-posts to @signal_ai_news |
| Telegram Owner | After each article | Sends notification to user |
| Twitter/X | After each article | Auto-posts with hashtags (needs API keys) |
| Search Indexing | After each article | Pings Google, Bing, Yandex |
| Sitemap | After each article | Rebuilds sitemap.xml + news-sitemap.xml |

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
YOUTUBE_REFRESH_TOKEN # YouTube OAuth (needs refresh - 401 error)
INDEXNOW_KEY          # IndexNow key
TWITTER_API_KEY       # Twitter API (needs setup)
TWITTER_API_SECRET    # Twitter API (needs setup)
TWITTER_ACCESS_TOKEN  # Twitter API (needs setup)
TWITTER_ACCESS_SECRET # Twitter API (needs setup)
```

## 📊 Current Status

- **Published Articles:** 21
- **Draft Articles:** 16 (too short, <350 words)
- **RSS Sources:** 39
- **Videos Generated:** 6 (YouTube upload failing - 401 token error)
- **API Keys:** 5 Groq + 5 Gemini (rotation enabled)
- **Affiliate Links:** 12 AI tools

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
- **Upload:** YouTube Data API v3 (resumable upload) — **FAILING: Token refresh 401**
- **Notify:** Telegram owner + channel

**Known issue:** YouTube OAuth refresh token expired. Need new token from Google OAuth Playground.

## 🔗 Affiliate System

**12 AI Tools with contextual matching:**

| Tool | Category | Link |
|---|---|---|
| ElevenLabs | audio | https://try.elevenlabs.io/tw37jyig7hch (REAL) |
| Cursor | devtools | placeholder |
| Perplexity | search | placeholder |
| Runway | video | placeholder |
| Midjourney | image | placeholder |
| Suno | music | placeholder |
| Pika | video | placeholder |
| Claude | llm | placeholder |
| ChatGPT | llm | placeholder |
| Notion AI | productivity | placeholder |
| Hugging Face | ml | placeholder |
| Replicate | infra | placeholder |

**How it works:**
1. Article generated → `affiliateMatcher.mjs` runs
2. Checks article title + body for keywords
3. If match found → injects "TOOLS MENTIONED" CTA block
4. Visitor clicks → goes to product page → affiliate revenue

**Note:** Only ElevenLabs has real affiliate link. Others need real referral links from each tool's affiliate program.

## 🌐 SEO Status

| Element | Status |
|---|---|
| Title tags | ✅ All pages |
| Meta descriptions | ✅ All articles |
| Canonical URLs | ✅ All pages |
| Schema.org (NewsArticle) | ✅ JSON-LD |
| Schema.org (FAQ) | ✅ Auto-generated |
| OG tags | ✅ All pages |
| Twitter Card | ✅ summary_large_image |
| Sitemap.xml | ✅ Auto-rebuilt |
| News Sitemap | ✅ news-sitemap.xml (48h articles) |
| RSS Feed | ✅ feed.xml |
| robots.txt | ✅ GPTBot blocked |
| Google Verification | ✅ Meta tag |
| Auto-indexing | ✅ Google/Bing/Yandex ping |
| Share Buttons | ✅ Twitter, LinkedIn, HN, Reddit |
| Breadcrumbs | ✅ All article pages |
| Internal Linking | ✅ Related articles (same category) |

**User must do once:**
- Google Search Console → Add property → Submit sitemap.xml
- Google Search Console → Submit news-sitemap.xml

## 💰 AdSense Readiness

- ads.txt: ✅ Deployed (needs publisher ID after approval)
- Articles: 21 published (need 15-20 for approval) ✅ READY
- Newsletter: ✅ Formspree form active

**User should apply for AdSense now!**

## 📱 Social Media Accounts

| Platform | Status | Username |
|---|---|---|
| Telegram | ✅ Active | @signal_ai_news |
| LinkedIn | ✅ Created | SIGNAL — AI Tools Intelligence |
| Reddit | ✅ Created | signal_ai_news |
| Hacker News | ✅ Created | signal_ai_news |
| Twitter/X | ⚠️ Needs API | @_signalainews |
| YouTube | ⚠️ Token expired | @signal_ai_news |

## ⚠️ Known Issues / TODO

1. **YouTube OAuth** — Refresh token expired (401). Need new token from OAuth Playground.
2. **Twitter API** — Lebanon network unavailable. Need alternative (Buffer/IFTTT).
3. **LinkedIn API** — Needs OAuth setup for auto-posting.
4. **Reddit API** — Needs OAuth setup for auto-posting.
5. **Hacker News** — Needs account credentials for auto-posting.
6. **Affiliate links** — Only ElevenLabs is real. Others need real referral links.
7. **AdSense** — Ready to apply (21 articles). Need publisher ID after approval.
8. **Google Search Console** — User must submit sitemap manually (one-time).

## 🚀 Commands

```bash
# Run pipeline locally
node scripts/orchestrator.mjs --limit 5

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
INDEXNOW_KEY=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
```

## 📱 Monitoring

- **GitHub Actions:** https://github.com/signal-ai-news/signal/actions
- **Vercel Dashboard:** https://vercel.com
- **Telegram Channel:** https://t.me/signal_ai_news
- **Website:** https://signal-ai-news-signal.vercel.app

---

**System runs 24/7 autonomously. Check every 1-2 weeks.**

## 📈 Today's Changes (2026-07-22/23)

| Change | Impact |
|---|---|
| Cron schedule fixed (5,35 * * * *) | Auto pipeline every 30 min |
| Quality gate lowered (400→350) | More articles published |
| Pipeline limit increased (3→5) | More articles per run |
| 10 new RSS sources added | 39 total sources |
| 12 affiliate links added | Revenue potential |
| FAQ schema added | Google rich snippets |
| Share buttons added | Viral potential |
| Google News sitemap | Faster indexing |
| Twitter auto-post code | Ready for API keys |
| YouTube token refreshed | Still failing (401) |
| Branding created | Logo + Cover + Bio |
| Articles: 15→21 | AdSense ready |
