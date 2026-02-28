import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// Расширяем тип Request для хранения данных Telegram-пользователя
export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface AuthenticatedRequest extends Request {
    telegramUser?: TelegramUser;
    initData?: string;
}

/**
 * Валидирует initData от Telegram WebApp по алгоритму HMAC-SHA256.
 * Документация: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string, botToken: string): boolean {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        if (!hash) return false;

        // Убираем hash из параметров для проверки
        params.delete('hash');

        // Сортируем параметры по ключу и формируем строку для проверки
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // HMAC-SHA256 ключ создаётся из токена бота с секретом "WebAppData"
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Финальный HMAC-SHA256 от строки данных
        const expectedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return expectedHash === hash;
    } catch {
        return false;
    }
}

/**
 * Middleware для защиты роутов: проверяет initData и извлекает пользователя.
 * В режиме разработки (DEV_MODE=true) пропускает проверку для тестирования.
 */
export function telegramAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const initData = req.body?.initData || req.query?.initData as string;

    // Режим разработки: пропускаем валидацию, используем тестового пользователя
    if (process.env.DEV_MODE === 'true') {
        req.telegramUser = {
            id: 123456789,
            first_name: 'Test',
            username: 'testuser',
        };
        req.initData = 'dev_mode';
        next();
        return;
    }

    if (!initData) {
        res.status(401).json({ error: 'initData is required' });
        return;
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        res.status(500).json({ error: 'Bot token not configured' });
        return;
    }

    // Валидируем подпись
    if (!validateTelegramInitData(initData, botToken)) {
        res.status(403).json({ error: 'Invalid initData signature' });
        return;
    }

    try {
        // Парсим данные пользователя из initData
        const params = new URLSearchParams(initData);
        const userJsonStr = params.get('user');
        if (!userJsonStr) {
            res.status(401).json({ error: 'No user data in initData' });
            return;
        }

        const telegramUser: TelegramUser = JSON.parse(userJsonStr);
        req.telegramUser = telegramUser;
        req.initData = initData;
        next();
    } catch {
        res.status(400).json({ error: 'Failed to parse user data' });
    }
}
