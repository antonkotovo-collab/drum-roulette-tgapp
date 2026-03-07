import { Router, Response } from 'express';
import { telegramAuth, AuthenticatedRequest } from '../middleware/telegramAuth';
import { getSpinResult, COUPON_PRIZES } from '../services/spinService';
import {
    findOrCreateUser,
    consumeSpin,
    saveSpinResult,
    addExtraSpins,
} from '../services/userService';
import { consumeGuaranteedPrize } from '../services/promoService';
import { logger } from '../lib/logger';

const router = Router();

// ── Отправка Telegram-подарка медведя ────────────────────────────────────────
// НАСТРОЙКА: укажи ID подарка из getAvailableGifts API
// Чтобы узнать gift_id: GET https://api.telegram.org/bot{TOKEN}/getAvailableGifts
const TELEGRAM_BEAR_GIFT_ID = process.env.TELEGRAM_BEAR_GIFT_ID || '';

async function sendTelegramBearGift(telegramId: number): Promise<boolean> {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken || !TELEGRAM_BEAR_GIFT_ID) {
        logger.warn('[Bear Gift] BOT_TOKEN or TELEGRAM_BEAR_GIFT_ID not configured');
        return false;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendGift`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: telegramId,
                gift_id: TELEGRAM_BEAR_GIFT_ID,
            }),
        });
        const data = await res.json() as { ok: boolean; description?: string };
        if (!data.ok) {
            logger.error({ description: data.description }, '[Bear Gift] Telegram API error');
            return false;
        }
        logger.info({ telegramId }, '🐻 Bear gift sent');
        return true;
    } catch (err) {
        logger.error({ err }, '[Bear Gift] Network error');
        return false;
    }
}

/**
 * POST /api/spin
 */
router.post('/', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const telegramUser = req.telegramUser!;
        const telegramId = String(telegramUser.id);
        const isDevMode = process.env.DEV_MODE === 'true';

        const baseUser = await findOrCreateUser(telegramUser);

        const spinData = await consumeSpin(telegramId);
        if (!spinData) {
            res.status(403).json({
                error: 'No spins left',
                message: 'У вас закончились прокруты',
            });
            return;
        }
        const user = spinData.user;
        const spinNumber = spinData.spinNumber;

        // ── Проверка гарантированного приза из промокода ─────────────────────
        const guaranteedPrizeId = await consumeGuaranteedPrize(telegramId);

        let spinResult: { result: string; prizeId: string | null; prize: typeof COUPON_PRIZES[0] | null };

        if (guaranteedPrizeId) {
            // Переопределяем результат гарантированным призом
            if (guaranteedPrizeId === 'coupon') {
                const coupon = COUPON_PRIZES[Math.floor(Math.random() * COUPON_PRIZES.length)];
                spinResult = { result: coupon.name, prizeId: coupon.id, prize: coupon };
            } else if (guaranteedPrizeId === 'extra_spin_1') {
                spinResult = { result: '+1 Дополнительный прокрут', prizeId: 'extra_spin_1', prize: null };
            } else if (guaranteedPrizeId === 'extra_spin_2') {
                spinResult = { result: '+2 Дополнительных прокрута', prizeId: 'extra_spin_2', prize: null };
            } else if (guaranteedPrizeId === 'telegram_bear') {
                spinResult = { result: 'Telegram подарок 🐻 Медведь', prizeId: 'telegram_bear', prize: null };
            } else {
                spinResult = getSpinResult(user.id, spinNumber);
            }
        } else {
            // Обычный сценарий
            spinResult = getSpinResult(user.id, spinNumber);
        }

        // Сохранить в БД
        await saveSpinResult(user.id, spinNumber, spinResult.result, spinResult.prizeId);

        // Начислить дополнительные прокруты и взять актуальный счётчик
        let finalSpinsCount = user.freeSpinsCount;
        if (spinResult.prizeId === 'extra_spin_1') {
            const updated = await addExtraSpins(telegramId, 1);
            finalSpinsCount = updated.freeSpinsCount;
        } else if (spinResult.prizeId === 'extra_spin_2') {
            const updated = await addExtraSpins(telegramId, 2);
            finalSpinsCount = updated.freeSpinsCount;
        }

        // Отправить Telegram-подарок 🐻 (только prod, асинхронно — не блокирует ответ)
        if (!isDevMode && spinResult.prizeId === 'telegram_bear') {
            sendTelegramBearGift(telegramUser.id).catch(console.error);
        }

        res.json({
            success: true,
            spinNumber,
            result: spinResult.result,
            prizeId: spinResult.prizeId,
            prize: spinResult.prize,
            spinsLeft: finalSpinsCount,
            isWin: spinResult.result !== 'nothing',
        });
    } catch (error) {
        logger.error({ error }, 'Spin error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
