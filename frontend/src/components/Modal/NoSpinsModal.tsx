import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'wheel_no_spins_since';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

interface NoSpinsModalProps {
    visible: boolean;
    onClose: () => void;
}

function getTimeLeft(): { d: number; h: number; m: number; s: number } {
    const since = Number(localStorage.getItem(STORAGE_KEY) || 0);
    const target = since + THREE_DAYS_MS;
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return { d, h, m, s };
}

const pad = (n: number) => String(n).padStart(2, '0');

const NoSpinsModal: React.FC<NoSpinsModalProps> = ({ visible }) => {
    const [time, setTime] = useState(getTimeLeft);

    // Записываем момент «закончились спины» при первом показе
    useEffect(() => {
        if (visible && !localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
        }
    }, [visible]);

    // Тикаем каждую секунду
    useEffect(() => {
        if (!visible) return;
        const id = setInterval(() => setTime(getTimeLeft()), 1000);
        return () => clearInterval(id);
    }, [visible]);

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Overlay — без onClick, нельзя закрыть тапом */}
                    <motion.div
                        className="fixed inset-0 backdrop-blur-sm"
                        style={{ background: 'rgba(8, 4, 20, 0.88)', zIndex: 80 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    />

                    {/* Card */}
                    <motion.div
                        className="fixed inset-x-4"
                        style={{ top: '10%', zIndex: 90 }}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                    >
                        <div style={{
                            borderRadius: '28px',
                            padding: '2px',
                            background: 'linear-gradient(135deg, #9333ea, #db2777, #f59e0b)',
                        }}>
                            <div style={{
                                borderRadius: '26px',
                                background: 'linear-gradient(160deg, #1a0a2e 0%, #0f0720 60%, #1a0a35 100%)',
                                padding: '36px 28px 36px',
                                textAlign: 'center',
                            }}>
                                {/* Иконка */}
                                <motion.div
                                    animate={{ rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ fontSize: '56px', marginBottom: '12px' }}
                                >⏳</motion.div>

                                <h2 style={{
                                    fontSize: '22px', fontWeight: 900, color: 'white',
                                    marginBottom: '10px', lineHeight: 1.3,
                                }}>
                                    Спины закончились
                                </h2>
                                <p style={{
                                    color: 'rgba(192,132,252,0.85)', fontSize: '14px',
                                    lineHeight: 1.65, marginBottom: '28px',
                                }}>
                                    У вас закончились спины.<br />
                                    Следующие начислятся через{' '}
                                    <span style={{ color: '#d4a5f5', fontWeight: 700 }}>3 дня</span>.
                                </p>

                                {/* Таймер */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '8px',
                                }}>
                                    {[
                                        { label: 'дней', val: time.d },
                                        { label: 'часов', val: time.h },
                                        { label: 'минут', val: time.m },
                                        { label: 'секунд', val: time.s },
                                    ].map(({ label, val }) => (
                                        <div key={label} style={{
                                            borderRadius: '14px', padding: '12px 6px',
                                            background: 'rgba(147,51,234,0.18)',
                                            border: '1.5px solid rgba(147,51,234,0.4)',
                                        }}>
                                            <motion.div
                                                key={val}
                                                initial={{ scale: 1.3, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                                style={{
                                                    fontSize: '28px', fontWeight: 900,
                                                    background: 'linear-gradient(135deg,#e9d5ff,#c084fc)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {pad(val)}
                                            </motion.div>
                                            <div style={{
                                                fontSize: '10px', color: 'rgba(192,132,252,0.6)',
                                                marginTop: '4px', fontWeight: 600,
                                                textTransform: 'uppercase', letterSpacing: '1px',
                                            }}>
                                                {label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NoSpinsModal;
