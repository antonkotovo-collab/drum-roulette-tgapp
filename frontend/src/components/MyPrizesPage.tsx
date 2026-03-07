import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageType } from './BottomNav';
import type { UserPrize } from '../types/prizes';
import { getUserPrizes } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const COUPON_EXPIRY_MS = 30 * 60 * 1000; // 30 минут
const COUPON_IDS = ['zolotoe_yabloko', 'ozon', 'uber', 'yandex', 'wildberries'];

/**
 * Хук обратного отсчёта для купонов.
 * Возвращает { expired, label } — истёк и строка остатка в формате MM:SS.
 */
function usePrizeTimer(wonAt: string): { expired: boolean; label: string } {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const elapsed = now - new Date(wonAt).getTime();
    const remaining = Math.max(0, COUPON_EXPIRY_MS - elapsed);
    const expired = remaining === 0;
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const label = expired ? '' : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return { expired, label };
}
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

interface MyPrizesPageProps {
    onNavigate: (page: PageType) => void;
}

/**
 * Отдельный компонент кнопки для купонов — нужен чтобы вызвать usePrizeTimer внутри .map().
 */
const CouponButton: React.FC<{ wonAt: string; href: string; accentColor: string }> = ({ wonAt, href, accentColor }) => {
    const { expired, label } = usePrizeTimer(wonAt);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            {expired ? (
                <div style={{
                    padding: '4px 10px',
                    borderRadius: '10px',
                    background: 'rgba(100,100,120,0.25)',
                    border: '1px solid rgba(150,150,180,0.2)',
                    color: 'rgba(180,170,210,0.45)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    cursor: 'not-allowed',
                    whiteSpace: 'nowrap',
                }}>
                    Истёк ⏰
                </div>
            ) : (
                <motion.a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => {
                        // Fire-and-forget tracking event
                        try {
                            const tg = (window as any).Telegram?.WebApp;
                            const telegramId = tg?.initDataUnsafe?.user?.id
                                ? String(tg.initDataUnsafe.user.id)
                                : undefined;
                            fetch('/api/tracking/event', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ event: 'pay_click', telegramId }),
                            }).catch(() => { });
                        } catch { /* ignore */ }
                    }}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${accentColor}88, ${accentColor})`,
                        border: `1px solid ${accentColor}50`,
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                        letterSpacing: '0.03em',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Забрать
                </motion.a>
            )}
            <span style={{
                fontSize: '9px',
                fontWeight: 600,
                color: expired ? 'rgba(180,170,210,0.3)' : 'rgba(200,180,255,0.55)',
                letterSpacing: '0.03em',
                lineHeight: 1,
            }}>
                {expired ? '' : label}
            </span>
        </div>
    );
};

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
                            return (
                                <motion.div
                                    key={prize.id}
                                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ delay: 0.05 * idx, type: 'spring', stiffness: 250, damping: 25 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 18px',
                                        borderRadius: '20px',
                                        background: 'linear-gradient(135deg, rgba(30,18,65,0.8) 0%, rgba(20,10,45,0.85) 100%)',
                                        border: `1px solid ${accentColor}22`,
                                        boxShadow: `0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`,
                                        position: 'relative',
                                        overflow: 'hidden',
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
                                        background: `linear-gradient(180deg, ${accentColor}, ${accentColor}66)`,
                                        boxShadow: `0 0 8px ${accentColor}44`,
                                    }} />

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
                                            color: '#e8dcf5',
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

                                    {/* Кнопка для медведя */}
                                    {prize.prizeId === 'telegram_bear' && (
                                        <motion.a
                                            href="https://t.me/supersupportforyou"
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
                                    {/* Кнопка для купонов */}
                                    {COUPON_IDS.includes(prize.prizeId || '') && (
                                        <CouponButton
                                            wonAt={prize.wonAt}
                                            href="https://esotericvision.ru/checkout/lottery"
                                            accentColor={accentColor}
                                        />
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
