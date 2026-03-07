import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export const GUARANTEE_OPTIONS = [
    { id: 'coupon', label: 'Случайный купон' },
    { id: 'extra_spin_1', label: '+1 дополнительный спин' },
    { id: 'extra_spin_2', label: '+2 дополнительных спина' },
    { id: 'telegram_bear', label: 'Telegram Медведь 🐻' },
] as const;

// ─── Activate promo (user endpoint) ──────────────────────────────────────────

export async function activatePromo(
    telegramId: string,
    rawCode: string,
): Promise<{ ok: true; spinsGranted: number; guaranteedPrizeId: string | null; message: string }
    | { ok: false; error: string }> {
    const code = rawCode.trim().toUpperCase();

    const promo = await prisma.promoCode.findUnique({ where: { code } });

    if (!promo) return { ok: false, error: 'Промокод не найден' };
    if (!promo.isActive) return { ok: false, error: 'Промокод неактивен' };
    if (promo.maxActivations !== null && promo.activationsCount >= promo.maxActivations) {
        return { ok: false, error: 'Промокод исчерпан' };
    }

    // Check if user already activated this promo
    const existing = await prisma.promoActivation.findUnique({
        where: { promoCodeId_telegramId: { promoCodeId: promo.id, telegramId } },
    });
    if (existing) return { ok: false, error: 'Вы уже активировали этот промокод' };

    // Atomic activation: create activation + increment counter + add spins
    await prisma.$transaction([
        prisma.promoActivation.create({
            data: {
                promoCodeId: promo.id,
                telegramId,
                guaranteeUsed: !promo.guaranteedPrizeId, // if no guarantee — mark as used already
            },
        }),
        prisma.promoCode.update({
            where: { id: promo.id },
            data: { activationsCount: { increment: 1 } },
        }),
        prisma.user.update({
            where: { telegramId },
            data: { freeSpinsCount: { increment: promo.spinsGranted } },
        }),
    ]);

    logger.info({ telegramId, code, spinsGranted: promo.spinsGranted }, '[Promo] Activated');
    return {
        ok: true,
        spinsGranted: promo.spinsGranted,
        guaranteedPrizeId: promo.guaranteedPrizeId,
        message: `✅ Промокод активирован! +${promo.spinsGranted} спин${promo.spinsGranted > 1 ? 'а' : ''}${promo.guaranteedPrizeId ? ' + гарантированный приз!' : ''}`,
    };
}

// ─── Check & consume guaranteed prize (called from spin.ts) ──────────────────

export async function consumeGuaranteedPrize(
    telegramId: string,
): Promise<string | null> {
    // Find an unused guarantee for this user
    const activation = await prisma.promoActivation.findFirst({
        where: { telegramId, guaranteeUsed: false },
        include: { promoCode: { select: { guaranteedPrizeId: true, isActive: true } } },
        orderBy: { activatedAt: 'asc' },
    });

    if (!activation || !activation.promoCode.isActive || !activation.promoCode.guaranteedPrizeId) {
        return null;
    }

    // Mark guarantee as used
    await prisma.promoActivation.update({
        where: { id: activation.id },
        data: { guaranteeUsed: true },
    });

    logger.info({ telegramId, prize: activation.promoCode.guaranteedPrizeId }, '[Promo] Guarantee consumed');
    return activation.promoCode.guaranteedPrizeId;
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function listPromos() {
    return prisma.promoCode.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { activations: true } } },
    });
}

export async function createPromo(data: {
    code: string;
    description?: string;
    spinsGranted: number;
    guaranteedPrizeId?: string | null;
    maxActivations?: number | null;
}) {
    const code = data.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) throw new Error('Invalid code');
    return prisma.promoCode.create({
        data: {
            code,
            description: data.description || null,
            spinsGranted: Math.max(1, Math.min(50, data.spinsGranted || 1)),
            guaranteedPrizeId: data.guaranteedPrizeId || null,
            maxActivations: data.maxActivations ?? null,
        },
    });
}

export async function togglePromo(id: number) {
    const current = await prisma.promoCode.findUniqueOrThrow({ where: { id } });
    return prisma.promoCode.update({ where: { id }, data: { isActive: !current.isActive } });
}

export async function deletePromo(id: number) {
    // Delete activations first, then code
    await prisma.promoActivation.deleteMany({ where: { promoCodeId: id } });
    return prisma.promoCode.delete({ where: { id } });
}

export async function generateCode(prefix?: string): Promise<string> {
    const base = prefix ? prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) : '';
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return base ? `${base}${suffix}` : suffix;
}
