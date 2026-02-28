import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { telegramAuth, AuthenticatedRequest } from '../middleware/telegramAuth';

const router = Router();

// Карта призов: prizeId → отображаемое имя
const PRIZE_LABELS: Record<string, string> = {
    iphone17: 'iPhone 17 Pro Max',
    zolotoe_yabloko: 'Золотое Яблоко 5000₽',
    ozon: 'Ozon 5000₽',
    uber: 'Uber 10 поездок',
    yandex: 'Яндекс 5000₽',
    wildberries: 'Wildberries 5000₽',
    extra_spin_1: '+1 прокрут',
    extra_spin_2: '+2 прокрута',
    telegram_bear: 'Telegram подарок 🐻',
};

/**
 * GET /api/winners
 * Возвращает последних 20 победителей (спины с реальным призом).
 * Публичный роут — не требует авторизации.
 */
router.get('/', async (_req, res: Response) => {
    try {
        const results = await prisma.spinResult.findMany({
            where: {
                prizeId: { not: null },
                result: { not: 'nothing' },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                user: {
                    select: { firstName: true, username: true, telegramId: true },
                },
            },
        });

        const winners = results.map((r) => ({
            id: r.id,
            firstName: r.user.firstName || r.user.username || 'Пользователь',
            prizeId: r.prizeId,
            prizeName: r.prizeId ? (PRIZE_LABELS[r.prizeId] || r.result) : r.result,
            createdAt: r.createdAt,
        }));

        res.json({ winners });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
