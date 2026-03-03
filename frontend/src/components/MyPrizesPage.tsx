import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageType } from './BottomNav';
import type { UserPrize } from '../types/prizes';
import { getUserPrizes } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

interface MyPrizesPageProps {
    onNavigate: (page: PageType) => void;
}

const PRIZE_EXPIRE_MS = 30 * 60 * 1000; // 30 минут

// Призы, у которых есть таймер истечения (купоны)
const COUPON_PRIZE_IDS = ['zolotoe_yabloko', 'ozon', 'uber', 'yandex', 'wildberries'];

/**
 * Хук: возвращает оставшиеся мс до истечения prize (wonAt + 30 мин).
 * Обновляется каждую секунду пока не истечёт.
 */
function useCountdown(wonAt: string): number {
    const expiresAt = new Date(wonAt).getTime() + PRIZE_EXPIRE_MS;
    const calc = () => Math.max(0, expiresAt - Date.now());
    const [msLeft, setMsLeft] = useState(calc);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (calc() <= 0) return;
        ref.current = setInterval(() => {
            const left = calc();
            setMsLeft(left);
            if (left <= 0 && ref.current) clearInterval(ref.current);
        }, 1000);
        return () => { if (ref.current) clearInterval(ref.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wonAt]);

    return msLeft;
}

/** Форматирует мс → MM:SS */
function formatMs(ms: number): string {
    const totalSec = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const seconds = (totalSec % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

/** Компонент таймера для карточки купона */
const PrizeCountdown: React.FC<{ wonAt: string }> = ({ wonAt }) => {
    const msLeft = useCountdown(wonAt);
    const expired = msLeft <= 0;
    const urgent = msLeft < 5 * 60 * 1000; // < 5 минут — красный

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 8,
            background: expired
                ? 'rgba(100,100,120,0.25)'
                : urgent
                    ? 'rgba(239,68,68,0.18)'
                    : 'rgba(168,85,247,0.15)',
            border: expired
                ? '1px solid rgba(150,150,170,0.25)'
                : urgent
                    ? '1px solid rgba(239,68,68,0.35)'
                    : '1px solid rgba(168,85,247,0.3)',
            flexShrink: 0,
        }}>
            <span style={{ fontSize: 10 }}>{expired ? '⌛' : '⏱'}</span>
            <span style={{
                fontSize: 11,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                color: expired
                    ? 'rgba(180,175,200,0.5)'
                    : urgent
                        ? '#f87171'
                        : '#c084fc',
                letterSpacing: '0.02em',
            }}>
                {expired ? 'Истёк' : formatMs(msLeft)}
            </span>
        </div>
    );
};

/** Анимированная полоса убывания времени под карточкой купона */
const ExpireProgressBar: React.FC<{ wonAt: string; expired: boolean; accentColor: string }> = ({ wonAt, expired, accentColor }) => {
    const msLeft = useCountdown(wonAt);
    const pct = Math.max(0, (msLeft / PRIZE_EXPIRE_MS) * 100);

    return (
        <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'linear' }}
                style={{
                    height: '100%',
                    borderRadius: 99,
                    background: expired
                        ? 'rgba(120,110,150,0.3)'
                        : pct < 17
                            ? 'linear-gradient(90deg, #ef4444, #f87171)'
                            : `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
                    boxShadow: expired ? 'none' : `0 0 6px ${accentColor}66`,
                }}
            />
        </div>
    );
};

// Цвет бейджа по prizeId
const PRIZE_COLORS: Record<string, string> = {
    iphone17: '#f59e0b',
    zolotoe_yabloko: '#84cc16',
    ozon: '#3b82f6',
    uber: '#94a3b8',
    yandex: '#eab308',
    wildberries: '#a855f7',
    extra_spin_1: '#ef4444',
    extra_spin_2: '#f97316',
    telegram_bear: '#2AABEE',
};

function formatDate(iso: string): string {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}.${month} в ${hours}:${mins}`;
}

const MyPrizesPage: React.FC<MyPrizesPageProps> = ({ onNavigate }) => {
    const { initData, isReady } = useTelegram();
    const [prizes, setPrizes] = useState<UserPrize[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isReady) return;
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getUserPrizes(initData);
                if (!cancelled) setPrizes(data.prizes);
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Ошибка загрузки');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isReady, initData]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '50px 20px 110px',
                position: 'relative',
            }}
        >

            {/* ── Заголовок ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{ textAlign: 'center', marginBottom: '12px', zIndex: 1 }}
            >
                <span
                    style={{
                        fontSize: '40px', display: 'block', marginBottom: '8px',
                        animation: 'gentle-rotate 3s ease-in-out infinite',
                    }}
                >
                    🏆
                </span>
                <h1 style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #f5d5ff 0%, #e9b0ff 30%, #f0abfc 60%, #fda4af 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                    margin: 0,
                    filter: 'drop-shadow(0 0 16px rgba(192,132,252,0.3))',
                }}>
                    Мои призы
                </h1>
                <p style={{
                    color: 'rgba(192,132,252,0.5)',
                    fontSize: '12px',
                    fontWeight: 500,
                    marginTop: '6px',
                    letterSpacing: '0.05em',
                }}>
                    {loading ? 'Загрузка...' : prizes.length > 0 ? `Всего выигрышей: ${prizes.length}` : 'Твои выигрыши и награды'}
                </p>
            </motion.div>

            {/* ── Загрузка ─────────────────────────────────────── */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ zIndex: 1, padding: '40px 0' }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '3px solid rgba(168,85,247,0.2)',
                            borderTopColor: '#a855f7',
                        }}
                    />
                </motion.div>
            )}

            {/* ── Ошибка ──────────────────────────────────────── */}
            {error && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        zIndex: 1,
                        padding: '16px 24px',
                        borderRadius: '16px',
                        background: 'rgba(219,39,119,0.12)',
                        border: '1px solid rgba(219,39,119,0.3)',
                        color: '#f9a8d4',
                        fontSize: '13px',
                        textAlign: 'center',
                        maxWidth: '340px',
                    }}
                >
                    ⚠️ {error}
                </motion.div>
            )}

            {/* ── Список призов ────────────────────────────────── */}
            {!loading && !error && prizes.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxWidth: '380px',
                        width: '100%',
                        zIndex: 1,
                    }}
                >
                    <AnimatePresence>
                        {prizes.map((prize, idx) => {
                            const accentColor = (prize.prizeId && PRIZE_COLORS[prize.prizeId]) || '#a855f7';
                            const isCoupon = COUPON_PRIZE_IDS.includes(prize.prizeId || '');
                            const expiresAt = new Date(prize.wonAt).getTime() + PRIZE_EXPIRE_MS;
                            const isExpired = isCoupon && Date.now() > expiresAt;

                            return (
                                <motion.div
                                    key={prize.id}
                                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                                    animate={{ opacity: isExpired ? 0.45 : 1, x: 0, scale: 1 }}
                                    transition={{ delay: 0.05 * idx, type: 'spring', stiffness: 250, damping: 25 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0,
                                        padding: '14px 18px',
                                        borderRadius: '20px',
                                        background: isExpired
                                            ? 'linear-gradient(135deg, rgba(20,18,35,0.7) 0%, rgba(15,10,30,0.75) 100%)'
                                            : 'linear-gradient(135deg, rgba(30,18,65,0.8) 0%, rgba(20,10,45,0.85) 100%)',
                                        border: isExpired
                                            ? '1px solid rgba(120,110,150,0.15)'
                                            : `1px solid ${accentColor}22`,
                                        boxShadow: `0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        filter: isExpired ? 'grayscale(0.6)' : 'none',
                                    }}
                                >
                                    {/* Акцентная полоска слева */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '15%',
                                        bottom: '15%',
                                        width: '3px',
                                        borderRadius: '0 3px 3px 0',
                                        background: isExpired
                                            ? 'rgba(120,110,150,0.3)'
                                            : `linear-gradient(180deg, ${accentColor}, ${accentColor}66)`,
                                        boxShadow: isExpired ? 'none' : `0 0 8px ${accentColor}44`,
                                    }} />

                                    {/* Основная строка: иконка + текст + таймер/кнопка */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        {/* Иконка приза */}
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '14px',
                                            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
                                            border: `1px solid ${accentColor}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '22px',
                                            flexShrink: 0,
                                        }}>
                                            {prize.prizeIcon}
                                        </div>

                                        {/* Текст */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: isExpired ? 'rgba(180,170,200,0.45)' : '#e8dcf5',
                                                lineHeight: 1.3,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {prize.prizeName}
                                            </p>
                                            <p style={{
                                                margin: '3px 0 0',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                color: 'rgba(196,181,253,0.45)',
                                            }}>
                                                {formatDate(prize.wonAt)}
                                            </p>
                                        </div>

                                        {/* Таймер для купонов (пока не истёк) */}
                                        {isCoupon && !isExpired && (
                                            <PrizeCountdown wonAt={prize.wonAt} />
                                        )}

                                        {/* Кнопка для медведя */}
                                        {prize.prizeId === 'telegram_bear' && (
                                            <motion.a
                                                href="https://t.me/servise_support"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                whileTap={{ scale: 0.93 }}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #0e5a8a, #2AABEE)',
                                                    border: '1px solid rgba(42,171,238,0.4)',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    letterSpacing: '0.03em',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Менеджер
                                            </motion.a>
                                        )}

                                        {/* Кнопка «Забрать» для купонов — только если НЕ истёк */}
                                        {isCoupon && !isExpired && (
                                            <motion.a
                                                href="https://esotericvision.ru/checkout/lottery"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                whileTap={{ scale: 0.93 }}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                                    border: '1px solid rgba(34,197,94,0.5)',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    letterSpacing: '0.03em',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Забрать
                                            </motion.a>
                                        )}
                                    </div>

                                    {/* Полоса прогресса истечения (под основной строкой) */}
                                    {isCoupon && (
                                        <ExpireProgressBar wonAt={prize.wonAt} expired={isExpired} accentColor={accentColor} />
                                    )}
                                </motion.div>
                            );

                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Пустое состояние ─────────────────────────────── */}
            {!loading && !error && prizes.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                    style={{
                        position: 'relative',
                        maxWidth: '360px',
                        width: '100%',
                        zIndex: 1,
                    }}
                >
                    {/* Размытый свет за карточкой */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '80%',
                        background: 'radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '44px 28px 36px',
                        borderRadius: '28px',
                        background: 'linear-gradient(145deg, rgba(30,18,65,0.85) 0%, rgba(20,10,45,0.9) 50%, rgba(25,12,55,0.85) 100%)',
                        border: '1px solid rgba(192,132,252,0.15)',
                        backdropFilter: 'blur(16px)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 4px 16px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                    }}>
                        {/* Декоративная полоса сверху */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '10%',
                            right: '10%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.4), rgba(236,72,153,0.3), transparent)',
                            borderRadius: '2px',
                        }} />

                        {/* Декоративное свечение в углу */}
                        <div style={{
                            position: 'absolute',
                            top: '-30px',
                            right: '-30px',
                            width: '120px',
                            height: '120px',
                            background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Анимированная иконка подарка */}
                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)',
                                    filter: 'blur(8px)',
                                    animation: 'gentle-scale 3s ease-in-out infinite',
                                    '--scale-to': '1.3',
                                } as React.CSSProperties}
                            />
                            <div
                                style={{
                                    fontSize: '72px', lineHeight: 1, position: 'relative',
                                    animation: 'float-y 3.5s ease-in-out infinite',
                                    '--float-dist': '-10px',
                                } as React.CSSProperties}
                            >
                                🎁
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <p style={{
                                color: '#e2d6f8',
                                fontSize: '18px',
                                fontWeight: 700,
                                margin: '0 0 8px',
                                lineHeight: 1.3,
                                letterSpacing: '-0.2px',
                            }}>
                                Пока здесь пусто
                            </p>
                            <p style={{
                                color: 'rgba(196,181,253,0.5)',
                                fontSize: '13px',
                                margin: 0,
                                lineHeight: 1.6,
                            }}>
                                Крути барабан и выигрывай призы!
                                <br />
                                Все твои выигрыши появятся здесь
                            </p>
                        </div>

                        <div style={{
                            width: '60%',
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.2), transparent)',
                            margin: '4px 0',
                        }} />

                        <motion.button
                            onClick={() => onNavigate('main')}
                            whileHover={{ scale: 1.04, boxShadow: '0 6px 24px rgba(168,85,247,0.5)' }}
                            whileTap={{ scale: 0.96 }}
                            style={{
                                position: 'relative',
                                padding: '14px 36px',
                                borderRadius: '16px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#fff',
                                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 40%, #7c3aed 70%, #6d28d9 100%)',
                                boxShadow: '0 4px 20px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.15)',
                                letterSpacing: '0.02em',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                                borderRadius: '16px 16px 0 0',
                                pointerEvents: 'none',
                            }} />
                            <span style={{ position: 'relative', zIndex: 1 }}>🎡 Крутить барабан</span>
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* ── Подсказки внизу ──────────────────────────────── */}
            {!loading && prizes.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        display: 'flex',
                        gap: '24px',
                        marginTop: '32px',
                        zIndex: 1,
                    }}
                >
                    {[
                        { icon: '🎰', text: 'Крути' },
                        { icon: '🎉', text: 'Выиграй' },
                        { icon: '🎁', text: 'Забери' },
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + i * 0.12 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '24px',
                                    animation: 'float-y 2s ease-in-out infinite',
                                    animationDelay: `${i * 0.3}s`,
                                    '--float-dist': '-3px',
                                    display: 'inline-block',
                                } as React.CSSProperties}
                            >
                                {step.icon}
                            </span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'rgba(192,132,252,0.45)',
                                letterSpacing: '0.04em',
                            }}>
                                {step.text}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default MyPrizesPage;
