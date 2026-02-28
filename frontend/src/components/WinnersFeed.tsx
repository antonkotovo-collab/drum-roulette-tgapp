import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

// ── Пул данных ──────────────────────────────────────────────────────────────

const FAKE_NAMES = [
    'Оля 🤍🖤', 'Олеся', '😎', '🖤', 'Крискис',
    '𝖒𝖊𝖔𝖜♱ #акси ⊹ֶָ֢', 'Ирина В', "𝐦𝐚 𝐥'𝐚𝐦𝐨𝐫𝐞 𝐧𝐨", 'Anasteisha', 'Яся',
    '𝕥𝕙𝕖 𝕕𝕣𝕒𝕞𝕒 𝕕𝕖𝕒𝕝𝕖𝕣™', 'Stasia', 'Лика', 'Aleksandr Artemov', 'Анастасия',
    'Екатерина Барулева', 'Toma', 'Евгения Машкова❤', 'Рассвет', 'Мария',
    'UlU', 'ирина🌸', 'Manager Bifatima', 'Karhain', 'Анна',
    '†Пэк ынт†', '...', 'Asylai', 'Veronica', 'Элио.',
    '— mrt.·', 'Elminka', 'Ирина', 'шишка', 'bella',
    'heartbeat', 'бубульгумщица', '♡', 'Aya', 'Jenn',
    'Амина', '#MEOW^^', 'Саша', 'Ayana', '#11:11',
    'Геля', 'мeow', 'Zhenya.·', "'rtt", 'Акжүніс',
    'Juliana', 'ssikuaya', 'николь', 'Apy', 'nuts',
    '101', 'Карина Гобозова', 'Lilith', 'maria', 'Ш-общительная',
    'A', '♀', 'Dariiа', 'Аня', 'Камилла Берлібек',
    'МЗТТЬЮ РЕЙНОР', '~АИ', 'mnastilii', 'Aiko', 'Debbie Flagge',
    'Genesis Hanna', 'KIROXXX', 'şavayka ♡', 'Viktoria ✧', 'Martusya',
    'Юлия Волкова', 'sasa', 'nvrzhigit', 'Любимая', 'в сети',
    'Анастасия Степина', 'MRRmisKitto', 'v', 'William Afton ♡', 'Alexa',
    'Zxwgll', 'qwerty', 'Fayya', 'sklawsh', 'DarkRose',
    'ВарварPiDiddyМальчикфутболистКудряш...', 'Mila', '~popkaarangutanga~', 'Lisa<3', 'саяш',
    'campus02', 'Sumaya', 'Позывной "Апостол"', 'Александра', 'Алексей',
    'Настасья', 'a.vogue', 'Игорь', 'špv',
];

// Fisher-Yates перемешивание — хаотичный порядок при каждом заходе
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Перемешиваем при каждой загрузке модуля (= при каждом заходе в приложение)
const SHUFFLED_NAMES = shuffle(FAKE_NAMES);

const PRIZES = [
    { id: 'zolotoe_yabloko', name: 'Золотое Яблоко 5000₽', icon: '🍎', color: '#84cc16' },
    { id: 'ozon', name: 'Ozon 5000₽', icon: '🛒', color: '#3b82f6' },
    { id: 'uber', name: 'Uber 10 поездок', icon: '🚗', color: '#94a3b8' },
    { id: 'yandex', name: 'Яндекс 5000₽', icon: '🎵', color: '#eab308' },
    { id: 'wildberries', name: 'Wildberries 5000₽', icon: '🛍️', color: '#a855f7' },
    { id: 'telegram_bear', name: 'Telegram Медведь', icon: '🐻', color: '#2AABEE' },
    { id: 'extra_spin_1', name: '+1 прокрут', icon: '🎰', color: '#ef4444' },
    { id: 'extra_spin_2', name: '+2 прокрута', icon: '🎲', color: '#f97316' },
];

const AVATAR_COLORS = [
    '#9333ea', '#db2777', '#2563eb', '#059669',
    '#d97706', '#6366f1', '#0891b2', '#16a34a',
];

function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pickRandom<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

let _uid = 1;
let _nameIdx = 0; // глобальный счётчик для циклического обхода ников

function makeWinner() {
    const name = SHUFFLED_NAMES[_nameIdx % SHUFFLED_NAMES.length];
    _nameIdx++;
    const prize = pickRandom(PRIZES);
    return {
        uid: _uid++,
        name,
        prize,
        avatarColor: AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length],
    };
}

type Winner = ReturnType<typeof makeWinner>;

// Начальные победители (4 штуки)
const INITIAL: Winner[] = Array.from({ length: 4 }, () => makeWinner());

// Максимум видимых карточек
const MAX_VISIBLE = 12;

// ── Компонент ────────────────────────────────────────────────────────────────

const WinnersFeed: React.FC = () => {
    const [winners, setWinners] = useState<Winner[]>(INITIAL);
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const addWinnerRef = useRef<() => void>();

    // Отслеживаем результат последнего спина, чтобы добавить реального победителя
    const { lastResult, firstName } = useGameStore();
    const prevResultRef = useRef(lastResult);

    addWinnerRef.current = () => {
        setWinners(prev => {
            const next = [makeWinner(), ...prev];
            return next.slice(0, MAX_VISIBLE);
        });
        timer.current = setTimeout(() => addWinnerRef.current?.(), randInt(6_000, 10_000));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const addWinner = useCallback(() => addWinnerRef.current?.(), []);

    useEffect(() => {
        timer.current = setTimeout(addWinner, randInt(1_500, 3_000));
        return () => clearTimeout(timer.current);
    }, [addWinner]);

    // При новом выигрыше — добавляем РЕАЛЬНОГО победителя в ленту
    useEffect(() => {
        if (!lastResult || lastResult === prevResultRef.current) return;
        prevResultRef.current = lastResult;
        if (!lastResult.isWin || !lastResult.prizeId) return;

        const prizeEntry = PRIZES.find(p => p.id === lastResult.prizeId);
        if (!prizeEntry) return;

        const realName = firstName || 'Вы';
        const realWinner: Winner = {
            uid: _uid++,
            name: realName,
            prize: prizeEntry,
            avatarColor: AVATAR_COLORS[realName.charCodeAt(0) % AVATAR_COLORS.length],
        };
        setWinners(prev => [realWinner, ...prev].slice(0, MAX_VISIBLE));
    }, [lastResult, firstName]);

    return (
        <div style={{ width: '100%', marginBottom: '6px' }}>
            {/* Заголовок */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '6px', padding: '0 12px',
            }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.3))' }} />
                <span
                    style={{
                        fontSize: '9px', fontWeight: 800, letterSpacing: '3px',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                        background: 'linear-gradient(90deg, #c084fc, #f0abfc, #c084fc)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        animation: 'pulse-opacity-text 2.5s ease-in-out infinite',
                    }}
                >🏆 Победители</span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(192,132,252,0.3), transparent)' }} />
            </div>

            {/* Лента */}
            <div style={{
                position: 'relative',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(192,132,252,0.18)',
                padding: '8px 10px',
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            } as React.CSSProperties}>

                <AnimatePresence initial={false}>
                    {winners.map((w, idx) => {
                        const isNewest = idx === 0;
                        return (
                            <motion.div
                                key={w.uid}
                                initial={{ x: -80, opacity: 0, scale: 0.85 }}
                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                transition={{
                                    x: { duration: 0.35, ease: 'easeOut' },
                                    opacity: { duration: 0.25 },
                                    scale: { duration: 0.25 },
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    flexShrink: 0,
                                    padding: '4px 10px 4px 6px',
                                    borderRadius: '20px',
                                    background: isNewest
                                        ? 'rgba(192,132,252,0.18)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: isNewest
                                        ? '1px solid rgba(192,132,252,0.45)'
                                        : '1px solid rgba(255,255,255,0.06)',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            >
                                {/* Аватар */}
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: w.avatarColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 800, color: 'white',
                                    flexShrink: 0,
                                }}>
                                    {w.name.charAt(0)}
                                </div>

                                {/* Имя */}
                                <span style={{
                                    fontSize: '12px', fontWeight: 600,
                                    color: 'rgba(220,200,255,0.9)',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '90px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {w.name}
                                </span>

                                {/* Приз */}
                                <span style={{ fontSize: '13px' }}>{w.prize.icon}</span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    color: w.prize.color,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {w.prize.name}
                                </span>

                                {/* Только что */}
                                {isNewest && (
                                    <span
                                        style={{
                                            fontSize: '9px', color: '#c084fc',
                                            fontWeight: 700, whiteSpace: 'nowrap',
                                        }}
                                    >✨</span>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WinnersFeed;
