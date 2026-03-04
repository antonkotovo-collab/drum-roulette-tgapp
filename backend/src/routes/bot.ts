import { Router, Request, Response } from 'express';
import { logger } from '../lib/logger';

const router = Router();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const FRONTEND_URL = process.env.FRONTEND_URL || '';

// ─── Отправка Telegram-сообщения ───────────────────────────────────────────

async function sendMessage(chatId: number | string, text: string, extra?: object) {
    if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
        logger.warn('[Bot] BOT_TOKEN not configured, skipping sendMessage');
        return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
            signal: controller.signal,
        });
        const data = await res.json() as any;
        if (!data.ok) {
            logger.error({ data }, '[Bot] sendMessage failed');
        } else {
            logger.info({ chatId }, '[Bot] sendMessage ok');
        }
    } catch (err: any) {
        if (err.name !== 'AbortError') logger.error({ err }, '[Bot] sendMessage error');
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Приветственное сообщение ─────────────────────────────────────────────

function welcomeMessage(firstName: string): string {
    return [
        `🥁 <b>Привет, ${firstName}!</b>`,
        '',
        'Добро пожаловать в <b>Мартовскую Лихорадку</b> — барабанную рулетку с реальными призами!',
        '',
        '🎁 <b>Что тебя ждёт:</b>',
        '• Крути барабан и выигрывай купоны на 5000₽',
        '• Приглашай друзей — получай бесплатные прокруты',
        '• Ежедневные бонусы и подарки',
        '',
        '👇 Нажми кнопку ниже и начни крутить прямо сейчас!',
    ].join('\n');
}

// ─── Обработка update ────────────────────────────────────────────────────

async function handleUpdate(update: any) {
    const message = update?.message;
    if (!message) return;

    const from = message.from;
    if (!from) return;

    const telegramId = String(from.id);
    const text: string = message.text || '';

    if (text.startsWith('/start')) {
        const firstName = from.first_name || 'друг';

        // 1. СНАЧАЛА отправляем приветственное сообщение
        await sendMessage(from.id, welcomeMessage(firstName), {
            reply_markup: {
                inline_keyboard: [[
                    FRONTEND_URL
                        ? { text: '🎡 Открыть рулетку', web_app: { url: FRONTEND_URL } }
                        : { text: '🎡 Открыть рулетку', url: `https://t.me/${BOT_USERNAME}` },
                ]],
            },
        });

        logger.info({ telegramId, firstName }, '[Bot] /start handled — welcome sent');

        // Реферальный параметр — запоминаем для будущей привязки
        const parts = text.split(' ');
        const startParam = parts[1];
        if (startParam?.startsWith('ref_')) {
            logger.info({ telegramId, startParam }, '[Bot] Referral start param received');
        }
    }
}

// ─── Webhook endpoint ─────────────────────────────────────────────────────

/**
 * POST /bot/webhook
 * Telegram присылает сюда обновления. Защищён X-Telegram-Bot-Api-Secret-Token.
 */
router.post('/webhook', async (req: Request, res: Response) => {
    if (WEBHOOK_SECRET) {
        const header = req.headers['x-telegram-bot-api-secret-token'];
        if (header !== WEBHOOK_SECRET) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
    }

    // Отвечаем сразу 200 — Telegram не ждёт долго
    res.json({ ok: true });

    // Обрабатываем асинхронно, не блокируя ответ
    handleUpdate(req.body).catch((err) => {
        logger.error({ err }, '[Bot] handleUpdate error');
    });
});

export default router;
