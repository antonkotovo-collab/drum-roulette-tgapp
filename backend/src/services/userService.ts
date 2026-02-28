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
export async function findOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    const user = await prisma.user.upsert({
        where: { telegramId: String(telegramUser.id) },
        update: {
            firstName: telegramUser.first_name,
            username: telegramUser.username,
        },
        create: {
            telegramId: String(telegramUser.id),
            firstName: telegramUser.first_name,
            username: telegramUser.username,
            freeSpinsCount: 3,
            spinsUsed: 0,
            lastDailyBonusAt: new Date(),
        },
    });

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
