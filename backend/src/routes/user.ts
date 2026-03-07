import { Router, Response } from 'express';
import { telegramAuth, AuthenticatedRequest } from '../middleware/telegramAuth';
import { findOrCreateUser, checkAndAwardReferralSpins } from '../services/userService';
import prisma from '../lib/prisma';


const router = Router();

/**
 * GET /api/user
 * Возвращает данные текущего пользователя.
 * Создаёт пользователя если он заходит впервые.
 */
router.get('/', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramUser = req.telegramUser!;
        const user = await findOrCreateUser(telegramUser);
        const spinsLeft = user.freeSpinsCount;

        // Вычисляем время до следующего дневного бонуса
        const lastBonus = (user as any).lastDailyBonusAt as Date | null;
        const nextBonusMs = lastBonus
            ? Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - lastBonus.getTime()))
            : 0;

        res.json({
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            freeSpinsCount: user.freeSpinsCount,
            spinsUsed: user.spinsUsed,
            spinsLeft,
            hasSpinsLeft: spinsLeft > 0,
            nextBonusMs,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/user
 * Явная регистрация или обновление пользователя.
 */
router.post('/', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramUser = req.telegramUser!;
        const user = await findOrCreateUser(telegramUser);
        const spinsLeft = user.freeSpinsCount;

        const lastBonus = (user as any).lastDailyBonusAt as Date | null;
        const nextBonusMs = lastBonus
            ? Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - lastBonus.getTime()))
            : 0;

        res.json({
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            freeSpinsCount: user.freeSpinsCount,
            spinsUsed: user.spinsUsed,
            spinsLeft,
            hasSpinsLeft: spinsLeft > 0,
            nextBonusMs,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/user/reset-pipeline  (только DEV_MODE!)
 * Сбрасывает счётчик spinsUsed → 0.
 */
router.post('/reset-pipeline', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    if (process.env.DEV_MODE !== 'true') {
        res.status(403).json({ error: 'Only available in DEV_MODE' });
        return;
    }
    try {
        const telegramId = String(req.telegramUser!.id);
        const user = await prisma.user.update({
            where: { telegramId },
            data: { spinsUsed: 0, freeSpinsCount: 4 },
        });
        res.json({ ok: true, spinsUsed: user.spinsUsed, freeSpinsCount: user.freeSpinsCount });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Карта призов: prizeId → отображаемые данные
const PRIZE_MAP: Record<string, { name: string; icon: string }> = {
    iphone17: { name: 'iPhone 17 Pro Max 256gb', icon: '📱' },
    zolotoe_yabloko: { name: 'Купон Золотое Яблоко 5000₽', icon: '🍎' },
    ozon: { name: 'Купон Ozon 5000₽', icon: '🛒' },
    uber: { name: 'Купон Uber 10 поездок', icon: '🚗' },
    yandex: { name: 'Купон Яндекс сервисы 5000₽', icon: '🎵' },
    wildberries: { name: 'Купон Wildberries 5000₽', icon: '🛍️' },
    extra_spin_1: { name: '+1 Дополнительный прокрут', icon: '🎰' },
    extra_spin_2: { name: '+2 Дополнительных прокрута', icon: '🎲' },
    telegram_bear: { name: 'Telegram подарок 🐻', icon: '🐻' },
};

/**
 * GET /api/user/prizes
 * Возвращает список выигранных призов текущего пользователя.
 */
router.get('/prizes', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramId = String(req.telegramUser!.id);

        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            res.json({ prizes: [] });
            return;
        }

        const results = await prisma.spinResult.findMany({
            where: {
                userId: user.id,
                prizeId: { not: null },
                result: { not: 'nothing' },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const prizes = results.map((r) => {
            const meta = r.prizeId ? PRIZE_MAP[r.prizeId] : null;
            return {
                id: r.id,
                prizeId: r.prizeId,
                prizeName: meta?.name || r.result,
                prizeIcon: meta?.icon || '🎁',
                result: r.result,
                wonAt: r.createdAt,
            };
        });

        res.json({ prizes });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/user/referral
 * Возвращает реферальный код и статистику.
 * Идемпотентно начисляет прокруты за рефералов.
 */
router.get('/referral', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramId = String(req.telegramUser!.id);
        const stats = await checkAndAwardReferralSpins(telegramId);

        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const botUsername = process.env.BOT_USERNAME || 'LotereyaZolotoeYablokobot';
        const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;

        res.json({
            referralCode: user.referralCode,
            referralLink,
            referralCount: stats.referralCount,
            spinsEarned: stats.spinsEarned,
            spinsLeft: user.freeSpinsCount,
            channelBonusClaimed: user.channelBonusClaimed,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/user/referral/join
 * Привязывает нового пользователя к рефереру (однократно).
 * Тело: { referredByCode: string }
 *
 * FIX: раньше падал с 404 если пользователь ещё не создан (race condition).
 * Теперь сначала upsert-им пользователя через findOrCreateUser, потом привязываем.
 */
router.post('/referral/join', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramUser = req.telegramUser!;
        const telegramId = String(telegramUser.id);
        const { referredByCode } = req.body as { referredByCode?: string };

        if (!referredByCode) {
            res.status(400).json({ error: 'referredByCode is required' });
            return;
        }

        // Создаём пользователя если его ещё нет (фикс race condition: referral/join может
        // вызваться раньше чем GET /api/user успеет создать запись)
        const user = await findOrCreateUser(telegramUser);

        // Уже привязан
        if (user.referredByCode) {
            res.json({ ok: true, alreadyJoined: true });
            return;
        }

        // Нельзя использовать свой же код
        if (user.referralCode === referredByCode) {
            res.status(400).json({ error: 'Cannot use your own referral code' });
            return;
        }

        // Проверяем, что такой код существует
        const referrer = await prisma.user.findFirst({ where: { referralCode: referredByCode } });
        if (!referrer) {
            res.status(404).json({ error: 'Referral code not found' });
            return;
        }

        await prisma.user.update({
            where: { telegramId },
            data: { referredByCode },
        });

        res.json({ ok: true, alreadyJoined: false });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/user/channel-bonus
 * Однократно начисляет 1 прокрут за подписку на канал.
 * Проверка подписки не выполняется — доверяем пользователю.
 */
router.post('/channel-bonus', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramId = String(req.telegramUser!.id);
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.channelBonusClaimed) {
            res.json({ ok: true, alreadyClaimed: true, spinsLeft: user.freeSpinsCount });
            return;
        }

        const updated = await prisma.user.update({
            where: { telegramId },
            data: { channelBonusClaimed: true, freeSpinsCount: { increment: 1 } },
        });

        res.json({ ok: true, alreadyClaimed: false, spinsLeft: updated.freeSpinsCount });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
