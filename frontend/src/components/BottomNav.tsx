import React from 'react';
import { motion } from 'framer-motion';

export type PageType = 'main' | 'prizes';

interface BottomNavProps {
    activePage: PageType;
    onNavigate: (page: PageType) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
    const tabs = [
        { id: 'main' as PageType, label: 'Главная', icon: '🎡', action: () => onNavigate('main') },
        { id: 'prizes' as PageType, label: 'Мои призы', icon: '🏆', action: () => onNavigate('prizes') },
        { id: 'support' as PageType | 'support', label: 'Поддержка', icon: '💬', action: () => window.open('https://t.me/servise_support', '_blank') },
    ];

    return (
        <motion.nav
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 180, damping: 22 }}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '0 12px calc(env(safe-area-inset-bottom, 6px))',
            }}
        >
            {/* Liquid glass container */}
            <div style={{
                position: 'relative',
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
            }}>
                {/* Многослойный фон liquid glass */}
                {/* Слой 1: Глубокий blur */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backdropFilter: 'blur(40px) saturate(1.8) brightness(1.1)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.8) brightness(1.1)',
                }} />

                {/* Слой 2: Стеклянный градиент */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        linear-gradient(180deg, 
                            rgba(255,255,255,0.08) 0%, 
                            rgba(255,255,255,0.02) 30%,
                            rgba(15,10,35,0.5) 60%,
                            rgba(15,10,35,0.7) 100%
                        )
                    `,
                }} />

                {/* Слой 3: Радужная рефракция сверху */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1.5px',
                    background: `linear-gradient(90deg, 
                        transparent 0%, 
                        rgba(120,180,255,0.5) 15%,
                        rgba(168,85,247,0.6) 30%, 
                        rgba(236,72,153,0.5) 45%,
                        rgba(251,146,60,0.4) 55%,
                        rgba(168,85,247,0.6) 70%, 
                        rgba(120,180,255,0.5) 85%,
                        transparent 100%
                    )`,
                }} />

                {/* Слой 4: Внутренний блик — статичный */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 45%, transparent 55%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Слой 5: Тонкая внутренняя граница */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px 24px 0 0',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderBottom: 'none',
                    pointerEvents: 'none',
                }} />

                {/* Контент навигации */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    padding: '10px 4px 10px',
                    position: 'relative',
                }}>
                    {tabs.map((tab) => {
                        const isActive = tab.id === activePage;
                        return (
                            <motion.button
                                key={tab.id}
                                onClick={tab.action}
                                whileTap={{ scale: 0.88 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px 22px',
                                    borderRadius: '16px',
                                    position: 'relative',
                                    WebkitTapHighlightColor: 'transparent',
                                    outline: 'none',
                                }}
                            >
                                {/* Liquid подсветка активной вкладки */}
                                {isActive && (
                                    <>
                                        {/* Мягкое размытое свечение */}
                                        <motion.div
                                            layoutId="liquid-glow"
                                            style={{
                                                position: 'absolute',
                                                inset: '-6px',
                                                borderRadius: '22px',
                                                background: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.2) 0%, rgba(120,180,255,0.08) 50%, transparent 75%)',
                                                filter: 'blur(8px)',
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                        />
                                        {/* Стеклянная пилюля с рефракцией */}
                                        <motion.div
                                            layoutId="liquid-pill"
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '16px',
                                                background: `
                                                    linear-gradient(135deg, 
                                                        rgba(255,255,255,0.12) 0%, 
                                                        rgba(168,85,247,0.08) 40%,
                                                        rgba(120,180,255,0.06) 70%,
                                                        rgba(255,255,255,0.04) 100%
                                                    )
                                                `,
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                boxShadow: `
                                                    inset 0 1px 1px rgba(255,255,255,0.1),
                                                    inset 0 -1px 1px rgba(0,0,0,0.05),
                                                    0 2px 12px rgba(168,85,247,0.12)
                                                `,
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                        />
                                        {/* Верхний блик — имитация преломления */}
                                        <motion.div
                                            layoutId="liquid-refract"
                                            style={{
                                                position: 'absolute',
                                                top: '1px',
                                                left: '15%',
                                                right: '15%',
                                                height: '1px',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                                                borderRadius: '1px',
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                        />
                                    </>
                                )}

                                {/* Иконка */}
                                <span
                                    style={{
                                        fontSize: '22px',
                                        position: 'relative',
                                        zIndex: 1,
                                        lineHeight: 1,
                                        display: 'inline-block',
                                        animation: isActive ? 'gentle-scale 2.5s ease-in-out infinite' : 'none',
                                        filter: isActive ? 'drop-shadow(0 0 5px rgba(192,132,252,0.4))' : 'none',
                                        willChange: isActive ? 'transform' : 'auto',
                                    }}
                                >
                                    {tab.icon}
                                </span>

                                {/* Лейбл */}
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(180,170,210,0.4)',
                                    letterSpacing: '0.03em',
                                    transition: 'color 0.3s ease',
                                    position: 'relative',
                                    zIndex: 1,
                                    textShadow: isActive ? '0 0 10px rgba(192,132,252,0.35)' : 'none',
                                }}>
                                    {tab.label}
                                </span>

                                {/* Точка-индикатор */}
                                {isActive && (
                                    <motion.div
                                        layoutId="liquid-dot"
                                        style={{
                                            position: 'absolute',
                                            bottom: '0px',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.6)',
                                            boxShadow: '0 0 6px rgba(192,132,252,0.5), 0 0 12px rgba(120,180,255,0.3)',
                                        }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.nav>
    );
};

export default BottomNav;
