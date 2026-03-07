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
import ReferralPage from './components/ReferralPage';
import type { PageType } from './components/BottomNav';
import { useSpinLogic } from './hooks/useSpinLogic';
import { useUserData } from './hooks/useUserData';
import { useGameStore } from './store/gameStore';
import { claimReferralCode } from './services/api';
import { useTelegram } from './hooks/useTelegram';



function App() {
    useUserData(); // загрузка пользователя + daily bonus при каждом входе

    const { initData, isReady } = useTelegram();
    const { spin, isSpinning, spinsLeft } = useSpinLogic();
    const { isLoading, error, firstName, lastResult, refreshUser } = useGameStore();
    const [showNoSpins, setShowNoSpins] = React.useState(false);
    const [activePage, setActivePage] = React.useState<PageType>('main');
    const [showPromoModal, setShowPromoModal] = React.useState(false);
    const [promoCode, setPromoCode] = React.useState('');
    const [promoLoading, setPromoLoading] = React.useState(false);
    const [promoMessage, setPromoMessage] = React.useState<{ ok: boolean; text: string } | null>(null);
    const prizeShowcaseRef = React.useRef<HTMLDivElement>(null);
    const hasScrolled = React.useRef(false);
    const referralClaimed = React.useRef(false);

    // Обработка реферального кода при первом открытии.
    // Telegram НЕ передаёт start_param через initDataUnsafe когда Mini App открыт
    // через кнопку web_app — поэтому бот передаёт код в URL как ?ref=XXXX.
    React.useEffect(() => {
        if (!isReady || referralClaimed.current) return;

        const tg = (window as any).Telegram?.WebApp;
        const currentInitData: string = tg?.initData || '';
        if (!currentInitData) return; // нет Telegram окружения

        // Способ 1: ?ref=XXXX в URL (основной — бот добавляет при /start ref_XXXX)
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        // Способ 2: start_param из initDataUnsafe (резервный, работает при прямом deep link)
        const startParam: string | undefined = tg?.initDataUnsafe?.start_param;
        const refFromStartParam = startParam?.startsWith('ref_') ? startParam.slice(4) : undefined;

        const refCode = refFromUrl || refFromStartParam;
        if (refCode) {
            referralClaimed.current = true;
            claimReferralCode(currentInitData, refCode).catch(() => { });
        }
    }, [isReady, initData]);

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
    // Обновляем данные пользователя при каждом возврате на главную страницу
    React.useEffect(() => {
        if (activePage === 'main') {
            refreshUser();
        }
    }, [activePage]);

    const submitPromo = async () => {
        const code = promoCode.trim();
        if (!code || promoLoading) return;
        setPromoLoading(true);
        setPromoMessage(null);
        try {
            const tg = (window as any).Telegram?.WebApp;
            const initDataStr: string = tg?.initData || '';
            const res = await fetch('/api/promo/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initDataStr },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (data.ok) {
                setPromoMessage({ ok: true, text: data.message });
                setPromoCode('');
                refreshUser(); // обновить счётчик спинов
            } else {
                setPromoMessage({ ok: false, text: data.error || 'Ошибка' });
            }
        } catch {
            setPromoMessage({ ok: false, text: 'Ошибка соединения' });
        } finally {
            setPromoLoading(false);
        }
    };

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

                        {/* ── Ввод промокода ────────────────────────────────────── */}
                        <motion.div className="w-full max-w-xs px-6 mt-3" style={{ zIndex: 1 }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
                            <button
                                onClick={() => setShowPromoModal(true)}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid rgba(192,132,252,0.3)',
                                    background: 'rgba(147,51,234,0.12)', color: '#c084fc', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(147,51,234,0.22)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(147,51,234,0.12)')}
                            >
                                🎟️ Ввести промокод
                            </button>
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
                ) : activePage === 'referral' ? (
                    <ReferralPage key="referral" onNavigate={setActivePage} />
                ) : (
                    <MyPrizesPage key="prizes" onNavigate={setActivePage} />
                )}
            </AnimatePresence>

            {/* ── Нижняя навигация ──────────────────────────────────── */}
            <BottomNav activePage={activePage} onNavigate={setActivePage} />

            <PrizeModal onNoSpins={() => setShowNoSpins(true)} />
            <LoseModal onNoSpins={() => setShowNoSpins(true)} />
            <WelcomeModal />
            <NoSpinsModal visible={showNoSpins && activePage === 'main'} onClose={() => setShowNoSpins(false)} onPromo={() => { setShowPromoModal(true); }} />

            {/* ── Промокод модалка ──────────────────────────────────── */}
            <AnimatePresence>
                {showPromoModal && (
                    <motion.div
                        key="promo-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        }}
                        onClick={e => { if (e.target === e.currentTarget) { setShowPromoModal(false); setPromoMessage(null); setPromoCode(''); } }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 20 }}
                            style={{
                                background: 'linear-gradient(145deg, #1a0d35, #0f0820)', border: '1px solid rgba(192,132,252,0.3)',
                                borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '340px',
                            }}
                        >
                            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>🎟️</div>
                            <h2 style={{ textAlign: 'center', color: '#e9d5ff', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>Промокод</h2>
                            <p style={{ textAlign: 'center', color: 'rgba(196,181,253,0.6)', fontSize: '13px', marginBottom: '18px' }}>Введите промокод, чтобы получить бесплатные спины</p>

                            {promoMessage && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '10px', marginBottom: '14px',
                                    background: promoMessage.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    border: `1px solid ${promoMessage.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                                    color: promoMessage.ok ? '#86efac' : '#fca5a5', fontSize: '13px', textAlign: 'center',
                                }}>
                                    {promoMessage.text}
                                </div>
                            )}

                            <input
                                type="text"
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && !promoLoading && submitPromo()}
                                placeholder="Введите промокод"
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(192,132,252,0.3)',
                                    color: '#e9d5ff', fontSize: '15px', letterSpacing: '2px', fontWeight: 700,
                                    outline: 'none', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center',
                                }}
                            />
                            <button
                                onClick={submitPromo}
                                disabled={promoLoading || !promoCode.trim()}
                                style={{
                                    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                                    background: promoLoading || !promoCode.trim() ? 'rgba(147,51,234,0.3)' : 'linear-gradient(135deg,#9333ea,#a855f7)',
                                    color: '#fff', fontSize: '15px', fontWeight: 700, cursor: promoLoading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {promoLoading ? '⏳ Активация...' : '✨ Активировать'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
