import React from 'react';
import { motion } from 'framer-motion';

/* ─── SVG Логотипы брендов (те же, что в рулетке) ─────────────────────────── */

const BrandIcon: React.FC<{ prizeId: string; size?: number }> = ({ prizeId, size = 40 }) => {
    const s = size;
    const half = s / 2;

    switch (prizeId) {
        case 'iphone17':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.95)" />
                    <g transform="translate(10, 8) scale(0.85)">
                        <path fill="#1a1a1a" d="
                            M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83
                            -1.207.052-2.662.805-3.532 1.818
                            -.78.896-1.454 2.338-1.273 3.714
                            1.338.104 2.715-.688 3.559-1.701z
                            M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04
                            -2.04.027-3.91 1.183-4.96 3.014
                            -2.117 3.675-.54 9.103 1.519 12.09
                            1.013 1.454 2.208 3.09 3.792 3.029
                            1.52-.065 2.09-.987 3.935-.987
                            1.831 0 2.35.987 3.96.948
                            1.637-.026 2.676-1.48 3.676-2.948
                            1.156-1.688 1.636-3.325 1.662-3.415
                            -.039-.013-3.182-1.221-3.22-4.857
                            -.026-3.04 2.48-4.494 2.597-4.559
                            -1.429-2.09-3.623-2.324-4.39-2.376
                            -2-.156-3.675 1.09-4.61 1.09z
                        " />
                    </g>
                </svg>
            );

        case 'zolotoe_yabloko':
            return (
                <img src="/zya-logo.png" alt="Золотое Яблоко" width={s} height={s}
                    style={{ display: 'block', borderRadius: '8px' }} />
            );

        case 'ozon':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ffffff" opacity="0.95" />
                    <text fontSize="22" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#005BFF" x="20" y="21" fontFamily="Inter,sans-serif">O</text>
                </svg>
            );

        case 'uber':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <rect x="2" y="2" width="36" height="36" rx="10" fill="#ffffff" opacity="0.95" />
                    <text fontSize="22" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#000000" x="20" y="21" fontFamily="Inter,sans-serif">U</text>
                </svg>
            );

        case 'yandex':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ffffff" opacity="0.95" />
                    <text fontSize="22" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#FFCC00" x="20" y="21" fontFamily="Inter,sans-serif">Я</text>
                </svg>
            );

        case 'wildberries':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ffffff" opacity="0.95" />
                    <text fontSize="15" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#CB11AB" x="20" y="21" fontFamily="Inter,sans-serif">WB</text>
                </svg>
            );

        case 'extra_spin_1':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ffffff" opacity="0.95" />
                    <text fontSize="18" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#D63031" x="20" y="21" fontFamily="Inter,sans-serif">×1</text>
                </svg>
            );

        case 'extra_spin_2':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ffffff" opacity="0.95" />
                    <text fontSize="18" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#FF8C00" x="20" y="21" fontFamily="Inter,sans-serif">×2</text>
                </svg>
            );

        case 'telegram_bear':
            return (
                <img src="/bear4444.png" alt="Telegram Bear" width={s * 2.4} height={s * 2.4}
                    style={{ display: 'block', borderRadius: '8px', objectFit: 'contain' }} />
            );

        default:
            return <span style={{ fontSize: `${s * 0.7}px` }}>🎁</span>;
    }
};

/* ─── Данные призов ────────────────────────────────────────────────────────── */

interface ShowcasePrize {
    id: string;
    name: string;
    subtitle: string;
    gradient: string;
    border: string;
    glow: string;
    textColor: string;
}

const MAIN_PRIZE: ShowcasePrize = {
    id: 'iphone17',
    name: 'iPhone 17 Pro Max',
    subtitle: '256 GB',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    border: 'rgba(253,230,138,0.6)',
    glow: '0 0 30px rgba(253,230,138,0.3), 0 0 60px rgba(253,230,138,0.1)',
    textColor: '#fde68a',
};

const COUPON_PRIZES: ShowcasePrize[] = [
    {
        id: 'zolotoe_yabloko',
        name: 'Золотое Яблоко',
        subtitle: '5 000 ₽',
        gradient: 'linear-gradient(135deg, #1a2d00 0%, #2a4a00 100%)',
        border: 'rgba(202,252,56,0.4)',
        glow: '0 0 20px rgba(202,252,56,0.15)',
        textColor: '#CAFC38',
    },
    {
        id: 'ozon',
        name: 'Ozon',
        subtitle: '5 000 ₽',
        gradient: 'linear-gradient(135deg, #001a4d 0%, #003db3 100%)',
        border: 'rgba(0,91,255,0.4)',
        glow: '0 0 20px rgba(0,91,255,0.15)',
        textColor: '#79b0ff',
    },
    {
        id: 'uber',
        name: 'Uber',
        subtitle: '10 поездок',
        gradient: 'linear-gradient(135deg, #111111 0%, #2a2a2a 100%)',
        border: 'rgba(255,255,255,0.25)',
        glow: '0 0 20px rgba(255,255,255,0.08)',
        textColor: '#ffffff',
    },
    {
        id: 'yandex',
        name: 'Яндекс',
        subtitle: '5 000 ₽',
        gradient: 'linear-gradient(135deg, #3d2a00 0%, #665200 100%)',
        border: 'rgba(255,204,0,0.4)',
        glow: '0 0 20px rgba(255,204,0,0.15)',
        textColor: '#FFCC00',
    },
    {
        id: 'wildberries',
        name: 'Wildberries',
        subtitle: '5 000 ₽',
        gradient: 'linear-gradient(135deg, #2d0033 0%, #5c006b 100%)',
        border: 'rgba(203,17,171,0.4)',
        glow: '0 0 20px rgba(203,17,171,0.15)',
        textColor: '#e94dd6',
    },
];

const BONUS_PRIZES: ShowcasePrize[] = [
    {
        id: 'extra_spin_1',
        name: '+1 Спин',
        subtitle: 'Доп. прокрут',
        gradient: 'linear-gradient(135deg, #3b0000 0%, #6b1010 100%)',
        border: 'rgba(214,48,49,0.35)',
        glow: '0 0 16px rgba(214,48,49,0.12)',
        textColor: '#ff7b7b',
    },
    {
        id: 'extra_spin_2',
        name: '+2 Спина',
        subtitle: 'Доп. прокруты',
        gradient: 'linear-gradient(135deg, #3d1a00 0%, #6b3500 100%)',
        border: 'rgba(255,140,0,0.35)',
        glow: '0 0 16px rgba(255,140,0,0.12)',
        textColor: '#ffb366',
    },
    {
        id: 'telegram_bear',
        name: 'Медведь',
        subtitle: 'TG подарок',
        gradient: 'linear-gradient(135deg, #2e1a08 0%, #5c3a1e 100%)',
        border: 'rgba(200,136,42,0.35)',
        glow: '0 0 16px rgba(200,136,42,0.12)',
        textColor: '#e8c078',
    },
];

/* ─── Анимации ─────────────────────────────────────────────────────────────── */

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ─── Компонент карточки приза ──────────────────────────────────────────────── */

const PrizeCard: React.FC<{
    prize: ShowcasePrize;
    isMain?: boolean;
}> = ({ prize, isMain }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
            position: 'relative',
            background: prize.gradient,
            borderRadius: isMain ? '20px' : '16px',
            border: `1.5px solid ${prize.border}`,
            padding: isMain ? '20px 24px' : '14px 12px',
            display: 'flex',
            flexDirection: isMain ? 'row' : 'column',
            alignItems: 'center',
            gap: isMain ? '16px' : '8px',
            boxShadow: prize.glow,
            overflow: 'hidden',
            cursor: 'default',
        }}
    >
        {/* Shimmer overlay для главного приза — CSS animation */}
        {isMain && (
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(105deg, transparent 30%, rgba(253,230,138,0.08) 45%, rgba(253,230,138,0.15) 50%, rgba(253,230,138,0.08) 55%, transparent 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite',
                    willChange: 'background-position',
                }}
            />
        )}

        {/* Иконка — SVG логотип бренда */}
        <div
            style={{
                zIndex: 1,
                filter: isMain ? 'drop-shadow(0 0 12px rgba(253,230,138,0.4))' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: isMain ? undefined : (prize.id === 'telegram_bear' ? undefined : '40px'),
                height: isMain ? undefined : (prize.id === 'telegram_bear' ? undefined : '40px'),
                flexShrink: 0,
                overflow: 'visible',
                animation: isMain ? 'gentle-scale 2.5s ease-in-out infinite' : 'none',
                willChange: isMain ? 'transform' : 'auto',
            }}
        >
            <BrandIcon prizeId={prize.id} size={isMain ? 48 : 36} />
        </div>

        {/* Текст */}
        <div style={{ zIndex: 1, textAlign: isMain ? 'left' : 'center' }}>
            <p style={{
                margin: 0,
                fontSize: isMain ? '16px' : '11px',
                fontWeight: 800,
                color: prize.textColor,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
            }}>
                {prize.name}
            </p>
            <p style={{
                margin: isMain ? '4px 0 0' : '2px 0 0',
                fontSize: isMain ? '13px' : '10px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.2,
            }}>
                {prize.subtitle}
            </p>
        </div>

        {/* Бейдж «Главный приз» */}
        {isMain && (
            <div
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    padding: '3px 10px',
                    borderRadius: '10px',
                    background: 'rgba(253,230,138,0.15)',
                    border: '1px solid rgba(253,230,138,0.3)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#fde68a',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase' as const,
                    animation: 'pulse-opacity-text 2s ease-in-out infinite',
                }}
            >
                ⭐ Главный приз
            </div>
        )}
    </motion.div>
);

/* ─── Основной компонент ───────────────────────────────────────────────────── */

const PrizeShowcase: React.FC = () => {
    return (
        <motion.section
            className="w-full px-4"
            style={{ zIndex: 1, maxWidth: '420px' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={containerVariants}
        >
            {/* ── Заголовок ───────────────────────────────────────────── */}
            <motion.div
                className="text-center mb-4"
                variants={itemVariants}
            >
                <div className="flex items-center justify-center gap-2 mb-1">
                    <span
                        className="text-xl"
                        style={{
                            display: 'inline-block',
                            animation: 'gentle-rotate 3s ease-in-out infinite',
                        }}
                    >🎁</span>
                    <h2 style={{
                        fontSize: '17px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #e9d5ff 0%, #f0abfc 50%, #fda4af 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.3px',
                        margin: 0,
                    }}>
                        Что можно выиграть
                    </h2>
                    <span
                        className="text-xl"
                        style={{
                            display: 'inline-block',
                            animation: 'gentle-rotate 3s ease-in-out infinite 0.5s',
                            '--rotate-to': '-10deg',
                            '--rotate-from': '10deg',
                        } as React.CSSProperties}
                    >🎁</span>
                </div>
                <p style={{
                    fontSize: '12px',
                    color: 'rgba(192,132,252,0.6)',
                    fontWeight: 500,
                    margin: 0,
                }}>
                    Крути барабан и забирай призы!
                </p>
            </motion.div>

            {/* ── Главный приз ─────────────────────────────────────────── */}
            <PrizeCard prize={MAIN_PRIZE} isMain />

            {/* ── Купоны — сетка 3 колонки ────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: '10px',
            }}>
                {COUPON_PRIZES.map((p) => (
                    <PrizeCard key={p.id} prize={p} />
                ))}
            </div>

            {/* ── Разделитель ──────────────────────────────────────────── */}
            <motion.div
                variants={itemVariants}
                style={{
                    margin: '12px auto 10px',
                    width: '60%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.3), transparent)',
                }}
            />

            {/* ── Бонусные призы ───────────────────────────────────────── */}
            <motion.p
                variants={itemVariants}
                style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'rgba(192,132,252,0.55)',
                    textAlign: 'center',
                    margin: '0 0 8px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                }}
            >
                Бонусные призы
            </motion.p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
            }}>
                {BONUS_PRIZES.map((p) => (
                    <PrizeCard key={p.id} prize={p} />
                ))}
            </div>
        </motion.section>
    );
};

export default PrizeShowcase;
