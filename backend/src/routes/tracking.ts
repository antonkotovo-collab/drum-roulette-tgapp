import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

/**
 * POST /api/tracking/event
 * Fire-and-forget конверсионное событие с фронтенда.
 * Не требует авторизации (чтобы не зависеть от initData).
 * Body: { event: 'pay_click' | 'scenario_complete', telegramId?: string, source?: string }
 */
router.post('/event', async (req: Request, res: Response) => {
    const { event, telegramId, source } = req.body as {
        event?: string;
        telegramId?: string;
        source?: string;
    };

    if (!event) { res.status(400).json({ error: 'event required' }); return; }

    // Если telegramId не передан — пробуем найти source из профиля пользователя
    let resolvedSource = source;
    if (!resolvedSource && telegramId) {
        try {
            const user = await prisma.user.findUnique({ where: { telegramId }, select: { source: true } });
            resolvedSource = user?.source ?? undefined;
        } catch { /* ignore */ }
    }

    if (!resolvedSource) {
        // Всё равно принимаем событие, просто без source — для аналитики
        resolvedSource = 'unknown';
    }

    try {
        await prisma.trackingEvent.create({
            data: {
                telegramId: telegramId || null,
                source: resolvedSource,
                event,
            },
        });
        logger.info({ event, telegramId, source: resolvedSource }, '[Tracking] Event recorded');
        res.json({ ok: true });
    } catch (err) {
        logger.error({ err }, '[Tracking] Failed to record event');
        res.status(500).json({ error: 'Failed to record event' });
    }
});

export default router;
