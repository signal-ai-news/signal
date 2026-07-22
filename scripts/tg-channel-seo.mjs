/**
 * TELEGRAM CHANNEL SEO — Optimize channel for organic discovery
 * Run: node scripts/tg-channel-seo.mjs
 * Requires: TG_BOT_TOKEN, TG_CHANNEL_ID in environment
 */
import fetch from 'node-fetch';

const TG_BOT = process.env.TG_BOT_TOKEN || '';
const TG_CHANNEL = process.env.TG_CHANNEL_ID || '';

// ─── SEO-Optimized Channel Description ───
const CHANNEL_DESCRIPTION = `📡 SIGNAL — AI Tools Intelligence

AI tools, tracked daily. Hunted, verified, written.

🔍 What you'll find here:
• Daily AI news and tool reviews
• Breaking AI developments
• Practical AI tool recommendations
• No hype, no fluff — just signal

🌐 Website: https://signal-ai-news-signal.vercel.app
🐦 Twitter: https://x.com/_signalainews
📺 YouTube: @signal_ai_news

Updated daily from 22+ sources. Fully automated, editorially reviewed.

#AI #AITools #ArtificialIntelligence #MachineLearning #LLM #GPT #Claude #Gemini #AINews #TechNews #AIReviews`;

// ─── Pinned Welcome Message ───
const WELCOME_MESSAGE = `📡 Welcome to SIGNAL — AI Tools Intelligence

This channel delivers daily AI tool news, reviews, and breaking developments.

✅ What we cover:
• New AI tool launches
• AI model updates (GPT, Claude, Gemini, etc.)
• AI industry news
• Practical tool recommendations

🔗 Links:
• Website: https://signal-ai-news-signal.vercel.app
• Twitter: https://x.com/_signalainews
• YouTube: @signal_ai_news

📊 Updated daily from 22+ sources. Fully automated, editorially reviewed.

Share with anyone interested in AI tools! 🚀`;

// ─── Update Channel Description ───
async function updateDescription() {
  if (!TG_BOT || !TG_CHANNEL) {
    console.log('TG_BOT_TOKEN or TG_CHANNEL_ID not set');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_BOT}/setChatDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHANNEL,
        description: CHANNEL_DESCRIPTION
      })
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Channel description updated!');
      return true;
    } else {
      console.log(`❌ Error: ${data.description}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    return false;
  }
}

// ─── Send and Pin Welcome Message ───
async function sendAndPinWelcome() {
  if (!TG_BOT || !TG_CHANNEL) {
    console.log('TG_BOT_TOKEN or TG_CHANNEL_ID not set');
    return false;
  }

  try {
    // Send welcome message
    const sendRes = await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHANNEL,
        text: WELCOME_MESSAGE,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const sendData = await sendRes.json();
    if (!sendData.ok) {
      console.log(`❌ Send failed: ${sendData.description}`);
      return false;
    }

    const messageId = sendData.result.message_id;
    console.log(`✅ Welcome message sent (ID: ${messageId})`);

    // Pin the message
    const pinRes = await fetch(`https://api.telegram.org/bot${TG_BOT}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHANNEL,
        message_id: messageId,
        disable_notification: false
      })
    });

    const pinData = await pinRes.json();
    if (pinData.ok) {
      console.log('✅ Welcome message pinned!');
    } else {
      console.log(`⚠ Pin failed: ${pinData.description}`);
    }

    return true;
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    return false;
  }
}

// ─── Set Channel Photo (optional) ───
async function setChannelPhoto(photoPath) {
  if (!TG_BOT || !TG_CHANNEL || !photoPath) return false;

  try {
    const formData = new FormData();
    formData.append('chat_id', TG_CHANNEL);
    formData.append('photo', photoPath);

    const res = await fetch(`https://api.telegram.org/bot${TG_BOT}/setChatPhoto`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Channel photo updated!');
      return true;
    } else {
      console.log(`⚠ Photo update: ${data.description}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Photo failed: ${err.message}`);
    return false;
  }
}

// ─── Get Channel Stats ───
async function getChannelStats() {
  if (!TG_BOT || !TG_CHANNEL) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_BOT}/getChatMemberCount?chat_id=${TG_CHANNEL}`);
    const data = await res.json();
    if (data.ok) {
      console.log(`📊 Channel members: ${data.result}`);
      return data.result;
    }
  } catch (err) {
    console.log(`⚠ Stats failed: ${err.message}`);
  }
  return null;
}

// ─── Run All Optimizations ───
async function optimizeChannel() {
  console.log('═══════════════════════════════════════');
  console.log('  TELEGRAM CHANNEL SEO OPTIMIZATION');
  console.log('═══════════════════════════════════════\n');

  // 1. Get current stats
  console.log('📊 Current Stats:');
  await getChannelStats();

  // 2. Update description with SEO keywords
  console.log('\n📝 Updating Description...');
  await updateDescription();

  // 3. Send and pin welcome message
  console.log('\n📌 Setting Up Welcome Message...');
  await sendAndPinWelcome();

  console.log('\n═══════════════════════════════════════');
  console.log('  ✅ OPTIMIZATION COMPLETE');
  console.log('═══════════════════════════════════════');

  // SEO Tips
  console.log('\n📋 ADDITIONAL SEO TIPS:');
  console.log('1. Share channel link on Twitter, Reddit, LinkedIn');
  console.log('2. Add channel to Telegram directory sites');
  console.log('3. Cross-promote in related AI channels');
  console.log('4. Use consistent hashtags in every post');
  console.log('5. Post at peak hours (8-10 AM, 6-8 PM)');
  console.log('6. Engage with members who comment');
  console.log('7. Create a Telegram group for discussions');
}

// Run standalone
if (process.argv[1]?.endsWith('tg-channel-seo.mjs')) {
  optimizeChannel().catch(console.error);
}

export { optimizeChannel, updateDescription, sendAndPinWelcome, getChannelStats };
