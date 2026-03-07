import { Router, Response } from 'express';
import { telegramAuth, AuthenticatedRequest } from '../middleware/telegramAuth';
import { activatePromo } from '../services/promoService';
import { logger } from '../lib/logger';

const router = Router();

/**
 * POST /api/promo/activate
 * Body: { code: string }
 */
router.post('/activate', telegramAuth, async (req: AuthenticatedRequest, res: Response) => {
    const telegramId = String(req.telegramUser!.id);
    const code = (req.body?.code as string || '').trim();
    if (!code) { res.status(400).json({ ok: false, error: 'Введите промокод' }); return; }

    try {
        const result = await activatePromo(telegramId, code);
        if (!result.ok) {
            res.status(400).json(result);
        } else {
            res.json(result);
        }
    } catch (e) {
        logger.error(e, '[Promo] Activation error');
        res.status(500).json({ ok: false, error: 'Ошибка сервера' });
    }
});

export default router;
