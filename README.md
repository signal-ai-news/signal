# SIGNAL — AI Tools Intelligence

A self-hunting AI tools archive. Automatically discovers, writes, and publishes articles about AI tools.

## Architecture

```
RSS Sources → Hunter → Generator (Gemini/Groq) → Image (Pollinations)
     → Affiliate Matcher → Quality Gate → Builder → GitHub → Vercel
```

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/signal-ai-news/signal.git
cd signal
npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Run pipeline
node scripts/orchestrator.mjs

# 4. Preview locally
npx serve public
```

## GitHub Actions Setup

Add these secrets to your repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `GROQ_API_KEY` | Your Groq API key |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_USER_ID` | Your Telegram user ID |

## Vercel Deploy

1. Connect repo to Vercel
2. Framework: **Other**
3. Output directory: `public`
4. Auto-deploys on push to `main`

## Scripts

| Script | Purpose |
|--------|---------|
| `node scripts/orchestrator.mjs` | Full pipeline |
| `node scripts/hunter.mjs` | Scan RSS only |
| `node scripts/builder.mjs` | Rebuild site |
| `node scripts/orchestrator.mjs --dry-run` | Test without committing |
| `node scripts/orchestrator.mjs --limit 1` | Process 1 article |

## Manual Steps

| When | What |
|------|------|
| Once: setup | GitHub secrets, Vercel connect, API keys |
| Once: affiliates | Edit `data/affiliates.json` with your referral links |
| Optional | Review published articles every few days |
| Once: ~15+ articles | Apply for Google AdSense |

## File Structure

```
signal/
├── scripts/           # Pipeline scripts
│   ├── config.mjs     # Environment & paths
│   ├── utils.mjs      # Shared utilities
│   ├── hunter.mjs     # RSS scanner
│   ├── generator.mjs  # AI article writer
│   ├── imageFetcher.mjs # Pollinations images
│   ├── affiliateMatcher.mjs # Link injection
│   ├── qualityGate.mjs # Pre-publish checks
│   ├── builder.mjs    # Static site generator
│   ├── tgNotify.mjs   # Telegram notifications
│   └── orchestrator.mjs # Main pipeline
├── data/
│   ├── sources.json   # RSS feed list
│   ├── affiliates.json # Affiliate links
│   ├── signals.json   # Discovered signals
│   └── articles.json  # Generated articles
├── public/            # Built site (Vercel deploys this)
│   ├── index.html
│   ├── articles/
│   ├── images/
│   ├── sitemap.xml
│   └── robots.txt
└── .github/workflows/ # Automation
```
