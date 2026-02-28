import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WheelSpin from './components/Drum/WheelSpin';
import SpinButton from './components/Drum/SpinButton';
import PrizeModal from './components/Modal/PrizeModal';
import LoseModal from './components/Modal/LoseModal';
import WelcomeModal from './components/Modal/WelcomeModal';
import WinnersFeed from './components/WinnersFeed';
import Confetti from './components/Confetti';
import NoSpinsModal from './components/Modal/NoSpinsModal';
import StarBackground from './components/StarBackground';
import AuroraBackground from './components/AuroraBackground';
import PrizeShowcase from './components/PrizeShowcase';
import DailyBonusTimer from './components/DailyBonusTimer';
import BottomNav from './components/BottomNav';
import MyPrizesPage from './components/MyPrizesPage';
import type { PageType } from './components/BottomNav';
import { useSpinLogic } from './hooks/useSpinLogic';
import { useUserData } from './hooks/useUserData';
import { useGameStore } from './store/gameStore';



function App() {
    useUserData(); // загрузка пользователя + daily bonus при каждом входе

    const { spin, isSpinning, spinsLeft } = useSpinLogic();
    const { isLoading, error, firstName, lastResult } = useGameStore();
    const [showNoSpins, setShowNoSpins] = React.useState(false);
    const [activePage, setActivePage] = React.useState<PageType>('main');
    const prizeShowcaseRef = React.useRef<HTMLDivElement>(null);
    const hasScrolled = React.useRef(false);

    // Авто-скролл к призам при первом заходе
    React.useEffect(() => {
        if (!hasScrolled.current && !isLoading) {
            hasScrolled.current = true;
            const timer = setTimeout(() => {
                prizeShowcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    return (
        <div
            className="min-h-screen flex flex-col items-center overflow-x-hidden relative"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #2d1060 0%, #0f0a1e 55%)', paddingTop: '40px', paddingBottom: '140px' }}
        >
            {/* ── Фон ───────────────────────────────────────────────── */}
            <StarBackground />

            <AnimatePresence mode="wait">
                {activePage === 'main' ? (
                    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'contents' }}>
                        {/* ── Шапка ─────────────────────────────────────────────── */}
                        <motion.header className="w-full px-4 pt-5 pb-2 text-center" style={{ zIndex: 10 }}
                            initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
                            <div className="flex items-center justify-center gap-2 mb-0.5">
                                <span className="text-3xl" style={{
                                    display: 'inline-block',
                                    animation: 'gentle-rotate 3s ease-in-out infinite',
                                }}>🎡</span>
                                <h1 style={{
                                    fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px',
                                    background: 'linear-gradient(135deg, #e9d5ff 0%, #f0abfc 50%, #fda4af 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 12px rgba(192,132,252,0.5))',
                                }}>
                                    Мартовская Лихорадка
                                </h1>
                                <span className="text-3xl" style={{
                                    display: 'inline-block',
                                    animation: 'gentle-rotate 3s ease-in-out infinite 0.5s',
                                    '--rotate-to': '-10deg',
                                    '--rotate-from': '10deg',
                                } as React.CSSProperties}>🎡</span>
                            </div>
                            {firstName && (
                                <p style={{ color: '#c084fc', fontSize: '13px', fontWeight: 500 }}>
                                    Привет, {firstName}! ✨
                                </p>
                            )}
                            {/* Таймер ежедневного бонуса */}
                            <div className="flex justify-center">
                                <DailyBonusTimer />
                            </div>
                        </motion.header>

                        {/* ── Лента победителей ─────────────────────────────────── */}
                        <motion.div className="w-full px-3" style={{ zIndex: 1 }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <WinnersFeed />
                        </motion.div>

                        {/* ── Колесо ─────────────────────────────────────────────── */}
                        <motion.div className="relative" style={{ zIndex: 1 }}
                            initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25, duration: 0.5, type: 'spring', stiffness: 160 }}>
                            {/* Свечение за колесом */}
                            <AuroraBackground />
                            <WheelSpin />
                        </motion.div>

                        {/* ── Ошибка ────────────────────────────────────────────── */}
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="mx-4 mt-1 py-2 px-4 rounded-xl text-sm text-center"
                                style={{ zIndex: 1, background: 'rgba(219,39,119,0.15)', border: '1px solid rgba(219,39,119,0.4)', color: '#f9a8d4' }}>
                                ⚠️ {error}
                            </motion.div>
                        )}

                        {/* ── Кнопка спина ──────────────────────────────────────── */}
                        <motion.div className="w-full max-w-xs px-6 mt-8" style={{ zIndex: 1 }}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <SpinButton onSpin={spin} isSpinning={isSpinning} spinsLeft={spinsLeft} isLoading={isLoading} />
                        </motion.div>

                        {/* ── Плашка призов ───────────────────────────────────────── */}
                        <motion.div ref={prizeShowcaseRef} className="w-full flex justify-center mt-8" style={{ zIndex: 1 }}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <PrizeShowcase />
                        </motion.div>

                        <div className="h-6" />

                        {/* ── Конфетти ─────────────────────────────────────────── */}
                        <Confetti active={!isSpinning && !showNoSpins && !!lastResult && lastResult.isWin} />
                    </motion.div>
                ) : (
                    <MyPrizesPage key="prizes" onNavigate={setActivePage} />
                )}
            </AnimatePresence>

            {/* ── Нижняя навигация ──────────────────────────────────── */}
            <BottomNav activePage={activePage} onNavigate={setActivePage} />

            <PrizeModal onNoSpins={() => setShowNoSpins(true)} />
            <LoseModal onNoSpins={() => setShowNoSpins(true)} />
            <WelcomeModal />
            <NoSpinsModal visible={showNoSpins && activePage === 'main'} onClose={() => setShowNoSpins(false)} />
        </div>
    );
}

export default App;
