/**
 * Тест реферальной системы.
 * Создаёт 3 фейковых пользователей с referredByCode = код тестового юзера.
 * Затем вызывает GET /api/user/referral и проверяет что начислился прокрут.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Найти тестового пользователя (DEV_MODE id = 123456789)
    const testUser = await prisma.user.findUnique({ where: { telegramId: '123456789' } });
    if (!testUser || !testUser.referralCode) {
        console.error('❌ Тестовый пользователь не найден или нет referralCode. Открой приложение сначала.');
        return;
    }
    const code = testUser.referralCode;
    console.log(`✅ Тестовый пользователь найден. referralCode = ${code}`);
    console.log(`   Спинов до теста: ${testUser.freeSpinsCount}`);
    console.log(`   referralSpinsAwarded: ${testUser.referralSpinsAwarded}`);
    console.log('');

    // 2. Создать 3 фейковых рефераллов
    console.log('👤 Создаю 3 фейковых реферала...');
    for (let i = 1; i <= 3; i++) {
        const fakeId = `fake_ref_${Date.now()}_${i}`;
        await prisma.user.upsert({
            where: { telegramId: fakeId },
            update: {},
            create: {
                telegramId: fakeId,
                firstName: `FakeUser${i}`,
                freeSpinsCount: 1,
                spinsUsed: 0,
                referralCode: `FAKE${i}X`,
                referredByCode: code,
            },
        });
        console.log(`   ✅ Создан FakeUser${i} (referredByCode = ${code})`);
    }

    // 3. Вызываем checkAndAwardReferralSpins напрямую через fetch
    console.log('');
    console.log('🔄 Вызываю GET /api/user/referral...');
    const res = await fetch(`http://localhost:3001/api/user/referral?initData=dev_mode`);
    const json = await res.json();
    console.log('📊 Ответ сервера:', JSON.stringify(json, null, 2));

    // 4. Проверить БД
    const updated = await prisma.user.findUnique({ where: { telegramId: '123456789' } });
    console.log('');
    console.log('🎁 Результат:');
    console.log(`   referralCount: ${json.referralCount}`);
    console.log(`   spinsEarned:   ${json.spinsEarned}`);
    console.log(`   spinsLeft:     ${json.spinsLeft}`);
    console.log(`   referralSpinsAwarded в БД: ${updated.referralSpinsAwarded}`);
    console.log('');
    if (json.spinsEarned >= 1) {
        console.log('✅ ТЕСТ ПРОЙДЕН: начислен 1 прокрут за 3 рефераллов!');
    } else {
        console.log('❌ ТЕСТ НЕ ПРОЙДЕН: прокрут не начислен.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
