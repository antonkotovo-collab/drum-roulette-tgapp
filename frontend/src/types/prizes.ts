// Типы призов для фронтенда (должны совпадать с бэкендом)

export interface Prize {
    id: string;
    name: string;
    weight: number;
    icon: string;
}

// Полный список призов — 8 секторов (чётные индексы колеса)
export const PRIZES: Prize[] = [
    { id: 'iphone17', name: 'iPhone 17 Pro Max 256gb', weight: 1, icon: '📱' },
    { id: 'zolotoe_yabloko', name: 'Купон Золотое Яблоко 5000₽', weight: 8, icon: '🍎' },
    { id: 'ozon', name: 'Купон Ozon 5000₽', weight: 8, icon: '🛒' },
    { id: 'uber', name: 'Купон Uber 10 поездок', weight: 10, icon: '🚗' },
    { id: 'yandex', name: 'Купон Яндекс сервисы 5000₽', weight: 8, icon: '🎵' },
    { id: 'wildberries', name: 'Купон Wildberries 5000₽', weight: 8, icon: '🛍️' },
    { id: 'extra_spin_1', name: '+1 Дополнительный прокрут', weight: 15, icon: '🎰' },
    { id: 'extra_spin_2', name: '+2 Дополнительных прокрута', weight: 12, icon: '🎲' },
];

// Индекс сектора-медведя (занимает один из "nothing" слотов — индекс 1)
export const BEAR_SECTOR_INDEX = 1;

// Сектора с "ничего не выиграл" — все нечётные, КРОМЕ BEAR_SECTOR_INDEX
export const NOTHING_SECTOR_INDICES: number[] = [3, 5, 7, 9, 11, 13, 15];

// Заглушка для пустого сектора
export const NOTHING_PRIZE: Prize = { id: 'nothing', name: 'Не повезло', weight: 0, icon: '😔' };

// Метаданные медведя (для ссылок из других частей приложения)
export const BEAR_PRIZE: Prize = {
    id: 'telegram_bear',
    name: 'Telegram подарок 🐻',
    weight: 0,
    icon: '🐻',
};

// Ответ от API /spin
export interface SpinResponse {
    success: boolean;
    spinNumber: number;
    result: string;
    prizeId: string | null;
    prize: Prize | null;
    spinsLeft: number;
    isWin: boolean;
}

// Ответ от API /user
export interface UserResponse {
    id: number;
    telegramId: string;
    username?: string;
    firstName?: string;
    freeSpinsCount: number;
    spinsUsed: number;
    spinsLeft: number;
    hasSpinsLeft: boolean;
    nextBonusMs: number;  // мс до следующего ежедневного бонуса (0 — уже можно получить)
}

// Тип модального окна
export type ModalType = 'prize' | 'lose' | null;

// Выигранный приз пользователя (ответ от /api/user/prizes)
export interface UserPrize {
    id: number;
    prizeId: string | null;
    prizeName: string;
    prizeIcon: string;
    result: string;
    wonAt: string; // ISO date string
}

export interface UserPrizesResponse {
    prizes: UserPrize[];
}

