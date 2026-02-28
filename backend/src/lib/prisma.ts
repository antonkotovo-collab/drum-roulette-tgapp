import { PrismaClient } from '@prisma/client';

/**
 * Глобальный синглтон PrismaClient.
 * В режиме разработки хранится в globalThis чтобы Hot Reload не создавал новые соединения.
 */
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

export const prisma =
    globalThis.__prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

export default prisma;
