import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { loadBroadcasts, upsertBroadcast, BroadcastRecord, BroadcastButton } from '../lib/broadcastStore';

export type BroadcastMediaType = 'photo' | 'video' | 'document';

export interface BroadcastOptions {
    text: string;
    mediaUrl?: string;
    mediaType?: BroadcastMediaType;
    buttons?: BroadcastButton[];
}

const COUPON_IDS = ['zolotoe_yabloko', 'ozon', 'uber', 'yandex', 'wildberries'];
const SCENARIO_LENGTHS = [6, 7, 9, 7, 7, 7, 9, 10];
const BOT_TOKEN = () => process.env.BOT_TOKEN || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// "Today" in MSK (UTC+3) = midnight in Moscow timezone
// Works correctly regardless of server timezone
function todayMsk(): Date {
    const now = new Date();
    // Midnight UTC+3 = shift back 3h from local UTC midnight
    const mskOffset = 3 * 60 * 60 * 1000; // 3 hours in ms
    const utcMs = now.getTime();
    // Current MSK date as YYYY-MM-DD
    const mskMs = utcMs + mskOffset;
    const mskDate = new Date(mskMs);
    const midnightMsk = new Date(Date.UTC(mskDate.getUTCFullYear(), mskDate.getUTCMonth(), mskDate.getUTCDate()));
    // Convert MSK midnight back to UTC
    return new Date(midnightMsk.getTime() - mskOffset);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats() {
    const today = todayMsk();
    const [totalUsers, totalSpins, couponsWon, activeToday] = await Promise.all([
        prisma.user.count(),
        prisma.spinResult.count(),
        prisma.spinResult.count({ where: { prizeId: { in: COUPON_IDS } } }),
        prisma.user.count({ where: { updatedAt: { gte: today } } }),
    ]);
    return { totalUsers, totalSpins, couponsWon, activeToday };
}

// ─── Activity (7 days) ────────────────────────────────────────────────────────

export async function getActivity() {
    const result: { date: string; spins: number; users: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const base = todayMsk();
        base.setUTCDate(base.getUTCDate() - i);
        const from = base;
        const to = new Date(from.getTime() + 86400000);
        const [spins, users] = await Promise.all([
            prisma.spinResult.count({ where: { createdAt: { gte: from, lt: to } } }),
            prisma.user.count({ where: { createdAt: { gte: from, lt: to } } }),
        ]);
        result.push({ date: from.toISOString().slice(0, 10), spins, users });
    }
    return result;
}

// ─── Scenario stats ───────────────────────────────────────────────────────────

export async function getScenarioStats() {
    const users = await prisma.user.findMany({ select: { id: true, spinsUsed: true } });
    const stats = Array.from({ length: 8 }, (_, i) => ({
        scenario: i + 1, total: 0, completedCoupon: 0, maxStep: SCENARIO_LENGTHS[i],
    }));
    users.forEach(u => {
        const idx = (u.id - 1) % 8;
        stats[idx].total++;
        if (u.spinsUsed >= SCENARIO_LENGTHS[idx]) stats[idx].completedCoupon++;
    });
    return stats;
}

// ─── Daily Stats (today in MSK) ───────────────────────────────────────────────

export async function getDailyStats(date?: string) {
    const today = todayMsk();
    let from = today;
    if (date === 'yesterday') from = new Date(today.getTime() - 86400000);
    const to = new Date(from.getTime() + 86400000);
    const [newUsersToday, spinsToday, scenarioCompletedToday, payClicksToday] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: from, lt: to } } }),
        prisma.spinResult.count({ where: { createdAt: { gte: from, lt: to } } }),
        prisma.spinResult.count({ where: { prizeId: { in: COUPON_IDS }, createdAt: { gte: from, lt: to } } }),
        prisma.trackingEvent.count({ where: { event: 'pay_click', createdAt: { gte: from, lt: to } } }),
    ]);
    return { newUsersToday, spinsToday, scenarioCompletedToday, payClicksToday };
}

// ─── Hourly Activity (today in MSK, 24h) — 2 SQL queries total ───────────────

export async function getHourlyActivity(date?: string) {
    const today = todayMsk();
    let todayStart = today;
    if (date === 'yesterday') todayStart = new Date(today.getTime() - 86400000);
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    // Run 2 parallel GROUP BY queries instead of N×2 sequential queries
    const [spinsRaw, usersRaw] = await Promise.all([
        prisma.$queryRaw<{ hour: number; cnt: bigint }[]>`
            SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' + INTERVAL '3 hours'))::int AS hour,
                   COUNT(*)::bigint AS cnt
            FROM spin_results
            WHERE created_at >= ${todayStart} AND created_at < ${todayEnd}
            GROUP BY hour
        `,
        prisma.$queryRaw<{ hour: number; cnt: bigint }[]>`
            SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' + INTERVAL '3 hours'))::int AS hour,
                   COUNT(*)::bigint AS cnt
            FROM users
            WHERE created_at >= ${todayStart} AND created_at < ${todayEnd}
            GROUP BY hour
        `,
    ]);

    const spinsMap: Record<number, number> = {};
    for (const r of spinsRaw) spinsMap[r.hour] = Number(r.cnt);
    const usersMap: Record<number, number> = {};
    for (const r of usersRaw) usersMap[r.hour] = Number(r.cnt);

    return Array.from({ length: 24 }, (_, h) => ({ hour: h, spins: spinsMap[h] || 0, users: usersMap[h] || 0 }));
}

// ─── Users list ───────────────────────────────────────────────────────────────

export async function getUsers(opts: {
    page: number; limit: number; search: string; scenario: number | null; coupon: string | undefined;
}) {
    const { page, limit, search, scenario, coupon } = opts;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { telegramId: { contains: search } },
        ];
    }

    const allUsers = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { spinResults: true } },
            spinResults: {
                where: { prizeId: { in: COUPON_IDS } },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { prizeId: true, createdAt: true },
            },
        },
    });

    let filtered = allUsers.map(u => {
        const idx = (u.id - 1) % 8;
        return {
            u, scenarioNum: idx + 1, stepMax: SCENARIO_LENGTHS[idx],
            couponWon: u.spinResults[0]?.prizeId ?? null,
        };
    });

    if (scenario !== null) filtered = filtered.filter(x => x.scenarioNum === scenario);
    if (coupon === 'yes') filtered = filtered.filter(x => x.couponWon);
    if (coupon === 'no') filtered = filtered.filter(x => !x.couponWon);

    const totalFiltered = filtered.length;
    const rows = filtered.slice(skip, skip + limit).map(({ u, scenarioNum, stepMax, couponWon }) => ({
        id: u.id, telegramId: u.telegramId,
        name: [u.firstName, u.username ? `@${u.username}` : null].filter(Boolean).join(' '),
        spinsLeft: u.freeSpinsCount, spinsUsed: u.spinsUsed,
        scenario: scenarioNum, scenarioStep: Math.min(u.spinsUsed, stepMax), scenarioMax: stepMax,
        totalSpins: u._count.spinResults,
        couponWon, couponWonAt: u.spinResults[0]?.createdAt ?? null,
        createdAt: u.createdAt,
    }));

    return { users: rows, total: totalFiltered, page, pages: Math.ceil(totalFiltered / limit) };
}

// ─── User detail ──────────────────────────────────────────────────────────────

export async function getUserDetail(telegramId: string) {
    return prisma.user.findUnique({
        where: { telegramId },
        include: { spinResults: { orderBy: { spinNumber: 'asc' }, take: 50 } },
    });
}

// ─── Prizes ───────────────────────────────────────────────────────────────────

export async function getPrizes(filter: string) {
    const where: any = { result: { not: 'nothing' } };
    if (filter && filter !== 'all') where.prizeId = filter;
    const results = await prisma.spinResult.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 100,
        include: { user: { select: { firstName: true, username: true, telegramId: true } } },
    });
    return results.map(r => ({
        id: r.id, prizeId: r.prizeId, result: r.result, wonAt: r.createdAt,
        userName: [r.user.firstName, r.user.username ? `@${r.user.username}` : null].filter(Boolean).join(' ') || r.user.telegramId,
        telegramId: r.user.telegramId,
    }));
}

// ─── Spin management ─────────────────────────────────────────────────────────

export async function addSpins(telegramId: string, count: number) {
    return prisma.user.update({
        where: { telegramId },
        data: { freeSpinsCount: { increment: count } },
    });
}

export async function resetUserSpins(telegramId: string) {
    return prisma.user.update({
        where: { telegramId },
        data: { spinsUsed: 0, freeSpinsCount: 4 },
    });
}

export async function resetAllSpins() {
    return prisma.user.updateMany({ data: { spinsUsed: 0, freeSpinsCount: 4 } });
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

function buildTelegramPayload(chatId: string, opts: BroadcastOptions): Record<string, unknown> {
    const replyMarkup = opts.buttons?.length
        ? { inline_keyboard: opts.buttons.map(b => [{ text: b.text, url: b.url }]) }
        : undefined;

    if (opts.mediaUrl && opts.mediaType) {
        const fieldMap: Record<string, string> = { photo: 'photo', video: 'video', document: 'document' };
        return {
            chat_id: chatId,
            [fieldMap[opts.mediaType]]: opts.mediaUrl,
            caption: opts.text,
            parse_mode: 'HTML',
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        };
    }
    return {
        chat_id: chatId,
        text: opts.text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    };
}

function telegramMethod(opts: BroadcastOptions): string {
    if (!opts.mediaUrl || !opts.mediaType) return 'sendMessage';
    const map: Record<string, string> = { photo: 'sendPhoto', video: 'sendVideo', document: 'sendDocument' };
    return map[opts.mediaType] ?? 'sendMessage';
}

export async function startBroadcast(opts: BroadcastOptions): Promise<BroadcastRecord> {
    const users = await prisma.user.findMany({ select: { telegramId: true } });
    const id = Date.now().toString();
    const record: BroadcastRecord = {
        id,
        text: opts.text.slice(0, 200) + (opts.text.length > 200 ? '…' : ''),
        mediaUrl: opts.mediaUrl,
        mediaType: opts.mediaType,
        buttons: opts.buttons,
        createdAt: new Date().toISOString(),
        total: users.length, sent: 0, failed: 0, status: 'running',
    };
    upsertBroadcast(record);
    runBroadcast(record, users.map(u => u.telegramId), opts);
    return record;
}

async function runBroadcast(record: BroadcastRecord, ids: string[], opts: BroadcastOptions) {
    let sent = 0, failed = 0;
    const token = BOT_TOKEN();
    const method = telegramMethod(opts);
    const BATCH = 25, DELAY = 1100;
    for (let i = 0; i < ids.length; i += BATCH) {
        await Promise.all(ids.slice(i, i + BATCH).map(async chatId => {
            try {
                const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildTelegramPayload(chatId, opts)),
                });
                const d = await r.json() as { ok: boolean };
                if (d.ok) sent++; else failed++;
            } catch { failed++; }
        }));
        upsertBroadcast({ ...record, sent, failed });
        if (i + BATCH < ids.length) await new Promise(r => setTimeout(r, DELAY));
    }
    upsertBroadcast({ ...record, sent, failed, status: 'done' });
    logger.info({ sent, failed, method }, '[Admin] Broadcast done');
}

export { loadBroadcasts };

// ─── Tracking ─────────────────────────────────────────────────────────────────

export async function getTrackingStats() {
    const [links, users, events] = await Promise.all([
        prisma.trackingLink.findMany({ orderBy: { createdAt: 'desc' } }),
        // Старты: users сгруппированные по source
        prisma.user.groupBy({ by: ['source'], _count: { _all: true } }),
        // Конверсии: события сгруппированные по source+event
        prisma.trackingEvent.groupBy({ by: ['source', 'event'], _count: { _all: true } }),
    ]);

    // Также собираем "завершили сценарий" — это users у которых есть выигранный купон
    const completedRaw = await prisma.user.findMany({
        where: { source: { not: null }, spinResults: { some: { prizeId: { in: COUPON_IDS } } } },
        select: { source: true },
    });
    const completedBySource: Record<string, number> = {};
    for (const u of completedRaw) {
        if (u.source) completedBySource[u.source] = (completedBySource[u.source] || 0) + 1;
    }

    const startsBySource: Record<string, number> = {};
    for (const g of users) {
        if (g.source) startsBySource[g.source] = g._count._all;
    }

    const payClicksBySource: Record<string, number> = {};
    for (const e of events) {
        if (e.event === 'pay_click' && e.source) {
            payClicksBySource[e.source] = e._count._all;
        }
    }

    // Собираем «unknown» источников (пришли без ссылки, но нажали кнопку)
    const allSources = new Set([
        ...links.map(l => l.slug),
        ...Object.keys(startsBySource),
        ...Object.keys(completedBySource),
        ...Object.keys(payClicksBySource),
    ]);

    return Array.from(allSources).map(slug => {
        const link = links.find(l => l.slug === slug);
        return {
            slug,
            name: link?.name || slug,
            isCustom: !!link,
            starts: startsBySource[slug] || 0,
            completed: completedBySource[slug] || 0,
            payClicks: payClicksBySource[slug] || 0,
            createdAt: link?.createdAt || null,
        };
    }).sort((a, b) => b.starts - a.starts);
}

export async function createTrackingLink(slug: string, name: string) {
    return prisma.trackingLink.upsert({
        where: { slug },
        update: { name },
        create: { slug, name },
    });
}

export async function deleteTrackingLink(slug: string) {
    return prisma.trackingLink.delete({ where: { slug } });
}

