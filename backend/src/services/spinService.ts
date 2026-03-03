// ─── Spin Service: Scripted Scenarios + Post-Scenario Random ────────────────
//
//  Каждый новый пользователь получает один из 8 сценариев (userId % 8).
//  Сценарий проигрывается по шагам (spinNumber = 1, 2, 3...).
//  После завершения сценария — случайный режим с заданными вероятностями.

export interface Prize {
    id: string;
    name: string;
    weight: number;
    icon: string;
}

// ─── Константы призов ────────────────────────────────────────────────────────

export const NOTHING = { result: 'nothing', prizeId: null, prize: null } as const;

export const EXTRA_1: Prize = { id: 'extra_spin_1', name: '+1 Дополнительный прокрут', weight: 0, icon: '🎰' };
export const EXTRA_2: Prize = { id: 'extra_spin_2', name: '+2 Дополнительных прокрута', weight: 0, icon: '🎲' };
export const TELEGRAM_BEAR: Prize = { id: 'telegram_bear', name: 'Telegram подарок 🐻 Медведь', weight: 0, icon: '🐻' };

// Пул купонов для случайного выбора
const COUPON_PRIZES: Prize[] = [
    { id: 'zolotoe_yabloko', name: 'Купон Золотое Яблоко 5000₽', weight: 20, icon: '🍎' },
    { id: 'ozon', name: 'Купон Ozon 5000₽', weight: 20, icon: '🛒' },
    { id: 'uber', name: 'Купон Uber 10 поездок', weight: 20, icon: '🚗' },
    { id: 'yandex', name: 'Купон Яндекс сервисы 5000₽', weight: 20, icon: '🎵' },
    { id: 'wildberries', name: 'Купон Wildberries 5000₽', weight: 20, icon: '🛍️' },
];

// Тип шага сценария
type Step =
    | 'nothing'
    | 'extra_1'
    | 'extra_2'
    | 'bear'
    | 'coupon'; // случайный купон из пула

// ─── 8 сценариев ─────────────────────────────────────────────────────────────
// Каждый элемент — шаг с 1-го спина

const SCENARIOS: Step[][] = [
    // Сценарий 1 (6 ходов, купон последний)
    ['nothing', 'extra_2', 'nothing', 'bear', 'nothing', 'coupon'],

    // Сценарий 2 (7 ходов, купон предпоследний)
    ['nothing', 'extra_1', 'nothing', 'bear', 'extra_2', 'coupon', 'nothing'],

    // Сценарий 3 (8 ходов, длинная интрига)
    ['extra_2', 'nothing', 'nothing', 'extra_1', 'nothing', 'bear', 'extra_2', 'coupon'],

    // Сценарий 4 (жёсткий, купон последний)
    ['nothing', 'nothing', 'extra_2', 'nothing', 'nothing', 'extra_1', 'coupon'],

    // Сценарий 5 (динамичный)
    ['extra_1', 'nothing', 'extra_2', 'nothing', 'bear', 'nothing', 'coupon'],

    // Сценарий 6 (купон предпоследний, мягкий разгон)
    ['nothing', 'extra_2', 'nothing', 'extra_1', 'nothing', 'coupon', 'nothing'],

    // Сценарий 7 (9 ходов, купон последний)
    ['extra_2', 'nothing', 'nothing', 'extra_1', 'nothing', 'bear', 'extra_2', 'nothing', 'coupon'],

    // Сценарий 8 (10 ходов, купон предпоследний)
    ['nothing', 'extra_2', 'nothing', 'extra_1', 'nothing', 'nothing', 'extra_2', 'bear', 'coupon', 'nothing'],
];

// ─── Случайный режим (после сценария) ─────────────────────────────────────────
//  Ничего:   57%  (570 весов)
//  +1 спин:  15%  (150)
//  +2 спина: 10%  (100)
//  Медведь:   9%  (90)
//  Купон:     9%  (90)  ← из равномерного пула 5 купонов
//  Итого:   100% (1000)

const RANDOM_POOL = [
    ...Array(570).fill('nothing' as Step),
    ...Array(150).fill('extra_1' as Step),
    ...Array(100).fill('extra_2' as Step),
    ...Array(90).fill('bear' as Step),
    ...Array(90).fill('coupon' as Step),
];

// ─── Утилиты ─────────────────────────────────────────────────────────────────

export function weightedRandom(prizes: Prize[]): Prize {
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
        r -= p.weight;
        if (r <= 0) return p;
    }
    return prizes[prizes.length - 1];
}

function randomCoupon(): Prize {
    return COUPON_PRIZES[Math.floor(Math.random() * COUPON_PRIZES.length)];
}

function stepToResult(step: Step): { result: string; prizeId: string | null; prize: Prize | null } {
    switch (step) {
        case 'nothing': return { result: 'nothing', prizeId: null, prize: null };
        case 'extra_1': return { result: EXTRA_1.name, prizeId: EXTRA_1.id, prize: EXTRA_1 };
        case 'extra_2': return { result: EXTRA_2.name, prizeId: EXTRA_2.id, prize: EXTRA_2 };
        case 'bear': return { result: TELEGRAM_BEAR.name, prizeId: TELEGRAM_BEAR.id, prize: TELEGRAM_BEAR };
        case 'coupon': {
            const c = randomCoupon();
            return { result: c.name, prizeId: c.id, prize: c };
        }
    }
}

// ─── Основная функция ─────────────────────────────────────────────────────────

/**
 * Возвращает результат спина.
 * @param userId    числовой id пользователя в БД (определяет сценарий)
 * @param spinNumber номер спина этого пользователя (1-based, из spinsUsed)
 */
export function getSpinResult(
    userId: number,
    spinNumber: number,
): { result: string; prizeId: string | null; prize: Prize | null } {
    const scenarioIdx = userId % SCENARIOS.length;         // детерминированный выбор сценария
    const scenario = SCENARIOS[scenarioIdx];
    const stepIdx = spinNumber - 1;                         // spinNumber начинается с 1

    console.log(`[Spin] user=${userId} scenario=${scenarioIdx} spinNumber=${spinNumber} scenarioLen=${scenario.length}`);

    if (stepIdx < scenario.length) {
        // ── Сценарный режим ──────────────────────────────────────────────────
        const step = scenario[stepIdx];
        return stepToResult(step);
    } else {
        // ── Случайный режим ──────────────────────────────────────────────────
        const step = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)] as Step;
        return stepToResult(step);
    }
}
