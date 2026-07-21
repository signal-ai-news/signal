// ─── Environment (set via .env, shell, or GitHub Actions secrets) ───
export const GEMINI_KEY   = process.env.GEMINI_API_KEY   || '';
export const GROQ_KEY     = process.env.GROQ_API_KEY     || '';
export const TG_BOT       = process.env.TG_BOT_TOKEN     || '';
export const TG_USER      = process.env.TG_USER_ID       || '';
export const GH_TOKEN     = process.env.GITHUB_TOKEN      || '';

export const USE_MODEL    = 'groq'; // 'gemini' or 'groq'

export const REPO         = 'signal-ai-news/signal';
export const SITE_URL     = 'https://signal-ai-news.vercel.app';

// ─── Paths ───
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');

export const SIGNALS_FILE   = path.join(ROOT, 'data', 'signals.json');
export const ARTICLES_FILE  = path.join(ROOT, 'data', 'articles.json');
export const AFFILIATES_FILE= path.join(ROOT, 'data', 'affiliates.json');
export const SOURCES_FILE   = path.join(ROOT, 'data', 'sources.json');
export const DRAFTS_DIR     = path.join(ROOT, 'content', 'drafts');
export const PUBLISHED_DIR  = path.join(ROOT, 'content', 'published');
export const PUBLIC_DIR     = path.join(ROOT, 'public');
export const TEMPLATE_FILE  = path.join(ROOT, 'public', 'index.html');
