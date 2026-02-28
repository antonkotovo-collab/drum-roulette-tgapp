// Скрипт сброса pipeline для всех пользователей (только для тестирования)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    
    for (const u of users) {
        console.log(`  ${u.firstName || u.username || u.telegramId}: spinsUsed=${u.spinsUsed}, freeSpins=${u.freeSpinsCount}`);
    }

    const updated = await prisma.user.updateMany({
        data: { spinsUsed: 0, freeSpinsCount: 3 },
    });
    
    console.log(`\n✅ Reset ${updated.count} users: spinsUsed→0, freeSpinsCount→3`);
    console.log('Pipeline теперь начнётся заново: 1=ничего, 2=+2спина, 3=ничего, 4=медведь, 5=+1спин, 6+=сертификат');
    
    await prisma.$disconnect();
}

reset().catch(console.error);
