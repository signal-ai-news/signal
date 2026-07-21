/**
 * BRANDING RENDER — Renders all branding assets to PNG using Playwright
 * Run: node scripts/render-branding.mjs
 */
import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'public', 'branding');
const TEMPLATE = path.join(ROOT, 'templates', 'branding.html');

const ASSETS = [
  { id: 'youtube-profile',  file: 'youtube-profile.png',  width: 800,  height: 800  },
  { id: 'youtube-banner',   file: 'youtube-banner.png',   width: 2560, height: 1440 },
  { id: 'twitter-profile',  file: 'twitter-profile.png',  width: 400,  height: 400  },
  { id: 'twitter-header',   file: 'twitter-header.png',   width: 1500, height: 500  },
  { id: 'telegram-profile', file: 'telegram-profile.png', width: 512,  height: 512  },
  { id: 'telegram-cover',   file: 'telegram-cover.png',   width: 1280, height: 640  },
  { id: 'favicon',          file: 'favicon.png',          width: 32,   height: 32   },
  { id: 'og-image',         file: 'og-image.png',         width: 1200, height: 630  },
];

async function render() {
  console.log('🎨 BRANDING RENDER — Starting...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/ms-playwright/chromium-1223/chrome-linux64/chrome'
  });
  const context = await browser.newContext();

  for (const asset of ASSETS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: asset.width, height: asset.height });
    await page.goto(`file://${TEMPLATE}`, { waitUntil: 'networkidle' });

    const element = await page.locator(`#${asset.id}`);
    await element.screenshot({
      path: path.join(OUTPUT_DIR, asset.file),
      type: 'png',
    });

    console.log(`  ✅ ${asset.file} (${asset.width}x${asset.height})`);
    await page.close();
  }

  await browser.close();
  console.log(`\n✅ All assets rendered to ${OUTPUT_DIR}/\n`);
}

render().catch(console.error);
