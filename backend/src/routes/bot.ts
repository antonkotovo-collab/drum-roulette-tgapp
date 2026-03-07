import { Router, Request, Response } from 'express';
import { logger } from '../lib/logger';
import { findOrCreateUser } from '../services/userService';
import { getWelcomeConfig } from '../services/botConfig';

const router = Router();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const FRONTEND_URL = process.env.FRONTEND_URL || '';

// ─── Отправка Telegram-сообщения ──────────────────────────────────────────────

async function telegramApi(method: string, body: object): Promise<any> {
    if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
        logger.warn('[Bot] BOT_TOKEN not configured, skipping ' + method);
        return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const data = await res.json() as any;
        if (!data.ok) logger.error({ data, method }, '[Bot] API call failed');
        else logger.info({ method }, '[Bot] API call ok');
        return data;
    } catch (err: any) {
        if (err.name !== 'AbortError') logger.error({ err, method }, '[Bot] API error');
    } finally {
        clearTimeout(timeout);
    }
}

// Отправка файла в Telegram (multipart) — для загрузки медиа из админки
export async function uploadMediaToTelegram(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    storageChatId: string,
): Promise<{ fileId: string; type: 'photo' | 'video' } | null> {
    if (!BOT_TOKEN) return null;

    const isVideo = mimeType.startsWith('video/');
    const method = isVideo ? 'sendVideo' : 'sendPhoto';
    const fieldName = isVideo ? 'video' : 'photo';

    const form = new FormData();
    form.append('chat_id', storageChatId);
    form.append(fieldName, new Blob([fileBuffer], { type: mimeType }), filename);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            body: form,
            signal: controller.signal,
        });
        const data = await res.json() as any;
        if (!data.ok) {
            logger.error({ data }, '[Bot] uploadMedia failed');
            return null;
        }
        const msg = data.result;
        const fileId: string = isVideo
            ? msg.video?.file_id
            : (msg.photo?.at(-1)?.file_id ?? '');
        return { fileId, type: isVideo ? 'video' : 'photo' };
    } catch (err) {
        logger.error({ err }, '[Bot] uploadMedia error');
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Приветственное сообщение ─────────────────────────────────────────────────

async function sendWelcome(chatId: number, firstName: string, webAppUrl: string) {
    const cfg = await getWelcomeConfig();
    const text = cfg.text.replace(/\{\{name\}\}/g, firstName);

    const keyboard = {
        reply_markup: {
            inline_keyboard: [[
                webAppUrl
                    ? { text: '🎡 Открыть рулетку', web_app: { url: webAppUrl } }
                    : { text: '🎡 Открыть рулетку', url: `https://t.me/${BOT_USERNAME}` },
            ]],
        },
    };

    if (cfg.mediaId && cfg.mediaType === 'photo') {
        await telegramApi('sendPhoto', {
            chat_id: chatId,
            photo: cfg.mediaId,
            caption: text,
            parse_mode: 'HTML',
            ...keyboard,
        });
    } else if (cfg.mediaId && cfg.mediaType === 'video') {
        await telegramApi('sendVideo', {
            chat_id: chatId,
            video: cfg.mediaId,
            caption: text,
            parse_mode: 'HTML',
            ...keyboard,
        });
    } else {
        await telegramApi('sendMessage', {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            ...keyboard,
        });
    }
}

// ─── Обработка update ─────────────────────────────────────────────────────────

async function handleUpdate(update: any) {
    const message = update?.message;
    if (!message) return;

    const from = message.from;
    if (!from) return;

    const telegramId = String(from.id);
    const text: string = message.text || '';

    if (text.startsWith('/start')) {
        const firstName = from.first_name || 'друг';
        const parts = text.split(' ');
        const startParam = parts[1];

        // ─ Трекинговый источник (src_<slug>) ─────────────────────────────────
        let source: string | undefined;
        if (startParam?.startsWith('src_')) {
            source = startParam.slice(4);
            logger.info({ telegramId, source }, '[Bot] Tracking source detected');
        }

        // ─ Реферальный параметр (ref_<code>) ─────────────────────────────────
        const webAppUrl = (FRONTEND_URL && startParam?.startsWith('ref_'))
            ? `${FRONTEND_URL}?ref=${startParam.slice(4)}`
            : FRONTEND_URL;

        if (startParam?.startsWith('ref_')) {
            logger.info({ telegramId, startParam, webAppUrl }, '[Bot] Referral start param');
        }

        // ─ Создаём/обновляем пользователя ────────────────────────────────────
        try {
            await findOrCreateUser(
                { id: from.id, first_name: from.first_name, username: from.username },
                undefined,
                source,
            );
        } catch (err) {
            logger.error({ err }, '[Bot] findOrCreateUser error');
        }

        // ─ Отправляем приветственное сообщение ───────────────────────────────
        await sendWelcome(from.id, firstName, webAppUrl);

        logger.info({ telegramId, firstName, source }, '[Bot] /start handled');
    }
}

// ─── Webhook endpoint ─────────────────────────────────────────────────────────

router.post('/webhook', async (req: Request, res: Response) => {
    if (WEBHOOK_SECRET) {
        const header = req.headers['x-telegram-bot-api-secret-token'];
        if (header !== WEBHOOK_SECRET) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
    }

    res.json({ ok: true });

    handleUpdate(req.body).catch((err) => {
        logger.error({ err }, '[Bot] handleUpdate error');
    });
});

export default router;
