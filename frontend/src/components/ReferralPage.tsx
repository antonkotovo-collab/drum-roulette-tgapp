import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReferral, claimChannelBonus } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import type { PageType } from './BottomNav';
import type { ReferralResponse } from '../types/prizes';

interface ReferralPageProps {
    onNavigate: (page: PageType) => void;
}

const SPINS_PER_REFERRALS = 3; // 3 друга = 1 прокрут
const CHANNEL_URL = 'https://t.me/+OqPC07FuhIwxNjI8';

const ReferralPage: React.FC<ReferralPageProps> = ({ onNavigate }) => {
    const { initData, isReady } = useTelegram();
    const [data, setData] = useState<ReferralResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [shareAnim, setShareAnim] = useState(false);
    const [channelClaiming, setChannelClaiming] = useState(false);
    const [channelClaimAnim, setChannelClaimAnim] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isReady) return;
        try {
            setLoading(true);
            const r = await getReferral(initData);
            setData(r);
        } catch (_) {
            // ignore silently
        } finally {
            setLoading(false);
        }
    }, [isReady, initData]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Обработка реферального start_param вынесена в App.tsx (чтобы не дублировать)

    const handleShare = () => {
        if (!data) return;
        setShareAnim(true);
        setTimeout(() => setShareAnim(false), 600);

        const tg = (window as any).Telegram?.WebApp;
        const text = `🎡 Присоединяйся к Мартовской Лихорадке! Крути барабан и выигрывай призы!`;
        if (tg?.openTelegramLink) {
            tg.openTelegramLink(
                `https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent(text)}`,
            );
        } else if (navigator.share) {
            navigator.share({ title: '🎡 Мартовская Лихорадка', text, url: data.referralLink });
        } else {
            handleCopy();
        }
    };

    const handleCopy = () => {
        if (!data?.referralLink) return;
        navigator.clipboard.writeText(data.referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleChannelBonus = async () => {
        // Открываем канал в любом случае
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openTelegramLink) {
            tg.openTelegramLink(CHANNEL_URL);
        } else {
            window.open(CHANNEL_URL, '_blank');
        }

        if (data?.channelBonusClaimed || channelClaiming) return;
        try {
            setChannelClaiming(true);
            const result = await claimChannelBonus(initData);
            if (!result.alreadyClaimed) {
                setChannelClaimAnim(true);
                setTimeout(() => setChannelClaimAnim(false), 1500);
            }
            setData(prev => prev
                ? { ...prev, channelBonusClaimed: true, spinsLeft: result.spinsLeft ?? prev.spinsLeft }
                : prev
            );
        } catch (_) {
            // silent
        } finally {
            setChannelClaiming(false);
        }
    };

    // Прогресс внутри текущей «тройки»
    const progress = data ? data.referralCount % SPINS_PER_REFERRALS : 0;
    const progressPct = (progress / SPINS_PER_REFERRALS) * 100;

    return (
        <motion.div
            key="referral"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4 }}
            style={{
                width: '100%',
                maxWidth: 420,
                padding: '20px 16px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
            }}
        >
            {/* ── Заголовок ───────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ textAlign: 'center' }}
            >
                <div style={{ fontSize: 52, lineHeight: 1. }}>👥</div>
                <h2 style={{
                    marginTop: 8,
                    fontSize: 22,
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #e9d5ff 0%, #f0abfc 50%, #fda4af 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.4))',
                }}>
                    Пригласи друзей
                </h2>
                <p style={{ color: 'rgba(200,185,230,0.7)', fontSize: 13, marginTop: 4 }}>
                    3 друга = +1 бесплатный прокрут 🎁
                </p>
            </motion.div>

            {/* ── Карточка прогресса ───────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                    width: '100%',
                    borderRadius: 20,
                    padding: '20px 22px',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(120,180,255,0.08) 100%)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 32px rgba(168,85,247,0.1)',
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'rgba(200,185,230,0.5)', fontSize: 14, padding: '12px 0' }}>
                        Загрузка…
                    </div>
                ) : (
                    <>
                        {/* Счётчики */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: '#e9d5ff' }}>
                                    {data?.referralCount ?? 0}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(200,185,230,0.55)', marginTop: 2 }}>
                                    приглашено
                                </div>
                            </div>
                            <div style={{
                                width: 1,
                                background: 'rgba(168,85,247,0.2)',
                                margin: '0 16px',
                            }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: '#fda4af' }}>
                                    {data?.spinsEarned ?? 0}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(200,185,230,0.55)', marginTop: 2 }}>
                                    прокрутов заработано
                                </div>
                            </div>
                            <div style={{
                                width: 1,
                                background: 'rgba(168,85,247,0.2)',
                                margin: '0 16px',
                            }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: '#86efac' }}>
                                    {SPINS_PER_REFERRALS - progress}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(200,185,230,0.55)', marginTop: 2 }}>
                                    до спина
                                </div>
                            </div>
                        </div>

                        {/* Прогресс-бар */}
                        <div style={{ marginBottom: 8 }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                color: 'rgba(200,185,230,0.6)',
                                marginBottom: 6,
                            }}>
                                <span style={{ color: 'rgba(200,185,230,0.6)', fontSize: 11 }}>
                                    {progress === 0 && (data?.spinsEarned ?? 0) > 0
                                        ? '🎉 Цикл завершён! Начинаем новый'
                                        : 'Друзей приглашено в текущем цикле'}
                                </span>
                                <span style={{ fontWeight: 700, color: '#c084fc' }}>{progress}/{SPINS_PER_REFERRALS}</span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: 10,
                                borderRadius: 99,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(168,85,247,0.15)',
                                overflow: 'hidden',
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                                    style={{
                                        height: '100%',
                                        borderRadius: 99,
                                        background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 60%, #f9a8d4 100%)',
                                        boxShadow: '0 0 12px rgba(168,85,247,0.6)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Три иконки-шага */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.35 + i * 0.08 }}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                        background: i < progress
                                            ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                                            : 'rgba(255,255,255,0.05)',
                                        border: i < progress
                                            ? '1.5px solid rgba(168,85,247,0.6)'
                                            : '1.5px solid rgba(255,255,255,0.1)',
                                        boxShadow: i < progress ? '0 0 12px rgba(168,85,247,0.4)' : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {i < progress ? '✓' : '👤'}
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.59 }}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    color: 'rgba(200,185,230,0.35)',
                                    fontSize: 13, paddingLeft: 4,
                                }}
                            >→ 🎰</motion.div>
                        </div>
                    </>
                )}
            </motion.div>

            {/* ── Карточка «Подписка на канал» ─────────────────────── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28 }}
                style={{
                    width: '100%',
                    borderRadius: 20,
                    padding: '16px 20px',
                    background: data?.channelBonusClaimed
                        ? 'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(16,185,129,0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(22,163,74,0.14) 0%, rgba(16,185,129,0.08) 100%)',
                    border: data?.channelBonusClaimed
                        ? '1px solid rgba(34,197,94,0.2)'
                        : '1px solid rgba(34,197,94,0.35)',
                    boxShadow: data?.channelBonusClaimed
                        ? 'none'
                        : '0 4px 20px rgba(34,197,94,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Иконка */}
                <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: data?.channelBonusClaimed
                        ? 'rgba(34,197,94,0.12)'
                        : 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))',
                    border: '1px solid rgba(34,197,94,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                }}>
                    {data?.channelBonusClaimed ? '✅' : '📢'}
                </div>

                {/* Текст */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: 700,
                        color: data?.channelBonusClaimed ? 'rgba(134,239,172,0.7)' : '#86efac',
                        lineHeight: 1.3,
                    }}>
                        {data?.channelBonusClaimed ? 'Бонус за канал получен' : 'Подпишись на канал'}
                    </p>
                    <p style={{
                        margin: '3px 0 0', fontSize: 11, fontWeight: 500,
                        color: 'rgba(134,239,172,0.5)',
                    }}>
                        {data?.channelBonusClaimed
                            ? '+1 прокрут уже зачислен 🎰'
                            : '+1 бесплатный прокрут за подписку'}
                    </p>
                </div>

                {/* Кнопка */}
                {!data?.channelBonusClaimed && (
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        animate={channelClaimAnim ? { scale: [1, 1.15, 1] } : {}}
                        onClick={handleChannelBonus}
                        disabled={channelClaiming}
                        style={{
                            padding: '7px 14px',
                            borderRadius: 12,
                            border: 'none',
                            cursor: channelClaiming ? 'default' : 'pointer',
                            fontWeight: 800,
                            fontSize: 12,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                            boxShadow: '0 2px 12px rgba(34,197,94,0.4)',
                            flexShrink: 0,
                            WebkitTapHighlightColor: 'transparent',
                            opacity: channelClaiming ? 0.7 : 1,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {channelClaiming ? '...' : '📢 Подписаться'}
                    </motion.button>
                )}
            </motion.div>

            {/* ── Кнопка «Поделиться» ─────────────────────────────── */}

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ width: '100%' }}
            >
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    animate={shareAnim ? { scale: [1, 0.96, 1.04, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={handleShare}
                    style={{
                        width: '100%',
                        padding: '14px 0',
                        borderRadius: 16,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 15,
                        letterSpacing: 0.3,
                        color: '#fff',
                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                        boxShadow: '0 4px 24px rgba(168,85,247,0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {/* Блик */}
                    <div style={{
                        position: 'absolute', top: 0, left: '10%', right: '10%',
                        height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
                        borderRadius: '0 0 50% 50%', pointerEvents: 'none',
                    }} />
                    🔗 Поделиться ссылкой
                </motion.button>
            </motion.div>

            {/* ── Кнопка «Скопировать ссылку» ─────────────────────── */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCopy}
                style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 14,
                    border: '1.5px solid rgba(168,85,247,0.3)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'rgba(220,200,255,0.85)',
                    background: 'rgba(168,85,247,0.07)',
                    backdropFilter: 'blur(8px)',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.2s',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={copied ? 'copied' : 'copy'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'inline-block' }}
                    >
                        {copied ? '✅ Ссылка скопирована!' : '📋 Скопировать ссылку'}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            {/* ── Инструкция ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{
                    width: '100%',
                    borderRadius: 16,
                    padding: '16px 18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <p style={{ fontSize: 12, color: 'rgba(200,185,230,0.55)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Как это работает
                </p>
                {[
                    { icon: '🔗', text: 'Поделись своей ссылкой с друзьями' },
                    { icon: '👤', text: 'Друг переходит по ссылке и открывает приложение' },
                    { icon: '🎁', text: 'Каждые 3 друга = +1 бесплатный прокрут' },
                ].map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 2 ? 10 : 0 }}
                    >
                        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{step.icon}</span>
                        <span style={{ fontSize: 13, color: 'rgba(210,195,240,0.75)', lineHeight: 1.4 }}>{step.text}</span>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Назад ────────────────────────────────────────────── */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate('main')}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(190,175,220,0.45)',
                    fontSize: 13,
                    marginTop: 4,
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                ← На главную
            </motion.button>
        </motion.div>
    );
};

export default ReferralPage;
