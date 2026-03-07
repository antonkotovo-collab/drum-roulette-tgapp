import { Prisma, User } from '@prisma/client';
import { TelegramUser } from '../middleware/telegramAuth';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * Находит пользователя в БД по telegramId или создаёт нового.
 * При первом входе начисляются 3 фри спина.
 * При каждом входе обновляются имя/юзернейм.
 * Если прошло 24ч с последнего дейли бонуса — начисляет +1 спин.
 */
/** Генерирует уникальный 6-значный реферальный код из telegramId */
function generateReferralCode(telegramId: string): string {
    const num = BigInt(telegramId) ^ BigInt(Date.now());
    return num.toString(36).slice(-6).toUpperCase();
}

export async function findOrCreateUser(
    telegramUser: TelegramUser,
    referredByCode?: string,
    source?: string,
): Promise<User> {
    // Генерируем код заранее, чтобы использовать при create
    const newCode = generateReferralCode(String(telegramUser.id));

    const user = await prisma.user.upsert({
        where: { telegramId: String(telegramUser.id) },
        update: {
            firstName: telegramUser.first_name,
            username: telegramUser.username,
            // Перезаписываем source если пользователь пришёл по новой трекинговой ссылке
            ...(source ? { source } : {}),
        },
        create: {
            telegramId: String(telegramUser.id),
            firstName: telegramUser.first_name,
            username: telegramUser.username,
            freeSpinsCount: 4,
            spinsUsed: 0,
            lastDailyBonusAt: new Date(),
            referralCode: newCode,
            referredByCode: referredByCode || null,
            source: source || null,
        },
    });


    // Если код ещё не назначен (старые пользователи) — назначить
    if (!user.referralCode) {
        const updated = await prisma.user.update({
            where: { telegramId: String(telegramUser.id) },
            data: { referralCode: newCode },
        });
        return updated;
    }

    // Daily bonus: +1 прокрут каждые 24 часа
    const now = new Date();
    const eligible =
        !user.lastDailyBonusAt ||
        now.getTime() - user.lastDailyBonusAt.getTime() >= 24 * 60 * 60 * 1000;

    if (eligible) {
        const updated = await prisma.user.update({
            where: { telegramId: String(telegramUser.id) },
            data: {
                freeSpinsCount: { increment: 1 },
                lastDailyBonusAt: now,
            },
        });
        logger.info({ telegramId: user.telegramId }, '🎁 Daily bonus spin awarded');
        return updated;
    }

    return user;
}


/**
 * Использует один спин: уменьшает freeSpinsCount, увеличивает spinsUsed.
 * Возвращает обновлённого пользователя и номер спина или null если спинов нет.
 * Использует транзакцию для атомарности.
 */
export async function consumeSpin(
    telegramId: string,
): Promise<{ user: User; spinNumber: number } | null> {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { telegramId } });

        if (!user || user.freeSpinsCount <= 0) {
            return null;
        }

        const spinNumber = user.spinsUsed + 1;

        const updatedUser = await tx.user.update({
            where: { telegramId },
            data: {
                freeSpinsCount: { decrement: 1 },
                spinsUsed: { increment: 1 },
            },
        });

        return { user: updatedUser, spinNumber };
    });
}

/**
 * Записывает результат спина в историю.
 */
export async function saveSpinResult(
    userId: number,
    spinNumber: number,
    result: string,
    prizeId: string | null,
) {
    return prisma.spinResult.create({
        data: { userId, spinNumber, result, prizeId },
    });
}

/**
 * Добавляет дополнительные спины пользователю (если выпал приз «+1 или +2 прокрута»).
 */
export async function addExtraSpins(telegramId: string, count: number): Promise<User> {
    return prisma.user.update({
        where: { telegramId },
        data: { freeSpinsCount: { increment: count } },
    });
}

/**
 * Идемпотентно начисляет прокруты за рефералов:
 * каждые 3 новых реферала = +1 прокрут.
 * Возвращает { referralCount, spinsEarned, newSpinsAwarded }
 */
export async function checkAndAwardReferralSpins(
    telegramId: string,
): Promise<{ referralCount: number; spinsEarned: number; newSpinsAwarded: number }> {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user || !user.referralCode) {
        return { referralCount: 0, spinsEarned: 0, newSpinsAwarded: 0 };
    }

    const referralCount = await prisma.user.count({
        where: { referredByCode: user.referralCode },
    });

    const totalSpinsEarned = Math.floor(referralCount / 3);
    const newSpinsAwarded = totalSpinsEarned - user.referralSpinsAwarded;

    if (newSpinsAwarded > 0) {
        await prisma.user.update({
            where: { telegramId },
            data: {
                freeSpinsCount: { increment: newSpinsAwarded },
                referralSpinsAwarded: { increment: newSpinsAwarded },
            },
        });
        logger.info({ telegramId, newSpinsAwarded }, '🎁 Referral spins awarded');
    }

    return { referralCount, spinsEarned: totalSpinsEarned, newSpinsAwarded };
}
