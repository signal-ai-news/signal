/**
 * TELEGRAM NOTIFY — Sends notifications about pipeline activity.
 * Run: node scripts/tgNotify.mjs "message"
 */
import fetch from 'node-fetch';
import { TG_BOT, TG_USER, SITE_URL } from './config.mjs';

export async function notify(message, parseMode = 'HTML') {
  if (!TG_BOT || !TG_USER) {
    console.log('  ⚠ Telegram not configured, skipping notification.');
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_USER,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: false
      })
    });

    if (res.ok) {
      console.log('  📱 Telegram notification sent.');
    } else {
      const err = await res.text();
      console.error(`  ✗ Telegram error: ${err}`);
    }
  } catch (err) {
    console.error(`  ✗ Telegram send failed: ${err.message}`);
  }
}

export function buildPublishMessage(article) {
  return `🟢 <b>NEW ARTICLE LIVE</b>

<b>${article.title}</b>

${article.dek || ''}

<a href="${SITE_URL}/articles/${article.slug}.html">Read on SIGNAL →</a>

📊 ${article.wordCount} words · ${article.affiliates?.length || 0} affiliate links
🏷 ${article.tags?.join(', ') || 'untagged'}`;
}

export function buildErrorMessage(step, error) {
  return `🔴 <b>PIPELINE ERROR</b>

Step: <code>${step}</code>
Error: ${error.substring(0, 200)}

Check logs for details.`;
}

export function buildHuntReport(newSignals) {
  return `🔍 <b>HUNT COMPLETE</b>

${newSignals.length} new signal(s) found.

${newSignals.slice(0, 5).map(s =>
  `• ${s.title.substring(0, 60)}...`
).join('\n')}${newSignals.length > 5 ? `\n...and ${newSignals.length - 5} more` : ''}`;
}

// Run standalone
if (process.argv[1]?.endsWith('tgNotify.mjs')) {
  const msg = process.argv[2] || '🧪 Test notification from SIGNAL pipeline';
  notify(msg).then(() => console.log('Done'));
}
