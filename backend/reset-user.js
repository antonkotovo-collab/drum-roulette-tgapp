/**
 * Сбрасывает тестового пользователя (DEV_MODE, telegramId=123456789) в начальное состояние.
 * Запуск: node reset-user.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const telegramId = '123456789';

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
        console.log('Пользователь не найден. Возможно, ещё не заходил в приложение.');
        return;
    }

    // Удаляем историю спинов
    const deleted = await prisma.spinResult.deleteMany({ where: { userId: user.id } });
    console.log(`Удалено спинов: ${deleted.count}`);

    // Убираем реферальные связи: у пользователей, которых пригласил тест-юзер, чистим referredByCode
    if (user.referralCode) {
        const unlinked = await prisma.user.updateMany({
            where: { referredByCode: user.referralCode },
            data: { referredByCode: null },
        });
        console.log(`Очищено реферальных связей: ${unlinked.count}`);
    }

    // Сбрасываем поля пользователя
    await prisma.user.update({
        where: { telegramId },
        data: {
            freeSpinsCount: 2,
            spinsUsed: 0,
            referralSpinsAwarded: 0,
            channelBonusClaimed: false,
            referredByCode: null,
            lastDailyBonusAt: null,
        },
    });

    console.log('✅ Пользователь сброшен: 2 прокрута, история очищена, рефералы обнулены.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
