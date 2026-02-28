import React from 'react';
import { motion } from 'framer-motion';

interface SpinButtonProps {
    onSpin: () => void;
    isSpinning: boolean;
    spinsLeft: number;
    isLoading: boolean;
}

const SpinButton: React.FC<SpinButtonProps> = ({ onSpin, isSpinning, spinsLeft, isLoading }) => {
    const isDisabled = isSpinning || spinsLeft <= 0 || isLoading;

    return (
        <div className="flex flex-col items-center gap-3 w-full">

            {/* ── Счётчик прокруток ── */}
            <div
                style={{
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '14px 32px',
                    borderRadius: '20px',
                    width: '100%', maxWidth: '320px',
                    background: spinsLeft <= 0
                        ? 'rgba(30,20,50,0.6)'
                        : 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(219,39,119,0.15) 100%)',
                    border: spinsLeft <= 0
                        ? '1px solid rgba(100,80,140,0.25)'
                        : spinsLeft === 1
                            ? '1px solid rgba(251,146,60,0.5)'
                            : '1px solid rgba(192,132,252,0.35)',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    boxShadow: spinsLeft > 1
                        ? '0 0 20px rgba(147,51,234,0.3)'
                        : 'none',
                }}
            >
                {/* Внутренний shimmer — CSS animation */}
                {spinsLeft > 0 && (
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '20px',
                        background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 5s ease-in-out infinite',
                        willChange: 'background-position',
                    }} />
                )}

                {/* Подпись сверху */}
                <span style={{
                    fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    color: spinsLeft <= 0 ? 'rgba(120,100,160,0.6)' : 'rgba(192,132,252,0.75)',
                    marginBottom: '2px',
                }}>
                    {spinsLeft <= 0 ? '🔒 закончились' : '🎡 осталось прокрутов'}
                </span>

                {/* Большое число */}
                <motion.span
                    key={spinsLeft}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    style={{
                        fontSize: '48px', fontWeight: 900, lineHeight: 1,
                        background: spinsLeft <= 0
                            ? 'rgba(80,60,110,0.5)'
                            : spinsLeft === 1
                                ? 'linear-gradient(135deg, #fb923c, #f97316)'
                                : 'linear-gradient(135deg, #e9d5ff, #c084fc, #f0abfc)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: spinsLeft === 1
                            ? 'drop-shadow(0 0 12px rgba(251,146,60,0.9))'
                            : spinsLeft > 1
                                ? 'drop-shadow(0 0 14px rgba(192,132,252,0.9))'
                                : 'none',
                    }}
                >{spinsLeft <= 0 ? '0' : spinsLeft}</motion.span>

                {/* Предупреждение при 1 прокруте */}
                {spinsLeft === 1 && (
                    <span
                        style={{
                            fontSize: '10px', color: '#fb923c', fontWeight: 700,
                            marginTop: '2px', letterSpacing: '1px',
                            animation: 'pulse-opacity-text 1s ease-in-out infinite',
                        }}
                    >⚡ ПОСЛЕДНИЙ!</span>
                )}
            </div>

            {/* Glow ring вокруг кнопки */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                {!isDisabled && (
                    <div
                        style={{
                            position: 'absolute', inset: -4, borderRadius: '20px',
                            background: 'linear-gradient(135deg, #9333ea, #db2777, #f59e0b)',
                            filter: 'blur(10px)',
                            animation: 'pulse-opacity 2s ease-in-out infinite',
                            '--pulse-from': '0.5',
                            '--pulse-to': '0.9',
                            willChange: 'opacity',
                        } as React.CSSProperties}
                    />
                )}

                <motion.button
                    onClick={onSpin}
                    disabled={isDisabled}
                    whileTap={!isDisabled ? { scale: 0.96 } : undefined}
                    className="relative w-full py-5 px-8 rounded-2xl font-black text-xl tracking-wider uppercase overflow-hidden"
                    style={
                        isDisabled
                            ? { background: '#2d1f55', color: '#5b4a8a', border: '2px solid #3d2d6e', cursor: 'not-allowed' }
                            : {
                                background: 'linear-gradient(135deg, #9333ea 0%, #c026d3 50%, #db2777 100%)',
                                color: 'white',
                                border: '2px solid rgba(255,255,255,0.25)',
                                boxShadow: '0 8px 32px rgba(147,51,234,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                            }
                    }
                >
                    {/* Верхний блик */}
                    {!isDisabled && (
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
                            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
                        />
                    )}

                    {/* Shimmer sweep — CSS animation */}
                    {!isDisabled && (
                        <div
                            style={{
                                position: 'absolute', inset: 0, borderRadius: '14px',
                                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 3.4s ease-in-out infinite',
                                willChange: 'background-position',
                            }}
                        />
                    )}

                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                style={{ animation: 'spin 1s linear infinite' }}>
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Загрузка...
                        </span>
                    ) : isSpinning ? (
                        <span className="flex items-center justify-center gap-2">
                            <span style={{
                                display: 'inline-block',
                                animation: 'spin 0.7s linear infinite',
                            }}>🎡</span>
                            Крутится...
                        </span>
                    ) : spinsLeft <= 0 ? (
                        '🔒 Прокруты закончились'
                    ) : (
                        '🎡 Крутить!'
                    )}
                </motion.button>
            </div>

            {!isDisabled && !isSpinning && (
                <p
                    style={{
                        color: '#c084fc', fontSize: '12px',
                        textShadow: '0 0 12px rgba(192,132,252,0.5)',
                        animation: 'pulse-opacity-text 2s ease-in-out infinite',
                    }}
                >
                    Нажми чтобы испытать удачу ✨
                </p>
            )}
        </div>
    );
};

export default SpinButton;
