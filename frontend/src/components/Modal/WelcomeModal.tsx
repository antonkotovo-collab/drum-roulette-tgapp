import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'wheel_welcome_shown';

const WelcomeModal: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Показываем только при первом визите
        if (!localStorage.getItem(STORAGE_KEY)) {
            // Небольшая задержка чтобы сначала загрузилось приложение
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px',
                        background: 'rgba(8, 4, 20, 0.75)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.82, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.05 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            width: '100%', maxWidth: '340px',
                            borderRadius: '28px',
                            padding: '2px',
                            background: 'linear-gradient(135deg, #f9a8d4 0%, #c084fc 40%, #818cf8 70%, #f9a8d4 100%)',
                        }}
                    >
                        {/* Внутренняя карточка */}
                        <div style={{
                            borderRadius: '26px',
                            background: 'linear-gradient(160deg, #1a0a2e 0%, #0f0720 60%, #1a0a35 100%)',
                            padding: '32px 28px 28px',
                            textAlign: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            {/* Размытый blob за текстом */}
                            <div style={{
                                position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
                                width: '260px', height: '160px', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(219,39,119,0.25) 0%, rgba(124,58,237,0.15) 60%, transparent 100%)',
                                filter: 'blur(30px)', pointerEvents: 'none',
                            }} />

                            {/* Цветки */}
                            <motion.div
                                animate={{ rotate: [0, 8, -8, 0], y: [0, -4, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ fontSize: '52px', lineHeight: 1, marginBottom: '4px', position: 'relative' }}
                            >
                                🌸
                            </motion.div>

                            {/* Плавающие тюльпаны по бокам */}
                            <motion.span
                                animate={{ y: [0, -6, 0], rotate: [-10, 5, -10] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ position: 'absolute', top: '24px', left: '20px', fontSize: '24px' }}
                            >🌷</motion.span>
                            <motion.span
                                animate={{ y: [0, -6, 0], rotate: [10, -5, 10] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                style={{ position: 'absolute', top: '24px', right: '20px', fontSize: '24px' }}
                            >🌷</motion.span>

                            {/* Заголовок */}
                            <h2 style={{
                                fontSize: '22px', fontWeight: 900, lineHeight: 1.2,
                                margin: '8px 0 12px',
                                background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 40%, #e879f9 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 14px rgba(249,168,212,0.5))',
                            }}>
                                С наступающим<br />8 Марта! 🎉
                            </h2>

                            {/* Разделитель */}
                            <div style={{
                                height: '1px', margin: '0 auto 16px',
                                width: '60%',
                                background: 'linear-gradient(90deg, transparent, rgba(249,168,212,0.5), transparent)',
                            }} />

                            {/* Текст */}
                            <p style={{
                                color: 'rgba(255,255,255,0.85)', fontSize: '14px',
                                lineHeight: 1.65, margin: '0 0 16px',
                            }}>
                                В честь праздника мы с партнёрами решили порадовать&nbsp;вас призами!
                            </p>

                            {/* Подарочный блок */}
                            <motion.div
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    borderRadius: '16px', padding: '14px 18px', margin: '0 0 16px',
                                    background: 'linear-gradient(135deg, rgba(219,39,119,0.2) 0%, rgba(124,58,237,0.2) 100%)',
                                    border: '1px solid rgba(249,168,212,0.25)',
                                }}
                            >
                                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🎁</div>
                                <p style={{
                                    color: 'white', fontSize: '15px', fontWeight: 700,
                                    margin: 0, lineHeight: 1.4,
                                }}>
                                    Мы дарим вам{' '}
                                    <span style={{
                                        background: 'linear-gradient(90deg, #f9a8d4, #e879f9)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        fontSize: '18px',
                                    }}>3 бесплатных</span>
                                    {' '}прокрута барабана!
                                </p>
                            </motion.div>

                            <p style={{
                                color: 'rgba(192,132,252,0.9)', fontSize: '13px',
                                fontStyle: 'italic', margin: '0 0 24px',
                            }}>
                                Удачи! ✨
                            </p>

                            {/* Кнопка */}
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleClose}
                                style={{
                                    width: '100%', padding: '15px',
                                    borderRadius: '16px', border: 'none', cursor: 'pointer',
                                    fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px',
                                    color: 'white',
                                    background: 'linear-gradient(135deg, #db2777 0%, #9333ea 50%, #6366f1 100%)',
                                    boxShadow: '0 4px 24px rgba(219,39,119,0.45), 0 0 40px rgba(147,51,234,0.25)',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                🎡 Крутить барабан!
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;
