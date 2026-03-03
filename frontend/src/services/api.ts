import { SpinResponse, UserResponse, UserPrizesResponse, ReferralResponse } from '../types/prizes';

// Базовый URL бэкенда из переменных окружения
// В dev-режиме Vite прокси перенаправит /api → localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Выполняет спин барабана.
 * Отправляет initData на сервер, получает результат.
 */
export async function spinDrum(initData: string): Promise<SpinResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const response = await fetch(`${API_BASE}/api/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
            signal: controller.signal,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Сервер не ответил за 10 секунд');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Получает данные пользователя по initData.
 * Создаёт пользователя если он новый.
 */
export async function getUser(initData: string): Promise<UserResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const params = new URLSearchParams({ initData });
        const response = await fetch(`${API_BASE}/api/user?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Сервер не ответил за 10 секунд');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Получает список выигранных призов пользователя.
 */
export async function getUserPrizes(initData: string): Promise<UserPrizesResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const params = new URLSearchParams({ initData });
        const response = await fetch(`${API_BASE}/api/user/prizes?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Сервер не ответил за 10 секунд');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Получает реферальный код и статистику.
 */
export async function getReferral(initData: string): Promise<ReferralResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const params = new URLSearchParams({ initData });
        const response = await fetch(`${API_BASE}/api/user/referral?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Сервер не ответил за 10 секунд');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Привязывает пользователя к рефереру (однократно).
 */
export async function claimReferralCode(
    initData: string,
    referredByCode: string,
): Promise<{ ok: boolean; alreadyJoined: boolean }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const response = await fetch(`${API_BASE}/api/user/referral/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData, referredByCode }),
            signal: controller.signal,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Сервер не ответил за 10 секунд');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Проверяет подписку на канал и начисляет 1 прокрут.
 * Если не подписан — возвращает notSubscribed: true (без throw).
 */
export async function claimChannelBonus(
    initData: string,
): Promise<{ ok: boolean; alreadyClaimed?: boolean; notSubscribed?: boolean; spinsLeft?: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const response = await fetch(`${API_BASE}/api/user/channel-bonus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
            signal: controller.signal,
        });
        // 403 = не подписан — не бросаем, возвращаем объект
        if (response.status === 403) {
            return { ok: false, notSubscribed: true };
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Сервер не ответил за 10 секунд');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}
