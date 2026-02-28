import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

function formatTime(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Показывает обратный отсчёт до следующего ежедневного бонуса.
 * При достижении нуля показывает кнопку «Обновить» для перезагрузки.
 */
const DailyBonusTimer: React.FC = () => {
    const { nextBonusMs } = useGameStore();
    const [remaining, setRemaining] = useState(nextBonusMs);

    // Обновляем когда пришли новые данные с сервера
    useEffect(() => {
        setRemaining(nextBonusMs);
    }, [nextBonusMs]);

    // Тикаем каждую секунду
    useEffect(() => {
        if (remaining <= 0) return;
        const timer = setInterval(() => {
            setRemaining((prev) => {
                const next = prev - 1000;
                return next <= 0 ? 0 : next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [remaining > 0]); // перезапускаем только при переходе из 0 в >0

    if (remaining <= 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '12px',
                    background: 'rgba(124,58,237,0.2)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '11px',
                    color: 'rgba(196,181,253,0.9)',
                    fontWeight: 600,
                    letterSpacing: '0.4px',
                    marginTop: '4px',
                }}
            >
                <span
                    style={{
                        animation: 'pulse-opacity-text 1.5s ease-in-out infinite',
                    }}
                >
                    🎁
                </span>
                Бонус через {formatTime(remaining)}
            </motion.div>
        </AnimatePresence>
    );
};

export default DailyBonusTimer;
