/**
 * Устанавливает Telegram Bot Webhook.
 * Запустить один раз на сервере: node scripts/setup-webhook.js
 */
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.FRONTEND_URL; // ваш домен, например https://example.ru
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!BOT_TOKEN) { console.error('❌ BOT_TOKEN не задан в .env'); process.exit(1); }
if (!WEBHOOK_URL) { console.error('❌ FRONTEND_URL не задан в .env'); process.exit(1); }

async function setup() {
    const url = `${WEBHOOK_URL.replace(/\/$/, '')}/bot/webhook`;

    const body = {
        url,
        ...(WEBHOOK_SECRET && { secret_token: WEBHOOK_SECRET }),
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
    };

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.ok) {
        console.log(`✅ Вебхук установлен: ${url}`);
    } else {
        console.error('❌ Ошибка:', data.description);
    }

    // Показываем текущий статус
    const info = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const infoData = await info.json();
    console.log('\nТекущий вебхук:');
    console.log('  URL:', infoData.result?.url);
    console.log('  Pending updates:', infoData.result?.pending_update_count);
}

setup().catch(console.error);
