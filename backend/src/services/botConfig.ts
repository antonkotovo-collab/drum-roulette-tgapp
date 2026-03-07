import { prisma } from '../lib/prisma';

// ────────────────────────────────────────────────────────────────────────────
// Defaults (used when DB has no row yet)
// ────────────────────────────────────────────────────────────────────────────

export const DEFAULT_WELCOME_TEXT = [
    '🥁 <b>Привет, {{name}}!</b>',
    '',
    'Добро пожаловать в <b>Мартовскую Лихорадку</b> — барабанную рулетку с реальными призами!',
    '',
    '🎁 <b>Что тебя ждёт:</b>',
    '• Крути барабан и выигрывай купоны на 5000₽',
    '• Приглашай друзей — получай бесплатные прокруты',
    '• Ежедневные бонусы и подарки',
    '',
    '👇 Нажми кнопку ниже и начни крутить прямо сейчас!',
].join('\n');

// ────────────────────────────────────────────────────────────────────────────
// Simple in-memory cache (60 s TTL)
// ────────────────────────────────────────────────────────────────────────────

let _cache: { text: string; mediaId: string; mediaType: string } | null = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 60_000;

export async function getWelcomeConfig() {
    const now = Date.now();
    if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache;

    const rows = await (prisma as any).botConfig.findMany({
        where: { key: { in: ['welcome_text', 'welcome_media_id', 'welcome_media_type'] } },
    });

    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    _cache = {
        text: map['welcome_text'] ?? DEFAULT_WELCOME_TEXT,
        mediaId: map['welcome_media_id'] ?? '',
        mediaType: map['welcome_media_type'] ?? '',
    };
    _cacheAt = now;
    return _cache;
}

export function invalidateCache() {
    _cache = null;
}

// ────────────────────────────────────────────────────────────────────────────
// Updaters
// ────────────────────────────────────────────────────────────────────────────

async function upsert(key: string, value: string) {
    await (prisma as any).botConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
    invalidateCache();
}

export async function updateWelcomeText(text: string) {
    await upsert('welcome_text', text);
}

export async function updateWelcomeMedia(fileId: string, type: 'photo' | 'video') {
    await upsert('welcome_media_id', fileId);
    await upsert('welcome_media_type', type);
}

export async function clearWelcomeMedia() {
    await upsert('welcome_media_id', '');
    await upsert('welcome_media_type', '');
}
