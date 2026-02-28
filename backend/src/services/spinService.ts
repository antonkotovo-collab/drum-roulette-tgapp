// ─── Пайплайн спинов ────────────────────────────────────────────────────────
//
//  Спин  1 → ничего
//  Спин  2 → +2 прокрута
//  Спин  3 → ничего
//  Спин  4 → Telegram подарок 🐻 (с реальной выдачей через Bot API)
//  Спин  5 → +1 прокрут
//  Спин  6+ → случайный подарочный сертификат

export interface Prize {
    id: string;
    name: string;
    weight: number;
    icon: string;
}

// Пул сертификатов для спина 6+
const CERTIFICATE_PRIZES: Prize[] = [
    { id: 'zolotoe_yabloko', name: 'Купон Золотое Яблоко 5000₽', weight: 25, icon: '🍎' },
    { id: 'ozon',            name: 'Купон Ozon 5000₽',            weight: 25, icon: '🛒' },
    { id: 'uber',            name: 'Купон Uber 10 поездок',       weight: 25, icon: '🚗' },
    { id: 'yandex',          name: 'Купон Яндекс сервисы 5000₽', weight: 25, icon: '🎵' },
    { id: 'wildberries',     name: 'Купон Wildberries 5000₽',     weight: 25, icon: '🛍️' },
];

// Telegram Bear prize metadata
export const TELEGRAM_BEAR: Prize = {
    id: 'telegram_bear',
    name: 'Telegram подарок 🐻 Медведь',
    weight: 0,
    icon: '🐻',
};

/**
 * Взвешенный случайный выбор приза.
 */
export function weightedRandom(prizes: Prize[]): Prize {
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
        r -= p.weight;
        if (r <= 0) return p;
    }
    return prizes[prizes.length - 1];
}

/**
 * Основной пайплайн.
 */
export function getSpinResult(spinNumber: number): {
    result: string;
    prizeId: string | null;
    prize: Prize | null;
} {
    console.log(`[Pipeline] spinNumber=${spinNumber}`);
    switch (spinNumber) {
        case 1: // ничего
            return { result: 'nothing', prizeId: null, prize: null };

        case 2: // +2 прокрута
            return {
                result: '+2 Дополнительных прокрута',
                prizeId: 'extra_spin_2',
                prize: { id: 'extra_spin_2', name: '+2 Дополнительных прокрута', weight: 0, icon: '🎲' },
            };

        case 3: // ничего
            return { result: 'nothing', prizeId: null, prize: null };

        case 4: // Telegram подарок 🐻
            return {
                result: TELEGRAM_BEAR.name,
                prizeId: TELEGRAM_BEAR.id,
                prize: TELEGRAM_BEAR,
            };

        case 5: // +1 прокрут
            return {
                result: '+1 Дополнительный прокрут',
                prizeId: 'extra_spin_1',
                prize: { id: 'extra_spin_1', name: '+1 Дополнительный прокрут', weight: 0, icon: '🎰' },
            };

        default: // 6+ → случайный сертификат
            const prize = weightedRandom(CERTIFICATE_PRIZES);
            return { result: prize.name, prizeId: prize.id, prize };
    }
}
