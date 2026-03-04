import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useTelegram } from '../../hooks/useTelegram';

const CHECKOUT_URL = 'https://esotericvision.ru/checkout/lottery';
const BEAR_URL = 'https://t.me/supersupportforyou';
const EXTRA_SPIN_IDS = ['extra_spin_1', 'extra_spin_2'];
const BEAR_PRIZE_ID = 'telegram_bear';

// Брендовые темы для каждого приза
const BRAND: Record<string, {
    bg: string; border: string; titleGrad: string;
    btnBg: string; btnText: string; btnShadow: string;
    muted: string; glow: string; particles: string[];
    badge: React.ReactNode;
}> = {
    iphone17: {
        bg: 'linear-gradient(145deg,#1a1a1a,#2d2d2d,#111)',
        border: 'rgba(200,200,200,0.35)',
        titleGrad: 'linear-gradient(135deg,#e8e8e8,#ffffff)',
        btnBg: 'linear-gradient(135deg,#555,#fff)', btnText: '#111',
        btnShadow: '0 4px 20px rgba(255,255,255,0.3)',
        muted: '#aaaaaa', glow: 'radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 70%)',
        particles: ['🍎', '✨', '💫', '⭐'],
        badge: (
            <div style={{
                width: 96, height: 96, borderRadius: 24, background: 'linear-gradient(145deg,#2d2d2d,#111)',
                border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(255,255,255,0.15)'
            }}>
                <svg viewBox="0 0 24 26" width="52" height="56" fill="white">
                    <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701zM12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.96 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z" />
                </svg>
            </div>
        ),
    },
    zolotoe_yabloko: {
        bg: 'linear-gradient(145deg,#1a2d00,#2a4200,#162500)',
        border: 'rgba(202,252,56,0.5)',
        titleGrad: 'linear-gradient(135deg,#CAFC38,#88c800)',
        btnBg: 'linear-gradient(135deg,#3f5500,#CAFC38)', btnText: '#1a2d00',
        btnShadow: '0 4px 20px rgba(150,200,0,0.5)',
        muted: '#a8c840', glow: 'radial-gradient(circle,rgba(120,200,0,0.15) 0%,transparent 70%)',
        particles: ['🍃', '🌿', '✨', '🌱'],
        badge: (
            <div style={{
                width: 96, height: 96, borderRadius: 24, background: '#CAFC38', display: 'flex', alignItems: 'center',
                justifyContent: 'center', boxShadow: '0 0 40px rgba(202,252,56,0.5)'
            }}>
                <img src="/zya-logo.png" alt="Золотое Яблоко" style={{ width: 70, height: 70, objectFit: 'contain' }} />
            </div>
        ),
    },
    ozon: {
        bg: 'linear-gradient(145deg,#002080,#003cb3,#001560)',
        border: 'rgba(0,91,255,0.5)',
        titleGrad: 'linear-gradient(135deg,#55aaff,#ffffff)',
        btnBg: 'linear-gradient(135deg,#001560,#005BFF)', btnText: '#fff',
        btnShadow: '0 4px 20px rgba(0,91,255,0.5)',
        muted: '#80aaff', glow: 'radial-gradient(circle,rgba(0,91,255,0.2) 0%,transparent 70%)',
        particles: ['🛒', '📦', '✨', '💙'],
        badge: (
            <div style={{
                width: 96, height: 96, borderRadius: 24, background: '#005BFF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', boxShadow: '0 0 30px rgba(0,91,255,0.5)'
            }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: 'white', fontFamily: 'Inter,sans-serif', letterSpacing: -2 }}>O</span>
            </div>
        ),
    },
    uber: {
        bg: 'linear-gradient(145deg,#000,#1a1a1a,#000)',
        border: 'rgba(255,255,255,0.2)',
        titleGrad: 'linear-gradient(135deg,#ffffff,#cccccc)',
        btnBg: 'linear-gradient(135deg,#333,#fff)', btnText: '#000',
        btnShadow: '0 4px 20px rgba(255,255,255,0.2)',
        muted: '#888888', glow: 'radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 70%)',
        particles: ['🚗', '🏎️', '✨', '⚡'],
        badge: (
            <div style={{
                width: 96, height: 96, borderRadius: 24, background: '#000', border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,255,255,0.1)'
            }}>
                <span style={{ fontSize: 58, fontWeight: 900, color: 'white', fontFamily: 'Inter,sans-serif', lineHeight: 1 }}>U</span>
            </div>
        ),
    },
    yandex: {
        bg: 'linear-gradient(145deg,#3d3000,#5a4500,#2a2000)',
        border: 'rgba(255,204,0,0.5)',
        titleGrad: 'linear-gradient(135deg,#FFCC00,#ffe566)',
        btnBg: 'linear-gradient(135deg,#2a2000,#FFCC00)', btnText: '#1a1400',
        btnShadow: '0 4px 20px rgba(255,204,0,0.5)',
        muted: '#ccaa00', glow: 'radial-gradient(circle,rgba(255,204,0,0.2) 0%,transparent 70%)',
        particles: ['⚡', '✨', '🌟', '💛'],
        badge: (
            <div style={{
                width: 96, height: 96, borderRadius: 24, background: '#FFCC00', display: 'flex', alignItems: 'center',
                justifyContent: 'center', boxShadow: '0 0 30px rgba(255,204,0,0.5)'
            }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: '#111', fontFamily: 'Inter,sans-serif' }}>Я</span>
            </div>
        ),
    },
    wildberries: {
        bg: 'linear-gradient(145deg,#5a0050,#a50d8a,#3d0038)',
        border: 'rgba(203,17,171,0.5)',
        titleGrad: 'linear-gradient(135deg,#ff80ee,#ffffff)',
        btnBg: 'linear-gradient(135deg,#3d0038,#CB11AB)', btnText: '#fff',
        btnShadow: '0 4px 20px rgba(203,17,171,0.5)',
        muted: '#dd80cc', glow: 'radial-gradient(circle,rgba(203,17,171,0.2) 0%,transparent 70%)',
        particles: ['🛍️', '💜', '✨', '🌸'],
        badge: (
            <div style={{
                width: 96, height: 96, borderRadius: 24, background: '#CB11AB', display: 'flex', alignItems: 'center',
                justifyContent: 'center', boxShadow: '0 0 30px rgba(203,17,171,0.5)'
            }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Inter,sans-serif' }}>WB</span>
            </div>
        ),
    },
    telegram_bear: {
        bg: 'linear-gradient(145deg,#1e1040,#2d1060,#1a0d35)',
        border: 'rgba(42,171,238,0.25)',
        titleGrad: 'linear-gradient(135deg,#d4a5f5,#f5a5d4)',
        btnBg: 'linear-gradient(135deg,#0e5a8a,#2AABEE)', btnText: '#fff',
        btnShadow: '0 4px 20px rgba(42,171,238,0.5)',
        muted: '#a78bca',
        glow: 'radial-gradient(circle,rgba(147,51,234,0.2) 0%,transparent 70%)',
        particles: ['🐻', '✨', '🎁', '💙'],
        badge: (
            <div style={{
                width: 220, height: 220, borderRadius: 36,
                background: 'linear-gradient(145deg,#1a6fa0,#2AABEE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(42,171,238,0.5)',
            }}>
                <img src="/bear4444.png" alt="Мишка" style={{ width: 200, height: 200, objectFit: 'contain' }} />
            </div>
        ),
    },
};

const DEFAULT_BRAND = {
    bg: 'linear-gradient(145deg,#1e1040,#2d1060,#1a0d35)',
    border: 'rgba(212,165,245,0.35)',
    titleGrad: 'linear-gradient(135deg,#d4a5f5,#f5a5d4)',
    btnBg: 'linear-gradient(135deg,#9333ea,#db2777)', btnText: '#fff',
    btnShadow: '0 4px 20px rgba(147,51,234,0.5)',
    muted: '#a78bca', glow: 'radial-gradient(circle,rgba(147,51,234,0.2) 0%,transparent 70%)',
    particles: ['✨', '🌸', '⭐', '💫'],
    badge: null as React.ReactNode,
};

const PrizeModal: React.FC<{ onNoSpins?: () => void }> = ({ onNoSpins }) => {
    const { showModal, modalType, closeModal, lastResult, spinsLeft } = useGameStore();
    const { openLink } = useTelegram();

    const handleClose = () => {
        closeModal();
        if (spinsLeft <= 0) onNoSpins?.();
    };

    const isVisible = showModal && modalType === 'prize';
    const prize = lastResult?.prize;
    const prizeId = lastResult?.prizeId ?? '';
    const isExtraSpin = EXTRA_SPIN_IDS.includes(prizeId as string);
    const isBear = prizeId === BEAR_PRIZE_ID;
    const brand = BRAND[prizeId as string] ?? DEFAULT_BRAND;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <motion.div className="fixed inset-0 backdrop-blur-sm" style={{ background: 'rgba(10,5,20,0.9)', zIndex: 200 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

                    <motion.div className="fixed inset-x-4 bottom-24 rounded-3xl overflow-hidden" style={{ zIndex: 210 }}
                        initial={{ y: 120, opacity: 0, scale: 0.85 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 120, opacity: 0, scale: 0.85 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}>

                        <div className="relative p-8 text-center overflow-hidden"
                            style={{ background: brand.bg, border: `1.5px solid ${brand.border}`, borderRadius: '24px' }}>

                            {/* Фоновое свечение */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
                                style={{ background: brand.glow }} />

                            {/* Кнопка закрытия */}
                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.15, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    position: 'absolute', top: 14, right: 14,
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: 18, lineHeight: '32px', textAlign: 'center',
                                    cursor: 'pointer', zIndex: 20,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                ×
                            </motion.button>

                            {/* Плавающие частицы — CSS animation */}
                            {brand.particles.map((e, i) => (
                                <span key={i} className="absolute text-xl pointer-events-none"
                                    style={{
                                        top: `${8 + i * 14}%`,
                                        left: i % 2 === 0 ? `${4 + i * 2}%` : 'auto',
                                        right: i % 2 !== 0 ? `${4 + i * 2}%` : 'auto',
                                        animation: `${i % 2 === 0 ? 'float-particle' : 'float-particle-reverse'} 2.5s ease-in-out infinite`,
                                        animationDelay: `${i * 0.4}s`,
                                    }}
                                >{e}</span>
                            ))}

                            {/* Заголовок */}
                            {isBear ? (
                                <h2 className="text-3xl font-black mb-1 relative z-10"
                                    style={{
                                        color: '#d4a5f5',
                                        animation: 'pulse-opacity-text 2s ease-in-out infinite',
                                    }}>
                                    🎉 Поздравляем!
                                </h2>
                            ) : (
                                <h2 className="text-3xl font-black mb-1 relative z-10"
                                    style={{
                                        background: brand.titleGrad,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>
                                    {isExtraSpin ? '🎡 Повезло!' : '🎉 Поздравляем!'}
                                </h2>
                            )}
                            <p className="relative z-10" style={{ color: brand.muted, fontSize: '14px', marginBottom: '20px' }}>
                                {isExtraSpin ? 'Вам выпали дополнительные прокруты!' : isBear ? 'Вы выиграли Telegram подарок!' : 'Вы выиграли приз!'}
                            </p>

                            {/* Бренд-бейдж */}
                            {!isExtraSpin && (
                                <motion.div className="relative z-10 flex justify-center mb-4"
                                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}>
                                    {brand.badge ?? (
                                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl"
                                            style={{ background: 'rgba(147,51,234,0.15)', border: '2px solid rgba(212,165,245,0.4)' }}>
                                            <span style={{ fontSize: 52 }}>{prize?.icon}</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Название */}
                            {prize && (
                                <div className="relative z-10 mb-3">
                                    <p style={{ color: brand.muted, fontSize: '13px', marginBottom: '4px' }}>
                                        {isExtraSpin ? 'Начислено' : isBear ? 'Ваш подарок' : 'Заберите'}
                                    </p>
                                    <p className="font-black text-xl leading-tight"
                                        style={{ background: brand.titleGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {isBear ? 'Telegram подарок Мишка' : prize.name}
                                    </p>
                                </div>
                            )}

                            {/* Счётчик для extra-спинов */}
                            {isExtraSpin && (
                                <motion.div className="relative z-10 mb-4 py-3 px-4 rounded-2xl"
                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                                    style={{ background: 'rgba(147,51,234,0.2)', border: '1.5px solid rgba(212,165,245,0.4)' }}>
                                    <p style={{ color: '#c084fc', fontSize: '13px', marginBottom: '4px' }}>Прокрутов осталось</p>
                                    <p className="font-black text-4xl" style={{ color: '#f0d9ff' }}>
                                        {spinsLeft}
                                    </p>
                                </motion.div>
                            )}

                            {/* CTA */}
                            {isExtraSpin ? (
                                <motion.button onClick={closeModal}
                                    whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                                    className="relative z-10 w-full py-4 rounded-2xl font-black text-xl text-white mb-2"
                                    style={{ background: brand.btnBg, boxShadow: brand.btnShadow, color: brand.btnText }}>
                                    🎡 Крутить снова!
                                </motion.button>
                            ) : (
                                <>
                                    <motion.button onClick={() => { openLink(isBear ? BEAR_URL : CHECKOUT_URL); if (isBear) { closeModal(); if (spinsLeft <= 0) onNoSpins?.(); } }}
                                        whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                                        className="relative z-10 w-full py-4 rounded-2xl font-black text-xl mb-2"
                                        style={{ background: brand.btnBg, boxShadow: brand.btnShadow, color: brand.btnText }}>
                                        {isBear ? '🐻 Забрать подарок' : 'Забрать за 2₽'}
                                    </motion.button>
                                    {!isBear && <motion.div
                                        className="relative z-10 mt-1 rounded-2xl overflow-hidden"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        style={{
                                            background: 'rgba(251,146,60,0.12)',
                                            border: '1.5px solid rgba(251,146,60,0.5)',
                                            boxShadow: '0 0 18px rgba(251,146,60,0.2)',
                                            padding: '10px 14px',
                                        }}
                                    >
                                        {/* Пульсирующая полоска сверху */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                            background: 'linear-gradient(90deg, transparent, #fb923c, #fbbf24, #fb923c, transparent)',
                                            animation: 'pulse-opacity-text 1.8s ease-in-out infinite',
                                        }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🔒</span>
                                            <p style={{
                                                color: '#fdba74', fontSize: '12px', lineHeight: 1.55,
                                                fontWeight: 600, margin: 0, textAlign: 'left',
                                            }}>
                                                Для этого: необходимо оплатить 2 рубля для доступа к приватной раздаче!
                                                Подтвердите участие и дождитесь розыгрыша!
                                            </p>
                                        </div>
                                    </motion.div>}
                                </>
                            )}

                            {/* ── Инструкция для получения приза ── */}
                            {isBear && (
                                <motion.div
                                    className="relative z-10 mt-3 rounded-2xl overflow-hidden"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(251,146,60,0.12))',
                                        border: '1.5px solid rgba(250,204,21,0.6)',
                                        boxShadow: '0 0 24px rgba(250,204,21,0.25)',
                                        padding: '12px 16px',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                        background: 'linear-gradient(90deg, transparent, #facc15, #fb923c, #facc15, transparent)',
                                        animation: 'pulse-opacity-text 1.2s ease-in-out infinite',
                                    }}
                                    />
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: 800,
                                            color: '#facc15',
                                            letterSpacing: '0.2px',
                                            textShadow: '0 0 12px rgba(250,204,21,0.6)',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        📸 Чтобы забрать приз — отправьте скрин менеджеру
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PrizeModal;
