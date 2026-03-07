import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';



const LoseModal: React.FC<{ onNoSpins?: () => void }> = ({ onNoSpins }) => {
    const { showModal, modalType, closeModal, spinsLeft } = useGameStore();

    const isVisible = showModal && modalType === 'lose';
    const noSpins = spinsLeft <= 0;

    const handleClose = () => {
        closeModal();
        if (noSpins) onNoSpins?.();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <motion.div
                        className="fixed inset-0 backdrop-blur-sm"
                        style={{ background: 'rgba(15, 10, 30, 0.85)', zIndex: 200 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeModal}
                    />

                    <motion.div
                        className="fixed inset-x-4 bottom-24" style={{ zIndex: 210 }}
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="p-8 text-center rounded-3xl"
                            style={{
                                background: noSpins
                                    ? 'linear-gradient(145deg, #1a0d30, #0f0a20)'
                                    : 'linear-gradient(145deg, #1a1030, #120d22)',
                                border: noSpins
                                    ? '1.5px solid rgba(147,51,234,0.4)'
                                    : '1.5px solid rgba(212,165,245,0.2)',
                                borderRadius: '24px',
                            }}>

                            {noSpins ? (
                                /* ── Экран "спины закончились" ── */
                                <>
                                    <div className="text-6xl mb-4 select-none"
                                        style={{
                                            animation: 'gentle-scale 2s ease-in-out infinite',
                                            '--scale-to': '1.1',
                                        } as React.CSSProperties}
                                    >⏳</div>

                                    <h2 className="text-2xl font-black text-white mb-3">
                                        Спины закончились
                                    </h2>

                                    <p style={{ color: '#a78bca', lineHeight: 1.6 }} className="text-sm mb-6">
                                        К сожалению ваши спины закончились.<br />
                                        Спины восполняются каждые{' '}
                                        <span style={{ color: '#d4a5f5', fontWeight: 700 }}>3 дня</span>.
                                    </p>

                                    <div className="rounded-xl py-3 px-4 mb-5"
                                        style={{ background: 'rgba(147,51,234,0.12)', border: '1px solid rgba(147,51,234,0.3)' }}>
                                        <span className="text-sm font-semibold" style={{ color: '#c084fc' }}>
                                            🎡 Следи за обновлением — скоро появятся новые прокруты!
                                        </span>
                                    </div>

                                    <motion.button
                                        onClick={handleClose}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full py-3 rounded-2xl font-semibold text-base"
                                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(180,150,220,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        Закрыть
                                    </motion.button>
                                </>
                            ) : (
                                /* ── Обычный экран "не повезло" ── */
                                <>
                                    <motion.div className="text-6xl mb-4 select-none"
                                        animate={{ rotate: [0, -12, 12, -12, 12, 0] }}
                                        transition={{ duration: 0.7, delay: 0.2 }}
                                    >🌙</motion.div>

                                    <h2 className="text-2xl font-black text-white mb-2">Не повезло!</h2>
                                    <p style={{ color: '#a78bca' }} className="text-base mb-6 leading-relaxed">
                                        Удача совсем рядом — попробуй ещё раз!
                                    </p>

                                    <div className="rounded-xl py-3 px-4 mb-5"
                                        style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(212,165,245,0.25)' }}>
                                        <span className="font-bold text-lg" style={{ color: '#d4a5f5' }}>
                                            🎡 {spinsLeft === 1
                                                ? '1 прокрут ещё есть!'
                                                : `${spinsLeft} прокрута ещё есть!`}
                                        </span>
                                    </div>

                                    <motion.button
                                        onClick={handleClose}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full py-4 rounded-2xl font-bold text-lg text-white"
                                        style={{ background: 'linear-gradient(135deg, #9333ea, #db2777)', boxShadow: '0 4px 20px rgba(147,51,234,0.4)' }}
                                    >
                                        Попробовать снова! 🎲
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LoseModal;
