import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// ─── Проверка admin token ─────────────────────────────────────────────────────

function checkAdminToken(req: Request, res: Response): boolean {
    const token = req.headers['x-admin-token'] || req.body?.adminToken;
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        res.status(403).json({ error: 'Forbidden: invalid admin token' });
        return false;
    }
    return true;
}

// ─── Отправка сообщения ───────────────────────────────────────────────────────

async function sendMessage(chatId: string, text: string, parseMode = 'HTML'): Promise<boolean> {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
        });
        const data = await res.json() as { ok: boolean };
        return data.ok;
    } catch {
        return false;
    }
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

router.get('/stats', async (req: Request, res: Response) => {
    if (!checkAdminToken(req, res)) return;

    // 3 запроса вместо 5: используем findMany для обоих целей
    const [botUsers, appUsers, spinResults] = await Promise.all([
        prisma.botUser.findMany({ select: { telegramId: true } }),
        prisma.user.findMany({ select: { telegramId: true } }),
        prisma.spinResult.count(),
    ]);

    const uniqueIds = new Set([...botUsers.map(u => u.telegramId), ...appUsers.map(u => u.telegramId)]);

    res.json({
        botUsers: botUsers.length,
        miniAppUsers: appUsers.length,
        spinResults,
        totalReachable: uniqueIds.size,
    });
});

// ─── POST /api/admin/broadcast ────────────────────────────────────────────────

/**
 * Рассылает сообщение всем уникальным пользователям из BotUser + User.
 * Дубликаты по telegramId удаляются. Батчи по 25.
 */
router.post('/broadcast', async (req: Request, res: Response) => {
    if (!checkAdminToken(req, res)) return;

    const { text, parseMode = 'HTML' } = req.body as {
        text?: string;
        parseMode?: string;
    };

    if (!text?.trim()) {
        res.status(400).json({ error: 'text is required' });
        return;
    }

    if (!BOT_TOKEN) {
        res.status(500).json({ error: 'BOT_TOKEN not configured' });
        return;
    }

    // Объединяем BotUser + User, удаляем дубликаты
    const [botUsers, appUsers] = await Promise.all([
        prisma.botUser.findMany({ select: { telegramId: true } }),
        prisma.user.findMany({ select: { telegramId: true } }),
    ]);
    const uniqueIds = [...new Set([
        ...botUsers.map(u => u.telegramId),
        ...appUsers.map(u => u.telegramId),
    ])];
    const total = uniqueIds.length;

    res.json({ started: true, total });

    // Отправляем асинхронно батчами
    let sent = 0;
    let failed = 0;
    const BATCH = 25;
    const DELAY_MS = 1100;

    for (let i = 0; i < uniqueIds.length; i += BATCH) {
        const batch = uniqueIds.slice(i, i + BATCH);
        await Promise.all(
            batch.map(async (telegramId) => {
                const ok = await sendMessage(telegramId, text, parseMode);
                if (ok) sent++; else failed++;
            })
        );
        if (i + BATCH < uniqueIds.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    logger.info({ total, sent, failed }, '[Admin] Broadcast complete');
});

export default router;
